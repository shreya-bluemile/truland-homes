<?php

namespace App\Services;

use App\Mail\TemplatedMail;
use App\Models\EmailTemplate;
use App\Models\Quotation;
use App\Models\QuotationActivity;
use App\Models\QuotationContractor;
use App\Models\QuotationDocument;
use App\Models\ScopeTemplate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Throwable;

class QuotationService
{
    public function __construct(
        private readonly FileStorage $files,
        private readonly EmailTemplateRenderer $renderer,
    ) {}

    /**
     * Creates or updates a draft and, when $send is true, emails it to the chosen contractors.
     *
     * @param  array{lot_id?: int, contractor_category_id?: int|null, contractor_ids?: int[], due_date?: string|null,
     *               reminder_days?: int|null, notes?: string|null, keep_document_ids?: int[], template_ids?: int[]}  $data
     * @param  UploadedFile[]  $uploads
     * @return array{quotation: Quotation, failed: string[]}
     */
    public function save(?Quotation $quotation, array $data, array $uploads, User $user, bool $send): array
    {
        if ($send && ! $this->requestTemplate()) {
            throw new RuntimeException('The "Quotation request" email template is missing. Add it under Settings → Email Templates.');
        }

        $isNew = $quotation === null;
        $storedPaths = [];

        try {
            $quotation = DB::transaction(function () use ($quotation, $data, $uploads, $user, $send, $isNew, &$storedPaths) {
                $quotation ??= new Quotation(['created_by' => $user->id, 'status' => Quotation::DRAFT]);
                $quotation->fill([
                    'lot_id' => $data['lot_id'],
                    'contractor_category_id' => $data['contractor_category_id'] ?? null,
                    'due_date' => $data['due_date'] ?? null,
                    'reminder_days' => $data['reminder_days'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);
                $quotation->save();

                $this->syncDocuments($quotation, $data, $uploads, $isNew, $storedPaths);
                $this->syncRecipients($quotation, $data['contractor_ids'] ?? []);

                if ($send) {
                    $quotation->load(['lot', 'category', 'documents', 'recipients.contractor']);
                    $preview = $this->renderRequest($quotation, null);
                    $quotation->forceFill([
                        'status' => Quotation::SENT,
                        'sent_at' => now(),
                        'email_subject' => $preview['subject'],
                        'email_body' => $preview['html'],
                    ])->save();
                } else {
                    QuotationActivity::log($quotation, $isNew ? 'draft_created' : 'draft_updated',
                        $user->name.($isNew ? ' saved the quotation as a draft.' : ' updated the draft.'), $user);
                }

                return $quotation;
            });
        } catch (Throwable $e) {
            $this->files->delete($storedPaths); // don't leave orphaned uploads behind
            throw $e;
        }

        $failed = $send ? $this->sendToRecipients($quotation, $user) : [];

        return ['quotation' => $quotation->fresh(), 'failed' => $failed];
    }

    public function deleteDraft(Quotation $quotation): void
    {
        $paths = $quotation->documents()->pluck('path')->all();
        $quotation->delete();
        $this->files->delete($paths);
    }

    /** Emails a reminder to one contractor. $user is null for automatic reminders. */
    public function remind(QuotationContractor $recipient, ?User $user): void
    {
        $template = EmailTemplate::where('key', EmailTemplate::QUOTATION_REMINDER)->first()
            ?? throw new RuntimeException('The "Quotation reminder" email template is missing. Add it under Settings → Email Templates.');

        $recipient->loadMissing(['contractor', 'quotation.lot', 'quotation.category']);
        $quotation = $recipient->quotation;
        $rendered = $this->renderer->render($template->subject, $template->body,
            $this->values($quotation, $recipient), ['upload_button']);

        Mail::to($recipient->contractor->email, $recipient->contractor->name)
            ->queue(new TemplatedMail($rendered['subject'], $rendered['html']));

        $recipient->forceFill([
            'last_reminded_at' => now(),
            'reminder_count' => $recipient->reminder_count + 1,
            'auto_reminded_at' => $user ? $recipient->auto_reminded_at : now(),
        ])->save();

        QuotationActivity::log(
            $quotation,
            $user ? 'reminder_sent' : 'auto_reminder_sent',
            $user
                ? "{$user->name} sent a reminder to {$recipient->contractor->name}."
                : "Automatic reminder sent to {$recipient->contractor->name}.",
            $user
        );
    }

    /** Renders the request email for one contractor, or a generic preview when $recipient is null. */
    public function renderRequest(Quotation $quotation, ?QuotationContractor $recipient): array
    {
        $template = $this->requestTemplate();

        return $this->renderer->render($template->subject, $template->body,
            $this->values($quotation, $recipient), ['upload_button']);
    }

    private function requestTemplate(): ?EmailTemplate
    {
        return EmailTemplate::where('key', EmailTemplate::QUOTATION_REQUEST)->first();
    }

    /** @return string[] names of contractors whose email could not be sent */
    private function sendToRecipients(Quotation $quotation, User $user): array
    {
        $attachments = $quotation->documents
            ->map(fn (QuotationDocument $d) => ['path' => $d->path, 'name' => $d->name, 'mime_type' => $d->mime_type])
            ->all();

        $sent = 0;
        $failed = [];
        foreach ($quotation->recipients as $recipient) {
            try {
                $rendered = $this->renderRequest($quotation, $recipient);
                Mail::to($recipient->contractor->email, $recipient->contractor->name)
                    ->queue(new TemplatedMail($rendered['subject'], $rendered['html'], $attachments));
                $recipient->forceFill(['sent_at' => now()])->save();
                $sent++;
            } catch (Throwable $e) {
                Log::error('Quotation email failed', [
                    'quotation' => $quotation->quote_no, 'contractor' => $recipient->contractor->email, 'error' => $e->getMessage(),
                ]);
                $failed[] = $recipient->contractor->name;
                QuotationActivity::log($quotation, 'email_failed',
                    "The email to {$recipient->contractor->name} could not be sent.", $user);
            }
        }

        if ($sent > 0) {
            QuotationActivity::log($quotation, 'sent',
                "{$user->name} sent the quotation to {$sent} ".str('contractor')->plural($sent).'.', $user);
        }

        return $failed;
    }

    private function values(Quotation $quotation, ?QuotationContractor $recipient): array
    {
        $uploadLink = $recipient ? $recipient->uploadUrl() : rtrim(config('app.frontend_url'), '/').'/quote/…';
        $category = $quotation->category?->name ?? '';

        return [
            'contractor_name' => $recipient?->contractor->name ?? '[Contractor Name]',
            'quote_no' => $quotation->quote_no,
            'category' => $category,
            'category_lower' => mb_strtolower($category),
            'lot_address' => $quotation->lot->address,
            'lot_short' => $quotation->lot->shortName(),
            'floor_plan' => $quotation->lot->floor_plan ?? '',
            'due_date' => $quotation->due_date?->format('d-m-Y') ?? '',
            'due_date_long' => $quotation->due_date?->format('l j F Y') ?? '',
            'notes' => $quotation->notes ?? '',
            'upload_link' => $uploadLink,
            'upload_button' => $this->uploadButton($uploadLink),
        ];
    }

    private function uploadButton(string $url): string
    {
        $href = e($url);

        return '<p style="text-align:center;margin:22px 0 6px;">'
            .'<a href="'.$href.'" style="display:inline-block;background:#dc2530;color:#ffffff;text-decoration:none;'
            .'font-weight:600;padding:11px 22px;border-radius:4px;">Upload your quotation</a></p>'
            .'<p style="text-align:center;color:#6b7280;font-size:12px;margin:0 0 18px;">Button not working? Copy this link:<br>'
            .$href.'</p>';
    }

    private function syncDocuments(Quotation $quotation, array $data, array $uploads, bool $isNew, array &$storedPaths): void
    {
        $directory = "quotations/{$quotation->id}/documents";

        if (! $isNew) {
            $keep = $data['keep_document_ids'] ?? [];
            $removed = $quotation->documents()->whereNotIn('id', $keep)->get();
            $this->files->delete($removed->pluck('path')->all());
            QuotationDocument::whereIn('id', $removed->pluck('id'))->delete();
        }

        $templateIds = $data['template_ids'] ?? [];
        if ($templateIds) {
            $alreadyAdded = $quotation->documents()->whereNotNull('scope_template_id')->pluck('scope_template_id')->all();
            $templates = ScopeTemplate::whereIn('id', $templateIds)
                ->where('contractor_category_id', $quotation->contractor_category_id)
                ->whereNotIn('id', $alreadyAdded)
                ->get();
            foreach ($templates as $template) {
                $path = $this->files->copy($template->path, $directory, $template->name);
                $storedPaths[] = $path;
                $quotation->documents()->create([
                    'scope_template_id' => $template->id,
                    'name' => $template->name,
                    'path' => $path,
                    'size' => $template->size,
                    'mime_type' => $template->mime_type,
                ]);
            }
        }

        foreach ($uploads as $upload) {
            $stored = $this->files->store($upload, $directory);
            $storedPaths[] = $stored['path'];
            $quotation->documents()->create($stored);
        }
    }

    private function syncRecipients(Quotation $quotation, array $contractorIds): void
    {
        $quotation->recipients()->whereNotIn('contractor_id', $contractorIds)->delete();
        $existing = $quotation->recipients()->pluck('contractor_id')->all();
        foreach (array_diff($contractorIds, $existing) as $contractorId) {
            $quotation->recipients()->create(['contractor_id' => $contractorId]);
        }
    }
}
