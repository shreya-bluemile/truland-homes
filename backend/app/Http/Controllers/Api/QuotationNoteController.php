<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\QuotationNote;
use App\Models\QuotationNoteAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuotationNoteController extends Controller
{
    public function index(Quotation $quotation): JsonResponse
    {
        $notes = $quotation->notes()->with(['user', 'attachments'])->latest('id')->get();

        return response()->json(['data' => $notes->map(fn ($n) => $this->present($n))]);
    }

    public function store(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'files' => ['array'],
            'files.*' => QuotationController::FILE_RULE,
        ], ['body.required' => 'Write a note first.', 'files.*.max' => 'Each file must be 10MB or smaller.']);

        $note = $quotation->notes()->create(['user_id' => $request->user()->id, 'body' => $data['body']]);
        foreach ($request->file('files', []) as $file) {
            $note->attachments()->create([
                'name' => $file->getClientOriginalName(),
                'path' => $file->store("notes/{$note->id}", 'local'),
                'size' => $file->getSize(),
            ]);
        }
        $quotation->log($request->user()->name, "{$request->user()->name} added a note.");

        return response()->json(['data' => $this->present($note->load(['user', 'attachments']))], 201);
    }

    public function update(Request $request, Quotation $quotation, QuotationNote $note): JsonResponse
    {
        abort_unless($note->quotation_id === $quotation->id, 404);
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']], ['body.required' => 'The note can’t be empty.']);
        $note->update($data);
        $quotation->log($request->user()->name, "{$request->user()->name} edited a note.");

        return response()->json(['data' => $this->present($note->load(['user', 'attachments']))]);
    }

    public function destroy(Request $request, Quotation $quotation, QuotationNote $note): JsonResponse
    {
        abort_unless($note->quotation_id === $quotation->id, 404);
        $note->attachments->each(fn ($a) => Storage::disk('local')->delete($a->path));
        $note->delete();
        $quotation->log($request->user()->name, "{$request->user()->name} deleted a note.");

        return response()->json(['message' => 'Note deleted.']);
    }

    public function download(Quotation $quotation, QuotationNoteAttachment $attachment): StreamedResponse
    {
        abort_unless(QuotationNote::whereKey($attachment->quotation_note_id)->where('quotation_id', $quotation->id)->exists(), 404);

        return Storage::disk('local')->download($attachment->path, $attachment->name);
    }

    private function present(QuotationNote $note): array
    {
        return [
            'id' => $note->id,
            'author' => $note->user->name,
            'body' => $note->body,
            'created_at' => $note->created_at->toIso8601String(),
            'attachments' => $note->attachments->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'size' => (int) $a->size]),
        ];
    }
}
