<?php

namespace Tests\Feature;

use App\Mail\TemplatedMail;
use App\Models\ContractorCategory;
use App\Models\Lot;
use App\Models\Quotation;
use App\Models\QuotationContractor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\BuildsQuotations;
use Tests\TestCase;

class QuotationListAndStatusTest extends TestCase
{
    use BuildsQuotations, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpQuotationWorld();
        Mail::fake();
    }

    /** Builds a sent quotation directly, with recipients in the given statuses. */
    private function quotationWith(array $statuses, string $due, array $attrs = []): Quotation
    {
        $quotation = Quotation::create(array_merge([
            'lot_id' => $this->lot->id, 'contractor_category_id' => $this->category->id, 'due_date' => $due,
            'status' => Quotation::SENT, 'created_by' => $this->user->id, 'sent_at' => now(),
        ], $attrs));
        foreach ($this->contractors(count($statuses)) as $i => $contractor) {
            $quotation->recipients()->create(['contractor_id' => $contractor->id, 'status' => $statuses[$i], 'sent_at' => now()]);
        }

        return $quotation->load('recipients');
    }

    public function test_overall_status_follows_the_contractors_responses(): void
    {
        $today = CarbonImmutable::parse('2026-11-02');
        $a = QuotationContractor::AWAITING;
        $r = QuotationContractor::RECEIVED;
        $n = QuotationContractor::NOT_QUOTING;

        $cases = [
            'one quote in, others still awaiting' => [[$r, $a, $a], '2026-11-06', 'awaiting', null],
            'everyone responded' => [[$r, $n], '2026-11-06', 'received', null],
            'past due with a quote' => [[$r, $a], '2026-10-30', 'received', null],
            'past due with no quotes' => [[$a, $n], '2026-10-28', 'overdue', 5],
            'everyone declined' => [[$n, $n], '2026-11-06', 'not_quoting', null],
        ];

        foreach ($cases as $name => [$statuses, $due, $expected, $days]) {
            $status = $this->quotationWith($statuses, $due)->displayStatus($today);
            $this->assertSame($expected, $status['key'], $name);
            $this->assertSame($days, $status['overdue_days'], $name);
        }
        $this->assertSame('draft', (new Quotation(['status' => Quotation::DRAFT]))->displayStatus($today)['key']);
    }

    public function test_list_shows_counts_and_newest_first(): void
    {
        $older = $this->quotationWith([QuotationContractor::RECEIVED, QuotationContractor::AWAITING], now()->addDays(4)->format('Y-m-d'));
        $older->recipients->last()->forceFill(['opened_at' => now()])->save();
        $newer = $this->quotationWith([QuotationContractor::AWAITING], now()->addDays(4)->format('Y-m-d'));

        $this->getJson('/api/quotations')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.quote_no', $older->quote_no)
            ->assertJsonPath('data.1.counts', ['contractors' => 2, 'quoted' => 1, 'opened' => 1])
            ->assertJsonPath('data.1.created_by.name', 'John Doe')
            ->assertJsonPath('data.1.lot.address', 'Lot 14, 22 Harbour View Road')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_list_filters_by_quote_number_lot_category_and_date(): void
    {
        $due = now()->addDays(4)->format('Y-m-d');
        $first = $this->quotationWith([QuotationContractor::AWAITING], $due);
        $otherLot = Lot::factory()->create();
        $otherCategory = ContractorCategory::factory()->create(['name' => 'Roofing']);
        $second = $this->quotationWith([QuotationContractor::AWAITING], $due, ['lot_id' => $otherLot->id, 'contractor_category_id' => $otherCategory->id]);
        $old = $this->quotationWith([QuotationContractor::AWAITING], $due);
        $old->forceFill(['created_at' => now()->subDays(40)])->save();

        $ids = fn (string $query) => collect($this->getJson('/api/quotations?'.$query)->assertOk()->json('data'))->pluck('id')->all();

        $this->assertSame([$first->id], $ids('search='.$first->quote_no));
        $this->assertSame([$second->id], $ids('lot_id='.$otherLot->id));
        $this->assertSame([$second->id], $ids('category_id='.$otherCategory->id));
        $this->assertSame([$second->id, $first->id], $ids('date=30d'));
        $this->assertCount(3, $ids(''));
        $this->getJson('/api/quotations?date=yesterday')->assertUnprocessable();
    }

    public function test_detail_includes_documents_recipients_and_the_sent_email(): void
    {
        $quotation = $this->sentQuotation(2);

        $this->getJson("/api/quotations/{$quotation->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data.recipients')
            ->assertJsonPath('data.recipients.0.status_label', 'Awaiting')
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonPath('data.reminder_days', 3)
            ->assertJsonStructure(['data' => ['email' => ['subject', 'body']]])
            ->assertJsonMissingPath('data.recipients.0.token');
    }

    public function test_staff_can_change_a_contractors_quote_status(): void
    {
        $quotation = $this->sentQuotation(1);
        $recipient = $quotation->recipients()->first();
        $url = "/api/quotations/{$quotation->id}/recipients/{$recipient->id}";

        $this->patchJson($url, ['status' => 'received'])
            ->assertOk()->assertJsonPath('data.status_label', 'Replied by email')->assertJsonPath('data.response_source', 'email');
        $this->assertNotNull($recipient->fresh()->responded_at);

        $this->patchJson($url, ['status' => 'not_quoting'])->assertOk()->assertJsonPath('data.status_label', 'Not Quoting');
        $this->patchJson($url, ['status' => 'awaiting'])->assertOk()->assertJsonPath('data.status_label', 'Awaiting');
        $this->assertNull($recipient->fresh()->responded_at);
        $this->patchJson($url, ['status' => 'maybe'])->assertUnprocessable();

        $this->assertDatabaseHas('quotation_activities', ['action' => 'status_changed', 'description' => "John Doe marked {$recipient->contractor->name} as Replied by email."]);
    }

    public function test_recipient_must_belong_to_the_quotation_in_the_url(): void
    {
        $one = $this->sentQuotation(1);
        $two = $this->sentQuotation(1);
        $this->patchJson("/api/quotations/{$one->id}/recipients/{$two->recipients()->first()->id}", ['status' => 'received'])->assertNotFound();
    }

    public function test_reminders_go_only_to_contractors_who_havent_responded(): void
    {
        $quotation = $this->sentQuotation(2);
        [$awaiting, $responded] = $quotation->recipients()->get()->all();
        $responded->forceFill(['status' => QuotationContractor::RECEIVED])->save();
        Mail::fake(); // ignore the original request emails

        $this->postJson("/api/quotations/{$quotation->id}/recipients/{$awaiting->id}/remind")
            ->assertOk()
            ->assertJsonPath('message', "Reminder sent to {$awaiting->contractor->name}.")
            ->assertJsonPath('data.reminder_count', 1);
        Mail::assertQueued(TemplatedMail::class, fn ($m) => $m->hasTo($awaiting->contractor->email)
            && str_starts_with($m->mailSubject, 'Reminder: Quotation Request'));

        $this->postJson("/api/quotations/{$quotation->id}/recipients/{$responded->id}/remind")->assertUnprocessable();
        Mail::assertQueuedCount(1);
    }

    public function test_api_requests_without_a_seeded_user_get_a_clear_error_not_a_crash(): void
    {
        User::query()->delete();
        auth()->forgetGuards();
        $this->app['auth']->forgetUser();
        $this->getJson('/api/quotations')->assertStatus(503);
    }
}
