<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Company;
use App\Models\Quote;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuoteFactory extends Factory
{
    protected $model = Quote::class;

    public function definition(): array
    {
        return [
            'quote_number' => fake()->unique()->numerify('QUO-####-###'),
            'company_id' => Company::factory(),
            'client_id' => Client::factory(),
            'status' => DocumentStatusEnum::Created,
            'language' => LanguageEnum::English,
            'date' => fake()->date(),
            'valid_until' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'currency' => 'BAM',
            'quote_template' => DocumentTemplateEnum::Classic,
            'subtotal' => fake()->numberBetween(10000, 100000),
            'tax_total' => fake()->numberBetween(1000, 10000),
            'discount_total' => 0,
            'total' => fake()->numberBetween(11000, 110000),
        ];
    }
}
