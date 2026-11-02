<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Models\Contractor;
use App\Models\EmailTemplate;
use App\Models\Quotation;
use App\Models\ScopeTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\BuildsQuotations;
use Tests\TestCase;

class QuotationSaveTest extends TestCase
{
    use BuildsQuotations, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpQuotationWorld();
        Mail::fake();
    }

    public function test_sending_emails_each_contractor_their_own_link_with_the_documents_attached(): void
    {
        $contractors = $this->contractors(2);

        $response = $this->post('/api/quotations', $this->sendPayload($contractors), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.quote_no', 'Q-0001')
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.display_status.key', 'awaiting')
            ->assertJsonPath('data.counts.contractors', 2)
            ->assertJsonPath('message', 'Quotation Q-0001 sent.');

        $quotation = Quotation::with('recipients')->first();
        foreach ($contractors as $contractor) {
            $recipient = $quotation->recipients->firstWhere('contractor_id', $contractor->id);
            $this->assertNotNull($recipient->sent_at);
            Mail::assertQueued(TemplatedMail::class, fn (TemplatedMail $mail) => $mail->hasTo($contractor->email)
                && str_contains($mail->bodyHtml, 'Hi '.e($contractor->name))
                && str_contains($mail->bodyHtml, '/quote/'.$recipient->token)
                && str_contains($mail->bodyHtml, 'Site access is via the rear lane.')
                && $mail->mailSubject === 'Quotation Request Q-0001 – Concrete – Lot 14'
                && count($mail->files) === 1);
        }
        Mail::assertQueuedCount(2);

        // The Details tab shows a generic copy of what was sent, without anyone's private link.
        $this->assertStringContainsString('[Contractor Name]', $quotation->email_body);
        $this->assertStringNotContainsString($quotation->recipients->first()->token, $quotation->email_body);
        $this->assertSame('Quotation Request Q-0001 – Concrete – Lot 14', $response->json('data.email.subject'));
        $this->assertDatabaseHas('quotation_activities', ['action' => 'sent', 'description' => 'John Doe sent the quotation to 2 contractors.']);
        Storage::disk('local')->assertExists($quotation->documents()->first()->path);
    }

    public function test_send_requires_every_starred_field(): void
    {
        $this->postJson('/api/quotations', ['action' => 'send', 'lot_id' => $this->lot->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['contractor_category_id', 'contractor_ids', 'due_date']);
        Mail::assertNothingQueued();
    }

    public function test_a_draft_needs_only_a_lot_and_sends_nothing(): void
    {
        $this->postJson('/api/quotations', ['action' => 'draft'])->assertUnprocessable()->assertJsonValidationErrors('lot_id');

        $this->postJson('/api/quotations', ['action' => 'draft', 'lot_id' => $this->lot->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.display_status.label', 'Draft')
            ->assertJsonPath('message', 'Draft Q-0001 saved.');
        Mail::assertNothingQueued();
        $this->assertDatabaseHas('quotation_activities', ['action' => 'draft_created']);
    }

    public function test_contractors_must_belong_to_the_chosen_category_and_be_active(): void
    {
        $other = Contractor::factory()->create();
        $inactive = Contractor::factory()->create(['contractor_category_id' => $this->category->id, 'is_active' => false]);

        foreach ([$other, $inactive] as $contractor) {
            $this->post('/api/quotations', $this->sendPayload([$contractor]), ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('contractor_ids.0');
        }
    }

    public function test_due_date_cannot_be_in_the_past_and_reminder_must_be_an_offered_option(): void
    {
        $payload = $this->sendPayload($this->contractors(1), ['due_date' => now()->subDay()->format('Y-m-d'), 'reminder_days' => 4]);
        $this->post('/api/quotations', $payload, ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['due_date', 'reminder_days'])
            ->assertJsonPath('errors.due_date.0', 'The due date can’t be in the past.');
    }

    public function test_only_document_types_and_sizes_we_accept_can_be_uploaded(): void
    {
        $contractors = $this->contractors(1);
        foreach ([
            UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload'),
            UploadedFile::fake()->create('huge.pdf', 10241, 'application/pdf'),
        ] as $file) {
            $this->post('/api/quotations', $this->sendPayload($contractors, ['files' => [$file]]), ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('files.0');
        }
    }

    public function test_scope_templates_for_the_category_are_copied_into_the_quotation(): void
    {
        Storage::disk('local')->put('scope-templates/1/spec.pdf', '%PDF-1.4 spec');
        $template = ScopeTemplate::create([
            'contractor_category_id' => $this->category->id, 'name' => 'Slab Specification.pdf',
            'path' => 'scope-templates/1/spec.pdf', 'size' => 13, 'mime_type' => 'application/pdf',
        ]);

        $id = $this->post('/api/quotations', $this->sendPayload($this->contractors(1), ['template_ids' => [$template->id]]),
            ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.documents.0.name', 'Slab Specification.pdf')
            ->assertJsonPath('data.documents.0.is_template', true)
            ->json('data.id');

        $copy = Quotation::find($id)->documents()->whereNotNull('scope_template_id')->first();
        $this->assertNotSame($template->path, $copy->path); // a copy, so editing the template later doesn't change sent quotations
        $this->assertSame('%PDF-1.4 spec', Storage::disk('local')->get($copy->path));
    }

    public function test_a_draft_can_be_edited_then_sent(): void
    {
        $contractors = $this->contractors(2);
        $id = $this->post('/api/quotations', [
            'action' => 'draft', 'lot_id' => $this->lot->id, 'contractor_category_id' => $this->category->id,
            'contractor_ids' => [$contractors[0]->id],
            'files' => [UploadedFile::fake()->create('old.pdf', 5, 'application/pdf')],
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
        $oldPath = Quotation::find($id)->documents()->first()->path;

        // Remove the old document, swap the contractor, and send.
        $this->post("/api/quotations/{$id}", $this->sendPayload([$contractors[1]], [
            '_method' => 'PUT', 'keep_document_ids' => [],
            'files' => [UploadedFile::fake()->create('new.pdf', 5, 'application/pdf')],
        ]), ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonPath('data.documents.0.name', 'new.pdf')
            ->assertJsonPath('data.contractor_ids', [$contractors[1]->id]);

        Storage::disk('local')->assertMissing($oldPath);
        Mail::assertQueuedCount(1);
        Mail::assertQueued(TemplatedMail::class, fn ($m) => $m->hasTo($contractors[1]->email));
    }

    public function test_sent_quotations_cannot_be_edited_or_deleted(): void
    {
        $quotation = $this->sentQuotation();

        $this->post("/api/quotations/{$quotation->id}", $this->sendPayload($this->contractors(1), ['_method' => 'PUT']),
            ['Accept' => 'application/json'])->assertUnprocessable();
        $this->deleteJson("/api/quotations/{$quotation->id}")->assertUnprocessable();
    }

    public function test_deleting_a_draft_removes_its_files(): void
    {
        $id = $this->post('/api/quotations', ['action' => 'draft', 'lot_id' => $this->lot->id,
            'files' => [UploadedFile::fake()->create('a.pdf', 5, 'application/pdf')]], ['Accept' => 'application/json'])->json('data.id');
        $path = Quotation::find($id)->documents()->first()->path;

        $this->deleteJson("/api/quotations/{$id}")->assertOk();
        $this->assertDatabaseMissing('quotations', ['id' => $id]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_sending_without_the_request_template_gives_a_clear_error(): void
    {
        EmailTemplate::where('key', EmailTemplate::QUOTATION_REQUEST)->delete();

        $this->post('/api/quotations', $this->sendPayload($this->contractors(1)), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The "Quotation request" email template is missing. Add it under Settings → Email Templates.');
        $this->assertDatabaseCount('quotations', 0);
    }

    public function test_notes_section_is_left_out_of_the_email_when_there_are_no_notes(): void
    {
        $this->post('/api/quotations', $this->sendPayload($this->contractors(1), ['notes' => null]), ['Accept' => 'application/json'])
            ->assertCreated();
        Mail::assertQueued(TemplatedMail::class, fn ($m) => ! str_contains($m->bodyHtml, 'Notes from our team')
            && str_contains($m->bodyHtml, 'Floor plan: Co-living'));
    }
}
