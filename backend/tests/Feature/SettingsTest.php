<?php

namespace Tests\Feature;

use App\Models\Contractor;
use App\Models\EmailTemplate;
use App\Models\Quotation;
use App\Models\ScopeTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\BuildsQuotations;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use BuildsQuotations, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpQuotationWorld();
    }

    public function test_lookups_give_dropdown_options_and_only_active_contractors(): void
    {
        [$active] = $this->contractors(1);
        Contractor::factory()->create(['contractor_category_id' => $this->category->id, 'is_active' => false]);

        $this->getJson('/api/lookups')->assertOk()
            ->assertJsonPath('lots.0.floor_plan', 'Co-living')
            ->assertJsonPath('categories.0.name', 'Concrete');
        $this->getJson("/api/lookups/categories/{$this->category->id}")->assertOk()
            ->assertJsonCount(1, 'contractors')
            ->assertJsonPath('contractors.0.id', $active->id);
    }

    public function test_contractors_can_be_added_searched_edited_and_removed_without_losing_history(): void
    {
        $id = $this->postJson('/api/contractors', [
            'name' => 'Northline Concrete', 'email' => 'quotes@northline.com', 'contractor_category_id' => $this->category->id, 'is_active' => true,
        ])->assertCreated()->assertJsonPath('data.category.name', 'Concrete')->json('data.id');

        $this->postJson('/api/contractors', ['name' => '', 'email' => 'nope', 'is_active' => true])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'contractor_category_id']);
        $this->getJson('/api/contractors?search=northline')->assertJsonCount(1, 'data');
        $this->putJson("/api/contractors/{$id}", [
            'name' => 'Northline Concrete Pty Ltd', 'email' => 'quotes@northline.com', 'contractor_category_id' => $this->category->id, 'is_active' => false,
        ])->assertOk()->assertJsonPath('data.is_active', false);

        $this->deleteJson("/api/contractors/{$id}")->assertOk();
        $this->assertSoftDeleted('contractors', ['id' => $id]);
        $this->getJson('/api/contractors')->assertJsonCount(0, 'data');
    }

    public function test_lots_in_use_cannot_be_deleted(): void
    {
        $lotId = $this->postJson('/api/lots', ['address' => 'Lot 3, 1 Test Street', 'floor_plan' => 'Double Storey'])->assertCreated()->json('data.id');
        $this->putJson("/api/lots/{$lotId}", ['address' => 'Lot 3, 1 Test St'])->assertOk()->assertJsonPath('data.address', 'Lot 3, 1 Test St');
        $this->deleteJson("/api/lots/{$lotId}")->assertOk();

        Quotation::create(['lot_id' => $this->lot->id, 'status' => Quotation::DRAFT, 'created_by' => $this->user->id]);
        $this->deleteJson("/api/lots/{$this->lot->id}")->assertUnprocessable();
    }

    public function test_categories_manage_their_scope_documents(): void
    {
        $id = $this->postJson('/api/contractor-categories', ['name' => 'Tiling'])->assertCreated()->json('data.id');
        $this->postJson('/api/contractor-categories', ['name' => 'Tiling'])->assertUnprocessable(); // names are unique

        $templateId = $this->post("/api/contractor-categories/{$id}/templates", [
            'files' => [UploadedFile::fake()->create('Tiling scope.pdf', 20, 'application/pdf')],
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.templates.0.name', 'Tiling scope.pdf')->json('data.templates.0.id');

        $this->get("/api/contractor-categories/{$id}/templates/{$templateId}/download")->assertOk();
        $this->getJson("/api/lookups/categories/{$id}")->assertJsonPath('templates.0.name', 'Tiling scope.pdf');
        $path = ScopeTemplate::find($templateId)->path;
        $this->deleteJson("/api/contractor-categories/{$id}/templates/{$templateId}")->assertOk();
        Storage::disk('local')->assertMissing($path);

        $this->deleteJson("/api/contractor-categories/{$id}")->assertOk();
        $this->contractors(1);
        $this->deleteJson("/api/contractor-categories/{$this->category->id}")->assertUnprocessable(); // has contractors
    }

    public function test_email_templates_can_be_listed_created_and_edited_but_system_ones_stay_active(): void
    {
        $this->getJson('/api/email-templates?status=active')->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.is_system', true)
            ->assertJsonStructure(['placeholders' => ['contractor_name', 'upload_button']]);

        $id = $this->postJson('/api/email-templates', [
            'name' => 'Booking request for driveway', 'subject' => 'Booking request', 'body' => '<p>Hi</p>', 'is_active' => true,
        ])->assertCreated()->json('data.id');
        $this->getJson('/api/email-templates?search=driveway')->assertJsonCount(1, 'data');
        $this->putJson("/api/email-templates/{$id}", ['name' => 'Driveway', 'subject' => 'S', 'body' => 'B', 'is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);
        $this->getJson('/api/email-templates?status=inactive')->assertJsonCount(1, 'data');

        $system = EmailTemplate::where('key', EmailTemplate::QUOTATION_REQUEST)->first();
        $this->putJson("/api/email-templates/{$system->id}", ['name' => $system->name, 'subject' => 'New subject {{quote_no}}', 'body' => $system->body, 'is_active' => false])
            ->assertUnprocessable();
        $this->putJson("/api/email-templates/{$system->id}", ['name' => $system->name, 'subject' => 'New subject {{quote_no}}', 'body' => $system->body, 'is_active' => true])
            ->assertOk()->assertJsonPath('data.subject', 'New subject {{quote_no}}');
    }
}
