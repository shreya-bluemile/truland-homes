<?php

namespace Tests\Feature;

use App\Mail\QuotationRequestMail;
use App\Models\Quotation;
use App\Models\QuotationRecipient;
use App\Models\User;
use Database\Seeders\QuotationDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QuotationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Mail::fake();
        User::factory()->create(['name' => 'Admin']);
        $this->seed(QuotationDemoSeeder::class);
    }

    private function payload(array $overrides = []): array
    {
        $options = $this->getJson('/api/quotation-options')->json();
        $lot = $options['lots'][0];
        $category = collect($options['categories'])->firstWhere('name', 'Concrete');

        return $overrides + [
            'action' => 'send',
            'lot_id' => $lot['id'],
            'contractor_category_id' => $category['id'],
            'contractor_ids' => collect($category['contractors'])->take(2)->pluck('id')->all(),
            'due_date' => now()->addWeek()->toDateString(),
            'reminder_days' => 3,
            'lot_document_ids' => collect($lot['documents'])->pluck('id')->all(),
            'template_document_ids' => collect($category['documents'])->pluck('id')->all(),
            'files' => [UploadedFile::fake()->create('Extra.pdf', 100, 'application/pdf')],
        ];
    }

    public function test_demo_data_lists_with_overall_statuses(): void
    {
        $rows = collect($this->getJson('/api/quotations')->assertOk()->json('data'))->keyBy('number');

        $this->assertSame('received', $rows['Q-0145']['status']);
        $this->assertSame('overdue', $rows['Q-0146']['status']);
        $this->assertSame(2, $rows['Q-0146']['overdue_days']);
        $this->assertSame('received', $rows['Q-0147']['status']);
        $this->assertSame('awaiting', $rows['Q-0148']['status']);
        $this->assertSame(1, $rows['Q-0148']['quoted_count']);
    }

    public function test_filters_by_quote_number_and_category(): void
    {
        $this->getJson('/api/quotations?search=0147')->assertJsonCount(1, 'data')->assertJsonPath('data.0.number', 'Q-0147');
        $roofing = collect($this->getJson('/api/quotation-options')->json('categories'))->firstWhere('name', 'Roofing');
        $this->getJson('/api/quotations?category_id='.$roofing['id'])->assertJsonCount(1, 'data');
    }

    public function test_sending_a_quotation_emails_each_contractor_with_documents(): void
    {
        $response = $this->post('/api/quotations', $this->payload(), ['Accept' => 'application/json'])->assertCreated();

        $response->assertJsonPath('data.number', 'Q-0149')
            ->assertJsonPath('data.status', 'awaiting')
            ->assertJsonCount(2, 'data.recipients')
            ->assertJsonCount(7, 'data.documents'); // 4 lot plans + 2 templates + 1 upload
        Mail::assertSent(QuotationRequestMail::class, 2);
    }

    public function test_sending_requires_contractors_and_a_due_date(): void
    {
        $this->post('/api/quotations', $this->payload(['contractor_ids' => [], 'due_date' => '']), ['Accept' => 'application/json'])
            ->assertStatus(422)->assertJsonValidationErrors(['contractor_ids', 'due_date']);
    }

    public function test_draft_is_saved_without_email_and_can_be_sent_later(): void
    {
        $id = $this->post('/api/quotations', $this->payload(['action' => 'draft']), ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');
        Mail::assertNothingSent();

        $documentIds = Quotation::find($id)->documents()->pluck('id')->all();
        $this->post("/api/quotations/{$id}", $this->payload(['document_ids' => $documentIds, 'files' => []]), ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.status', 'awaiting')->assertJsonCount(7, 'data.documents');
        Mail::assertSent(QuotationRequestMail::class, 2);
    }

    public function test_status_change_reminder_and_activity_log(): void
    {
        $quotation = Quotation::where('number', 'Q-0148')->first();
        $recipient = $quotation->recipients()->where('status', QuotationRecipient::AWAITING)->first();

        $this->postJson("/api/quotations/{$quotation->id}/recipients/{$recipient->id}/remind")->assertOk();
        Mail::assertSent(QuotationRequestMail::class, fn ($mail) => $mail->reminder);

        $this->patchJson("/api/quotations/{$quotation->id}/recipients/{$recipient->id}", ['status' => 'not_quoting'])->assertOk();
        $this->assertSame('not_quoting', $recipient->fresh()->status);

        $this->getJson("/api/quotations/{$quotation->id}/activities")->assertOk()
            ->assertJsonPath('data.0.description', "Admin marked {$recipient->contractor->name} as Not Quoting.");
    }

    public function test_notes_with_attachments(): void
    {
        $quotation = Quotation::where('number', 'Q-0148')->first();
        $note = $this->post("/api/quotations/{$quotation->id}/notes", [
            'body' => 'Materials delivered.',
            'files' => [UploadedFile::fake()->create('Delivery_photo.jpg', 50, 'image/jpeg')],
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.attachments.0.name', 'Delivery_photo.jpg')->json('data');

        $this->putJson("/api/quotations/{$quotation->id}/notes/{$note['id']}", ['body' => 'Edited'])->assertJsonPath('data.body', 'Edited');
        $this->deleteJson("/api/quotations/{$quotation->id}/notes/{$note['id']}")->assertOk();
    }

    public function test_contractor_uploads_a_quote_through_the_secure_link(): void
    {
        $recipient = Quotation::where('number', 'Q-0148')->first()->recipients()->where('status', QuotationRecipient::AWAITING)->first();

        $this->getJson("/api/public/quotes/{$recipient->token}")->assertOk()
            ->assertJsonPath('data.reference', 'CQ-0148')->assertJsonPath('data.submitted', false);
        $this->assertNotNull($recipient->fresh()->opened_at);

        $this->post("/api/public/quotes/{$recipient->token}", [
            'file' => UploadedFile::fake()->create('Quote.pdf', 200, 'application/pdf'),
            'message' => 'Price valid for 30 days.',
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.submitted', true);

        $this->assertSame(QuotationRecipient::QUOTED, $recipient->fresh()->status);
        $this->getJson('/api/public/quotes/not-a-real-token')->assertNotFound();
    }

    public function test_automatic_reminders_go_once_to_non_responders(): void
    {
        $quotation = Quotation::where('number', 'Q-0147')->first(); // due in 3 days, reminders 3 days before
        $quotation->recipients()->first()->update(['status' => QuotationRecipient::AWAITING]);

        $this->artisan('quotations:send-reminders')->assertSuccessful();
        Mail::assertSent(QuotationRequestMail::class, 1);
        $this->artisan('quotations:send-reminders')->assertSuccessful();
        Mail::assertSent(QuotationRequestMail::class, 1);
    }
}
