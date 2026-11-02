<?php

namespace App\Mail;

use App\Models\QuotationRecipient;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** The quotation request (or a reminder) sent to one contractor, with their secure upload link. */
class QuotationRequestMail extends Mailable
{
    public function __construct(public QuotationRecipient $recipient, public bool $reminder = false) {}

    public function envelope(): Envelope
    {
        $subject = $this->recipient->quotation->emailSubject();

        return new Envelope(subject: $this->reminder ? "Reminder: {$subject}" : $subject);
    }

    public function content(): Content
    {
        $quotation = $this->recipient->quotation->loadMissing(['lot', 'category', 'documents']);

        return new Content(view: 'emails.quotation-request', with: [
            'quotation' => $quotation,
            'contractor' => $this->recipient->contractor,
            'uploadUrl' => $this->recipient->uploadUrl(),
            'reminder' => $this->reminder,
        ]);
    }

    public function attachments(): array
    {
        return $this->recipient->quotation->documents
            ->map(fn ($doc) => Attachment::fromStorageDisk('local', $doc->path)->as($doc->name))
            ->all();
    }
}
