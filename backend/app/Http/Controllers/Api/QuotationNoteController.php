<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Quotation;
use App\Models\QuotationActivity;
use App\Models\QuotationNote;
use App\Models\QuotationNoteAttachment;
use App\Services\FileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuotationNoteController extends Controller
{
    public function __construct(private readonly FileStorage $files) {}

    public function index(Quotation $quotation): AnonymousResourceCollection
    {
        return NoteResource::collection($quotation->notes()->with(['author:id,name', 'attachments'])->get());
    }

    public function store(NoteRequest $request, Quotation $quotation): JsonResponse
    {
        $note = DB::transaction(function () use ($request, $quotation) {
            $note = $quotation->notes()->create(['user_id' => $request->user()->id, 'body' => $request->input('body')]);
            $this->storeAttachments($note, $request->file('files', []));
            QuotationActivity::log($quotation, 'note_added', "{$request->user()->name} added a note.", $request->user());

            return $note;
        });

        return (new NoteResource($note->load(['author:id,name', 'attachments'])))
            ->additional(['message' => 'Note added.'])->response()->setStatusCode(201);
    }

    public function update(NoteRequest $request, Quotation $quotation, QuotationNote $note): NoteResource
    {
        $this->authorizeAuthor($request, $note);

        DB::transaction(function () use ($request, $quotation, $note) {
            $note->update(['body' => $request->input('body')]);
            $removed = $note->attachments()->whereIn('id', $request->input('remove_attachment_ids', []))->get();
            $this->files->delete($removed->pluck('path')->all());
            QuotationNoteAttachment::whereIn('id', $removed->pluck('id'))->delete();
            $this->storeAttachments($note, $request->file('files', []));
            QuotationActivity::log($quotation, 'note_updated', "{$request->user()->name} edited a note.", $request->user());
        });

        return (new NoteResource($note->fresh(['author:id,name', 'attachments'])))->additional(['message' => 'Note updated.']);
    }

    public function destroy(Request $request, Quotation $quotation, QuotationNote $note): JsonResponse
    {
        $this->authorizeAuthor($request, $note);
        $paths = $note->attachments()->pluck('path')->all();
        $note->delete();
        $this->files->delete($paths);
        QuotationActivity::log($quotation, 'note_deleted', "{$request->user()->name} deleted a note.", $request->user());

        return response()->json(['message' => 'Note deleted.']);
    }

    public function downloadAttachment(Quotation $quotation, QuotationNote $note, QuotationNoteAttachment $attachment): StreamedResponse
    {
        return Storage::disk(FileStorage::DISK)->download($attachment->path, $attachment->name);
    }

    private function authorizeAuthor(Request $request, QuotationNote $note): void
    {
        abort_unless($note->user_id === $request->user()->id, 403, 'You can only change notes you wrote.');
    }

    private function storeAttachments(QuotationNote $note, array $uploads): void
    {
        foreach ($uploads as $upload) {
            $note->attachments()->create($this->files->store($upload, "quotations/{$note->quotation_id}/notes"));
        }
    }
}
