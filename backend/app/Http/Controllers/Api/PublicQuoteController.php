<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuotationRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** The contractor's secure upload page. The token in the emailed link is the only credential. */
class PublicQuoteController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $recipient = $this->find($token);
        if (! $recipient->opened_at) {
            $recipient->update(['opened_at' => now()]);
        }

        return response()->json(['data' => $this->present($recipient)]);
    }

    public function submit(Request $request, string $token): JsonResponse
    {
        $recipient = $this->find($token);
        abort_if($recipient->status === QuotationRecipient::QUOTED, 422, 'You’ve already uploaded a quotation for this request.');

        $data = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,xls,xlsx,csv,doc,docx'],
            'message' => ['nullable', 'string', 'max:5000'],
        ], [
            'file.required' => 'Please upload your quotation.',
            'file.mimes' => 'Please upload a PDF, Excel or Word file.',
            'file.max' => 'The file must be 10MB or smaller.',
        ]);

        $file = $request->file('file');
        $recipient->update([
            'status' => QuotationRecipient::QUOTED,
            'responded_at' => now(),
            'opened_at' => $recipient->opened_at ?? now(),
            'quote_name' => $file->getClientOriginalName(),
            'quote_path' => $file->store("quotes/{$recipient->quotation_id}", 'local'),
            'quote_size' => $file->getSize(),
            'message' => $data['message'] ?? null,
        ]);
        $name = $recipient->contractor->name;
        $recipient->quotation->log($name, "{$name} uploaded a quotation.");

        return response()->json(['data' => $this->present($recipient->fresh())]);
    }

    private function find(string $token): QuotationRecipient
    {
        $recipient = QuotationRecipient::with(['contractor', 'quotation.lot', 'quotation.category'])
            ->where('token', $token)->first();
        abort_unless($recipient && $recipient->quotation->status === 'sent', 404, 'This link is no longer valid.');

        return $recipient;
    }

    private function present(QuotationRecipient $recipient): array
    {
        $quotation = $recipient->quotation;

        return [
            'reference' => $quotation->contractorReference(),
            'category' => $quotation->category->name,
            'lot_address' => trim($quotation->lot->address().', '.$quotation->lot->suburb, ', '),
            'due_date' => $quotation->due_date?->toDateString(),
            'submitted' => $recipient->status === QuotationRecipient::QUOTED,
            'submitted_at' => $recipient->status === QuotationRecipient::QUOTED ? $recipient->responded_at?->toIso8601String() : null,
        ];
    }
}
