<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LotFactory extends Factory
{
    public function definition(): array
    {
        return [
            'address' => 'Lot '.fake()->numberBetween(1, 99).', '.fake()->streetAddress(),
            'floor_plan' => 'Ground Floor Plan',
        ];
    }
}
