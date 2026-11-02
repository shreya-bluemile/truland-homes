<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitQuotationRequest;
use App\Models\Quotation;
use App\Models\QuotationActivity;
use App\Models\QuotationContractor;
use App\Services\FileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * The contractor-facing upload page. No login: the long random token in the emailed link
 * identifies the contractor and the quotation.
 */
class PublicQuotationController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $recipient = $this->resolve($token);

        if ($recipient->opened_at === null) {
            $recipient->forceFill(['opened_at' => now()])->save();
            QuotationActivity::log($recipient->quotation, 'opened',
                "{$recipient->contractor->name} opened the quotation request.", $recipient->contractor->name);
        }

        return response()->json(['data' => $this->payload($recipient)]);
    }

    public function submit(SubmitQuotationRequest $request, string $token, FileStorage $files): JsonResponse
    {
        $recipient = $this->resolve($token);
        $stored = $files->store($request->file('file'), "quotations/{$recipient->quotation_id}/submissions");

        DB::transaction(function () use ($recipient, $stored, $request) {
            $recipient->submissions()->create([
                'original_name' => $stored['name'],
                'path' => $stored['path'],
                'size' => $stored['size'],
                'mime_type' => $stored['mime_type'],
                'message' => $request->input('message'),
            ]);
            $recipient->forceFill([
                'status' => QuotationContractor::RECEIVED,
                'response_source' => QuotationContractor::SOURCE_PORTAL,
                'responded_at' => now(),
                'opened_at' => $recipient->opened_at ?? now(),
            ])->save();
            QuotationActivity::log($recipient->quotation, 'quote_uploaded',
                "{$recipient->contractor->name} uploaded a quotation.", $recipient->contractor->name);
        });

        return response()->json(['message' => 'Quotation received.', 'data' => $this->payload($recipient->fresh())], 201);
    }

    private function resolve(string $token): QuotationContractor
    {
        $recipient = QuotationContractor::with(['contractor', 'quotation.lot', 'quotation.category', 'latestSubmission'])
            ->where('token', $token)
            ->first();

        abort_if(! $recipient || $recipient->quotation->status !== Quotation::SENT, 404,
            'This link isn’t valid. Check that you copied the whole link from the email.');
        abort_if($recipient->linkExpired(), 410,
            'This quotation request has closed. Reply to the original email if you still want to send a quote.');

        return $recipient;
    }

    private function payload(QuotationContractor $recipient): array
    {
        $quotation = $recipient->quotation;
        $submission = $recipient->latestSubmission;

        return [
            'quote_no' => $quotation->quote_no,
            'category' => $quotation->category?->name,
            'lot_address' => $quotation->lot->address,
            'due_date' => $quotation->due_date?->format('Y-m-d'),
            'contractor_name' => $recipient->contractor->name,
            'submitted_at' => $submission?->created_at->toIso8601String(),
            'submitted_file' => $submission?->original_name,
        ];
    }
}
