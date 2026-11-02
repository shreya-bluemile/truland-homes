<?php

namespace Tests\Concerns;

use App\Models\Contractor;
use App\Models\ContractorCategory;
use App\Models\Lot;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\EmailTemplateSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait BuildsQuotations
{
    protected User $user;

    protected ContractorCategory $category;

    protected Lot $lot;

    protected function setUpQuotationWorld(): void
    {
        Storage::fake('local');
        $this->seed(EmailTemplateSeeder::class);
        $this->user = User::factory()->create(['name' => 'John Doe']);
        $this->category = ContractorCategory::factory()->create(['name' => 'Concrete']);
        $this->lot = Lot::factory()->create(['address' => 'Lot 14, 22 Harbour View Road', 'floor_plan' => 'Co-living']);
        $this->actingAs($this->user);
    }

    protected function contractors(int $count = 2): array
    {
        return Contractor::factory()->count($count)->create(['contractor_category_id' => $this->category->id])->all();
    }

    protected function sendPayload(array $contractors, array $overrides = []): array
    {
        return array_merge([
            'action' => 'send',
            'lot_id' => $this->lot->id,
            'contractor_category_id' => $this->category->id,
            'contractor_ids' => array_map(fn ($c) => $c->id, $contractors),
            'due_date' => now()->addDays(5)->format('Y-m-d'),
            'reminder_days' => 3,
            'notes' => 'Site access is via the rear lane.',
            'files' => [UploadedFile::fake()->create('A01 – Site Plan.pdf', 200, 'application/pdf')],
        ], $overrides);
    }

    protected function sentQuotation(int $contractorCount = 2): Quotation
    {
        $id = $this->post('/api/quotations', $this->sendPayload($this->contractors($contractorCount)), ['Accept' => 'application/json'])
            ->assertCreated()->json('data.id');

        return Quotation::findOrFail($id);
    }
}
