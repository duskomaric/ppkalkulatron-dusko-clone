<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Enums\DocumentFrequencyEnum;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Enums\DocumentTemplateEnum;
use App\Models\Enums\LanguageEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'invoice_number' => fake()->unique()->numerify('INV-####-###'),
            'company_id' => Company::factory(),
            'client_id' => Client::factory(),
            'status' => DocumentStatusEnum::Draft,
            'language' => LanguageEnum::English,
            'date' => fake()->date(),
            'due_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'is_recurring' => false,
            'frequency' => null,
            'next_invoice_date' => null,
            'parent_id' => null,
            'source_type' => null,
            'source_id' => null,
            'currency' => 'BAM',
            'invoice_template' => DocumentTemplateEnum::Classic,
            'is_fiscalized' => false,
            'fiscal_invoice_number' => null,
            'fiscal_counter' => null,
            'fiscal_verification_url' => null,
            'fiscalized_at' => null,
            'fiscal_meta' => null,
            'subtotal' => fake()->numberBetween(10000, 100000),
            'tax_total' => fake()->numberBetween(1000, 10000),
            'discount_total' => 0,
            'total' => fake()->numberBetween(11000, 110000),
        ];
    }

    public function recurring(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_recurring' => true,
            'frequency' => fake()->randomElement(DocumentFrequencyEnum::cases()),
            'next_invoice_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
        ]);
    }

    public function fromProforma(): static
    {
        return $this->state(fn (array $attributes) => [
            'source_type' => 'App\Models\Proforma',
        ]);
    }

    public function fromContract(): static
    {
        return $this->state(fn (array $attributes) => [
            'source_type' => 'App\Models\Contract',
        ]);
    }
}
