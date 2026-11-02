<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** An email whose subject and body come from an email template, wrapped in the branded layout. */
class TemplatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, array{path: string, name: string, mime_type: string|null}>  $files  files on the local disk
     */
    public function __construct(
        public string $mailSubject,
        public string $bodyHtml,
        public array $files = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.layout', with: ['html' => $this->bodyHtml]);
    }

    public function attachments(): array
    {
        return array_map(
            fn (array $file) => Attachment::fromStorageDisk('local', $file['path'])
                ->as($file['name'])
                ->withMime($file['mime_type'] ?: 'application/octet-stream'),
            $this->files
        );
    }
}
