<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\QuotationRequestMail;
use App\Models\Quotation;
use App\Models\QuotationRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class QuotationRecipientController extends Controller
{
    private const LABELS = [
        QuotationRecipient::RECEIVED => 'Received',
        QuotationRecipient::AWAITING => 'Awaiting',
        QuotationRecipient::NOT_QUOTING => 'Not Quoting',
    ];

    public function updateStatus(Request $request, Quotation $quotation, QuotationRecipient $recipient): JsonResponse
    {
        $this->ensureBelongs($quotation, $recipient);
        $data = $request->validate(['status' => ['required', Rule::in(QuotationRecipient::MANUAL_STATUSES)]]);

        $recipient->update([
            'status' => $data['status'],
            'responded_at' => $data['status'] === QuotationRecipient::AWAITING ? null : now(),
        ]);
        $user = $request->user();
        $quotation->log($user->name, "{$user->name} marked {$recipient->contractor->name} as ".self::LABELS[$data['status']].'.');

        return response()->json(['message' => 'Status updated.']);
    }

    public function remind(Request $request, Quotation $quotation, QuotationRecipient $recipient): JsonResponse
    {
        $this->ensureBelongs($quotation, $recipient);
        abort_if($recipient->hasResponded(), 422, 'This contractor has already responded.');

        Mail::to($recipient->contractor->email)->send(new QuotationRequestMail($recipient, reminder: true));
        $recipient->update(['reminded_at' => now()]);
        $user = $request->user();
        $quotation->log($user->name, "{$user->name} sent a reminder to {$recipient->contractor->name}.");

        return response()->json(['message' => "Reminder sent to {$recipient->contractor->name}."]);
    }

    public function downloadQuote(Quotation $quotation, QuotationRecipient $recipient): StreamedResponse
    {
        $this->ensureBelongs($quotation, $recipient);
        abort_unless($recipient->quote_path, 404);

        return Storage::disk('local')->download($recipient->quote_path, $recipient->quote_name);
    }

    private function ensureBelongs(Quotation $quotation, QuotationRecipient $recipient): void
    {
        abort_unless($recipient->quotation_id === $quotation->id, 404);
        abort_if($quotation->status === Quotation::DRAFT, 422, 'This quotation hasn’t been sent yet.');
    }
}
