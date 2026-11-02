<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipientResource;
use App\Models\Quotation;
use App\Models\QuotationActivity;
use App\Models\QuotationContractor;
use App\Services\FileStorage;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** The Contractors tab: change a contractor's quote status, send reminders, download their quote. */
class QuotationRecipientController extends Controller
{
    public function updateStatus(Request $request, Quotation $quotation, QuotationContractor $recipient): RecipientResource
    {
        abort_if($quotation->isDraft(), 422, 'Send the quotation before updating contractor statuses.');
        $data = $request->validate(['status' => ['required', Rule::in(QuotationContractor::STATUSES)]]);
        $status = $data['status'];

        if ($status !== $recipient->status) {
            $recipient->forceFill(match ($status) {
                QuotationContractor::RECEIVED => [
                    'status' => $status,
                    'response_source' => QuotationContractor::SOURCE_EMAIL,
                    'responded_at' => now(),
                ],
                QuotationContractor::NOT_QUOTING => ['status' => $status, 'response_source' => null, 'responded_at' => now()],
                default => ['status' => $status, 'response_source' => null, 'responded_at' => null],
            })->save();

            $label = $recipient->statusLabel();
            QuotationActivity::log($quotation, 'status_changed',
                "{$request->user()->name} marked {$recipient->contractor->name} as {$label}.", $request->user());
        }

        return new RecipientResource($recipient->load(['contractor', 'latestSubmission']));
    }

    public function remind(Request $request, Quotation $quotation, QuotationContractor $recipient, QuotationService $service): JsonResponse
    {
        abort_if($quotation->isDraft(), 422, 'This quotation hasn’t been sent yet.');
        abort_unless($recipient->status === QuotationContractor::AWAITING, 422,
            'Reminders can only be sent to contractors who haven’t responded.');

        try {
            $service->remind($recipient, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => "Reminder sent to {$recipient->contractor->name}.",
            'data' => new RecipientResource($recipient->fresh(['contractor', 'latestSubmission'])),
        ]);
    }

    public function downloadSubmission(Quotation $quotation, QuotationContractor $recipient): StreamedResponse
    {
        $submission = $recipient->latestSubmission;
        abort_unless($submission, 404, 'This contractor hasn’t uploaded a quotation.');

        return Storage::disk(FileStorage::DISK)->download($submission->path, $submission->original_name);
    }
}
