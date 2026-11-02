<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\QuotationRequestMail;
use App\Models\CategoryDocument;
use App\Models\Contractor;
use App\Models\ContractorCategory;
use App\Models\Lot;
use App\Models\LotDocument;
use App\Models\Quotation;
use App\Models\QuotationDocument;
use App\Models\QuotationRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class QuotationController extends Controller
{
    public const FILE_RULE = 'file|max:10240|mimes:pdf,xls,xlsx,csv,doc,docx,jpg,jpeg,png';

    /** Lots, trades, contractors and template documents for the Create Quotation form and the filters. */
    public function options(): JsonResponse
    {
        return response()->json([
            'lots' => Lot::with('documents')->orderBy('lot_number')->get()->map(fn (Lot $lot) => [
                'id' => $lot->id,
                'label' => $lot->label(),
                'address' => $lot->address(),
                'floor_plan' => $lot->floor_plan,
                'documents' => $lot->documents->map(fn ($d) => $this->file($d)),
            ]),
            'categories' => ContractorCategory::with(['contractors' => fn ($q) => $q->orderBy('name'), 'documents'])
                ->orderBy('name')->get()->map(fn (ContractorCategory $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'contractors' => $c->contractors->map(fn ($k) => ['id' => $k->id, 'name' => $k->name, 'email' => $k->email]),
                    'documents' => $c->documents->map(fn ($d) => $this->file($d)),
                ]),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Quotation::with(['lot', 'category', 'creator', 'recipients'])->latest('id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where('number', 'like', "%{$search}%");
        }
        if ($lotId = $request->query('lot_id')) {
            $query->where('lot_id', $lotId);
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('contractor_category_id', $categoryId);
        }
        $since = match ($request->query('date')) {
            'today' => Carbon::today(),
            '7' => Carbon::today()->subDays(6),
            '30' => Carbon::today()->subDays(29),
            'month' => Carbon::today()->startOfMonth(),
            default => null,
        };
        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        return response()->json(['data' => $query->get()->map(fn (Quotation $q) => $this->summary($q))]);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json(['data' => $this->detail($quotation)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $quotation = DB::transaction(function () use ($request, $data) {
            $quotation = Quotation::create([
                'number' => Quotation::nextNumber(),
                'created_by' => $request->user()->id,
                'status' => Quotation::DRAFT,
            ] + $this->attributes($data));
            $this->syncDocuments($quotation, $request, $data);
            $this->syncRecipients($quotation, $data['contractor_ids'] ?? []);

            return $quotation;
        });

        return $this->finish($request, $quotation, $data, created: true);
    }

    /** Edit a draft, or send it. Sent quotations can't be changed. */
    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        abort_if($quotation->status !== Quotation::DRAFT, 422, 'This quotation has already been sent.');
        $data = $this->validated($request);
        DB::transaction(function () use ($request, $data, $quotation) {
            $quotation->update($this->attributes($data));
            $this->syncDocuments($quotation, $request, $data);
            $this->syncRecipients($quotation, $data['contractor_ids'] ?? []);
        });

        return $this->finish($request, $quotation, $data, created: false);
    }

    public function downloadDocument(Quotation $quotation, QuotationDocument $document): StreamedResponse
    {
        abort_unless($document->quotation_id === $quotation->id, 404);

        return Storage::disk('local')->download($document->path, $document->name);
    }

    public function downloadAll(Quotation $quotation)
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'quote');
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::OVERWRITE);
        foreach ($quotation->documents as $document) {
            if (Storage::disk('local')->exists($document->path)) {
                $zip->addFile(Storage::disk('local')->path($document->path), $document->name);
            }
        }
        $zip->close();

        return response()->download($zipPath, "{$quotation->number} documents.zip")->deleteFileAfterSend();
    }

    private function validated(Request $request): array
    {
        $sending = $request->input('action') === 'send';
        $required = $sending ? 'required' : 'nullable';

        return $request->validate([
            'action' => ['required', Rule::in(['draft', 'send'])],
            'lot_id' => ['required', 'exists:lots,id'],
            'contractor_category_id' => ['required', 'exists:contractor_categories,id'],
            'contractor_ids' => [$required, 'array', $sending ? 'min:1' : 'min:0'],
            'contractor_ids.*' => ['integer', Rule::exists('contractors', 'id')->where('contractor_category_id', $request->input('contractor_category_id'))],
            'due_date' => [$required, 'date', $sending ? 'after_or_equal:today' : 'nullable'],
            'reminder_days' => ['nullable', 'integer', Rule::in([1, 2, 3, 5, 7])],
            'lot_document_ids' => ['array'],
            'lot_document_ids.*' => ['integer', 'exists:lot_documents,id'],
            'template_document_ids' => ['array'],
            'template_document_ids.*' => ['integer', 'exists:category_documents,id'],
            'document_ids' => ['array'],
            'document_ids.*' => ['integer'],
            'files' => ['array'],
            'files.*' => self::FILE_RULE,
        ], [
            'contractor_ids.required' => 'Select at least one contractor.',
            'contractor_ids.min' => 'Select at least one contractor.',
            'contractor_ids.*.exists' => 'Contractors must belong to the selected category.',
            'due_date.required' => 'Choose a due date.',
            'due_date.after_or_equal' => 'The due date can’t be in the past.',
            'files.*.max' => 'Each file must be 10MB or smaller.',
        ]);
    }

    private function attributes(array $data): array
    {
        return [
            'lot_id' => $data['lot_id'],
            'contractor_category_id' => $data['contractor_category_id'],
            'due_date' => $data['due_date'] ?? null,
            'reminder_days' => $data['reminder_days'] ?? null,
        ];
    }

    /** Keeps the chosen existing documents and adds lot plans, trade templates and uploads. */
    private function syncDocuments(Quotation $quotation, Request $request, array $data): void
    {
        $quotation->documents()->whereNotIn('id', $data['document_ids'] ?? [])->get()->each(function ($doc) {
            if ($doc->source === 'upload') {
                Storage::disk('local')->delete($doc->path);
            }
            $doc->delete();
        });

        $existing = $quotation->documents()->pluck('path')->all();
        $add = fn ($doc, $source) => in_array($doc->path, $existing, true) ? null
            : $quotation->documents()->create(['name' => $doc->name, 'path' => $doc->path, 'size' => $doc->size, 'source' => $source]);

        LotDocument::whereIn('id', $data['lot_document_ids'] ?? [])->where('lot_id', $quotation->lot_id)->get()
            ->each(fn ($doc) => $add($doc, 'lot'));
        CategoryDocument::whereIn('id', $data['template_document_ids'] ?? [])
            ->where('contractor_category_id', $quotation->contractor_category_id)->get()
            ->each(fn ($doc) => $add($doc, 'template'));

        foreach ($request->file('files', []) as $file) {
            $quotation->documents()->create([
                'name' => $file->getClientOriginalName(),
                'path' => $file->store("quotations/{$quotation->id}", 'local'),
                'size' => $file->getSize(),
                'source' => 'upload',
            ]);
        }
    }

    private function syncRecipients(Quotation $quotation, array $contractorIds): void
    {
        $quotation->recipients()->whereNotIn('contractor_id', $contractorIds)->delete();
        foreach ($contractorIds as $id) {
            $quotation->recipients()->firstOrCreate(['contractor_id' => $id], ['token' => Str::random(40)]);
        }
    }

    private function finish(Request $request, Quotation $quotation, array $data, bool $created): JsonResponse
    {
        $user = $request->user();
        $quotation->refresh();

        if ($data['action'] === 'send') {
            $quotation->update(['status' => Quotation::SENT, 'sent_at' => now()]);
            foreach ($quotation->recipients()->with('contractor')->get() as $recipient) {
                Mail::to($recipient->contractor->email)->send(new QuotationRequestMail($recipient));
                $recipient->update(['sent_at' => now()]);
            }
            $count = $quotation->recipients()->count();
            $quotation->log($user->name, "{$user->name} sent the quotation to {$count} ".Str::plural('contractor', $count).'.');
        } else {
            $quotation->log($user->name, $created ? "{$user->name} saved the quotation as a draft." : "{$user->name} updated the draft.");
        }

        return response()->json(['data' => $this->detail($quotation->fresh())], $created ? 201 : 200);
    }

    public function summary(Quotation $q): array
    {
        $recipients = $q->recipients;
        $quoted = $recipients->whereIn('status', [QuotationRecipient::QUOTED, QuotationRecipient::RECEIVED])->count();

        return [
            'id' => $q->id,
            'number' => $q->number,
            'lot_address' => $q->lot->address(),
            'category' => $q->category->name,
            'contractor_count' => $recipients->count(),
            'quoted_count' => $quoted,
            'opened_count' => $recipients->whereNotNull('opened_at')->where('status', QuotationRecipient::AWAITING)->count(),
            'created_by' => $q->creator->name,
            'created_at' => $q->created_at?->toIso8601String(),
            'due_date' => $q->due_date?->toDateString(),
            ...$q->overallStatus(),
        ];
    }

    private function detail(Quotation $q): array
    {
        $q->load(['lot', 'category', 'creator', 'documents', 'recipients.contractor']);

        return $this->summary($q) + [
            'draft' => $q->status === Quotation::DRAFT,
            'lot_id' => $q->lot_id,
            'contractor_category_id' => $q->contractor_category_id,
            'floor_plan' => $q->lot->floor_plan,
            'reminder_days' => $q->reminder_days,
            'subject' => $q->emailSubject(),
            'contractor_reference' => $q->contractorReference(),
            'documents' => $q->documents->map(fn ($d) => $this->file($d) + ['source' => $d->source]),
            'recipients' => $q->recipients->sortBy('contractor.name')->values()->map(fn (QuotationRecipient $r) => [
                'id' => $r->id,
                'contractor_id' => $r->contractor_id,
                'name' => $r->contractor->name,
                'email' => $r->contractor->email,
                'status' => $r->status,
                'sent_at' => $r->sent_at?->toIso8601String(),
                'opened_at' => $r->opened_at?->toIso8601String(),
                'responded_at' => $r->responded_at?->toIso8601String(),
                'reminded_at' => $r->reminded_at?->toIso8601String(),
                'quote' => $r->quote_path ? ['name' => $r->quote_name, 'size' => $r->quote_size] : null,
                'message' => $r->message,
            ]),
        ];
    }

    private function file($doc): array
    {
        return ['id' => $doc->id, 'name' => $doc->name, 'size' => (int) $doc->size];
    }
}
