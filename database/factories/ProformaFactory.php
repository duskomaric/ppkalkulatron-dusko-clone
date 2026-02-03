<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Company;
use App\Models\Proforma;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProformaFactory extends Factory
{
    protected $model = Proforma::class;

    public function definition(): array
    {
        return [
            'proforma_number' => fake()->unique()->numerify('PRO-####-###'),
            'company_id' => Company::factory(),
            'client_id' => Client::factory(),
            'status' => DocumentStatusEnum::Draft,
            'language' => LanguageEnum::English,
            'date' => fake()->date(),
            'due_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'source_type' => null,
            'source_id' => null,
            'currency' => 'BAM',
            'proforma_template' => DocumentTemplateEnum::Classic,
            'subtotal' => fake()->numberBetween(10000, 100000),
            'tax_total' => fake()->numberBetween(1000, 10000),
            'discount_total' => 0,
            'total' => fake()->numberBetween(11000, 110000),
        ];
    }

    public function fromQuote(): static
    {
        return $this->state(fn (array $attributes) => [
            'source_type' => 'App\Models\Quote',
        ]);
    }
}
