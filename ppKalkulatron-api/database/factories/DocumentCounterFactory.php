<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\DocumentCounter;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentCounterFactory extends Factory
{
    protected $model = DocumentCounter::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'type' => fake()->randomElement(['invoice', 'proforma', 'contract', 'quote']),
            'year' => fake()->numberBetween(2020, 2030),
            'last_number' => fake()->numberBetween(0, 1000),
        ];
    }
}
