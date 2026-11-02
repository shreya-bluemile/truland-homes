<?php

namespace Database\Factories;

use App\Models\ContractorCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContractorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'contractor_category_id' => ContractorCategory::factory(),
            'name' => fake()->company(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => null,
            'is_active' => true,
        ];
    }
}
