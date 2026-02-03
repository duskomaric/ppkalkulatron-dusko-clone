<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 10);
        $unitPrice = fake()->numberBetween(1000, 10000);
        $subtotal = $quantity * $unitPrice;
        $taxRate = fake()->randomElement([0, 1700, 2100]); // 0%, 17%, 21%
        $taxAmount = (int) ($subtotal * $taxRate / 10000);
        $total = $subtotal + $taxAmount;

        return [
            'invoice_id' => Invoice::factory(),
            'article_id' => Article::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ];
    }
}
