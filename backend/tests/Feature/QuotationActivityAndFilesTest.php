<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Models\Quotation;
use App\Models\QuotationActivity;
use App\Models\QuotationContractor;
use App\Models\QuotationNote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\BuildsQuotations;
use Tests\TestCase;
use ZipArchive;

class QuotationActivityAndFilesTest extends TestCase
{
    use BuildsQuotations, RefreshDatabase;

    /** A 1×1 JPEG, so tests don't need the GD extension to fake an image. */
    private const TINY_JPEG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpQuotationWorld();
        Mail::fake();
    }

    // Contractor upload page ---------------------------------------------------------------------

    public function test_contractor_opening_their_link_is_recorded_once(): void
    {
        $recipient = $this->sentQuotation(1)->recipients()->first();

        $this->getJson("/api/public/quotations/{$recipient->token}")
            ->assertOk()
            ->assertJsonPath('data.quote_no', 'Q-0001')
            ->assertJsonPath('data.lot_address', 'Lot 14, 22 Harbour View Road')
            ->assertJsonPath('data.contractor_name', $recipient->contractor->name)
            ->assertJsonPath('data.submitted_at', null);
        $this->getJson("/api/public/quotations/{$recipient->token}")->assertOk();

        $this->assertNotNull($recipient->fresh()->opened_at);
        $this->assertSame(1, QuotationActivity::where('action', 'opened')->count());
    }

    public function test_contractor_uploads_their_quote_and_staff_can_download_it(): void
    {
        $quotation = $this->sentQuotation(1);
        $recipient = $quotation->recipients()->first();
        auth()->forgetGuards(); // the upload page has no staff session

        $this->post("/api/public/quotations/{$recipient->token}/submit", [
            'file' => UploadedFile::fake()->createWithContent('Northline quote.pdf', '%PDF-1.4 quote'),
            'message' => 'Price valid for 30 days.',
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.submitted_file', 'Northline quote.pdf');

        $recipient->refresh();
        $this->assertSame(QuotationContractor::RECEIVED, $recipient->status);
        $this->assertSame('Quoted', $recipient->statusLabel());
        $this->assertDatabaseHas('quotation_activities', ['action' => 'quote_uploaded', 'actor_name' => $recipient->contractor->name]);

        $this->actingAs($this->user);
        $this->getJson("/api/quotations/{$quotation->id}")
            ->assertJsonPath('data.recipients.0.submission.name', 'Northline quote.pdf')
            ->assertJsonPath('data.recipients.0.submission.message', 'Price valid for 30 days.');
        $download = $this->get("/api/quotations/{$quotation->id}/recipients/{$recipient->id}/submission");
        $download->assertOk();
        $this->assertSame('%PDF-1.4 quote', $download->streamedContent());
    }

    public function test_upload_requires_a_quote_file_of_an_accepted_type(): void
    {
        $token = $this->sentQuotation(1)->recipients()->first()->token;

        $this->postJson("/api/public/quotations/{$token}/submit", [])
            ->assertUnprocessable()->assertJsonPath('errors.file.0', 'Choose your quotation file to upload.');
        $this->post("/api/public/quotations/{$token}/submit", ['file' => UploadedFile::fake()->create('quote.exe', 5)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_invalid_draft_and_expired_links_are_refused(): void
    {
        $this->getJson('/api/public/quotations/not-a-real-token')->assertNotFound();

        $draft = Quotation::create(['lot_id' => $this->lot->id, 'status' => Quotation::DRAFT, 'created_by' => $this->user->id]);
        $draftRecipient = $draft->recipients()->create(['contractor_id' => $this->contractors(1)[0]->id]);
        $this->getJson("/api/public/quotations/{$draftRecipient->token}")->assertNotFound();

        $quotation = $this->sentQuotation(1);
        $quotation->forceFill(['due_date' => now()->subDays(QuotationContractor::LINK_GRACE_DAYS + 1)])->save();
        $this->getJson("/api/public/quotations/{$quotation->recipients()->first()->token}")
            ->assertStatus(410)
            ->assertJsonPath('message', 'This quotation request has closed. Reply to the original email if you still want to send a quote.');
    }

    // Notes ----------------------------------------------------------------------------------------

    public function test_notes_can_be_added_with_attachments_edited_and_deleted_by_their_author(): void
    {
        $quotation = $this->sentQuotation(1);
        $base = "/api/quotations/{$quotation->id}/notes";

        $noteId = $this->post($base, [
            'body' => 'Confirmed site access with the council.',
            'files' => [UploadedFile::fake()->create('Site_Brief.pdf', 10, 'application/pdf'), UploadedFile::fake()->createWithContent('Delivery_photo.jpg', base64_decode(self::TINY_JPEG))],
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.author.name', 'John Doe')
            ->assertJsonPath('data.can_edit', true)
            ->assertJsonCount(2, 'data.attachments')
            ->json('data.id');

        $note = QuotationNote::with('attachments')->find($noteId);
        [$brief, $photo] = $note->attachments->all();
        $this->get("{$base}/{$noteId}/attachments/{$brief->id}/download")->assertOk();

        $this->post("{$base}/{$noteId}", ['_method' => 'PUT', 'body' => 'Updated text.', 'remove_attachment_ids' => [$photo->id]],
            ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.body', 'Updated text.')->assertJsonCount(1, 'data.attachments');
        Storage::disk('local')->assertMissing($photo->path);

        $this->getJson($base)->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson("{$base}/{$noteId}")->assertOk();
        Storage::disk('local')->assertMissing($brief->path);
        $this->assertDatabaseCount('quotation_notes', 0);
    }

    public function test_only_the_author_can_change_a_note_and_empty_notes_are_rejected(): void
    {
        $quotation = $this->sentQuotation(1);
        $base = "/api/quotations/{$quotation->id}/notes";
        $this->postJson($base, ['body' => ''])->assertUnprocessable()->assertJsonPath('errors.body.0', 'Write a note before saving.');
        $noteId = $this->postJson($base, ['body' => 'Mine'])->json('data.id');

        $this->actingAs(User::factory()->create());
        $this->getJson($base)->assertJsonPath('data.0.can_edit', false);
        $this->putJson("{$base}/{$noteId}", ['body' => 'Hijacked'])->assertForbidden();
        $this->deleteJson("{$base}/{$noteId}")->assertForbidden();
    }

    // Activities and documents -------------------------------------------------------------------

    public function test_activity_log_is_newest_first_and_paginated(): void
    {
        $quotation = $this->sentQuotation(1);
        for ($i = 1; $i <= 11; $i++) {
            $this->postJson("/api/quotations/{$quotation->id}/notes", ['body' => "Note {$i}"]);
        }

        $this->getJson("/api/quotations/{$quotation->id}/activities")
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.description', 'John Doe added a note.')
            ->assertJsonPath('data.0.actor_name', 'John Doe')
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_documents_download_one_at_a_time_or_all_together_as_a_zip(): void
    {
        $quotation = $this->sentQuotation(1);
        $quotation->documents()->create(['name' => 'A01 – Site Plan.pdf', 'path' => 'x/dup.pdf', 'size' => 3, 'mime_type' => 'application/pdf']);
        Storage::disk('local')->put('x/dup.pdf', 'dup');
        $first = $quotation->documents()->first();

        // Browsers use the UTF-8 name (filename*); the plain name is an ASCII fallback.
        $single = $this->get("/api/quotations/{$quotation->id}/documents/{$first->id}/download")->assertOk();
        $this->assertStringContainsString("filename*=utf-8''".rawurlencode('A01 – Site Plan.pdf'), $single->headers->get('Content-Disposition'));

        $response = $this->get("/api/quotations/{$quotation->id}/documents/download-all")->assertOk()->assertDownload('Q-0001-documents.zip');
        $zip = new ZipArchive;
        $zip->open($response->baseResponse->getFile()->getPathname());
        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $names[] = $zip->getNameIndex($i);
        }
        $this->assertSame(['A01 – Site Plan.pdf', 'A01 – Site Plan (2).pdf'], $names); // same name twice is kept, not overwritten
    }

    // Automatic reminders ------------------------------------------------------------------------

    public function test_automatic_reminder_goes_once_to_non_responders_when_the_reminder_day_arrives(): void
    {
        $quotation = $this->sentQuotation(2); // due in 5 days, reminder 3 days before
        [$awaiting, $responded] = $quotation->recipients()->get()->all();
        $responded->forceFill(['status' => QuotationContractor::NOT_QUOTING])->save();
        Mail::fake();

        $this->artisan('quotations:send-reminders')->expectsOutput('Sent 0 automatic reminders.')->assertSuccessful();

        $this->travel(2)->days(); // now 3 days before the due date
        $this->artisan('quotations:send-reminders')->expectsOutput('Sent 1 automatic reminder.')->assertSuccessful();
        Mail::assertQueued(TemplatedMail::class, fn ($m) => $m->hasTo($awaiting->contractor->email));
        $this->assertNotNull($awaiting->fresh()->auto_reminded_at);
        $this->assertDatabaseHas('quotation_activities', ['action' => 'auto_reminder_sent', 'actor_name' => 'System']);

        $this->travel(1)->days();
        $this->artisan('quotations:send-reminders')->expectsOutput('Sent 0 automatic reminders.');
        Mail::assertQueuedCount(1);
    }
}
