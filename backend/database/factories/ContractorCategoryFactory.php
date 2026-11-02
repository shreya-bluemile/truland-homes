<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ContractorCategoryFactory extends Factory
{
    public function definition(): array
    {
        // Random but distinct from the real trade names tests create on purpose (e.g. "Concrete").
        return ['name' => 'Trade '.fake()->unique()->numerify('####')];
    }
}
