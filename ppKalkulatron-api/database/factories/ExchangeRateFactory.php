<?php

namespace Database\Factories;

use App\Models\ExchangeRate;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExchangeRateFactory extends Factory
{
    protected $model = ExchangeRate::class;

    public function definition(): array
    {
        $currencies = ['EUR', 'USD', 'GBP', 'CHF'];
        $currency = fake()->randomElement($currencies);

        // Realistic exchange rates to BAM (approximate)
        $rates = [
            'EUR' => 1.96,
            'USD' => 1.80,
            'GBP' => 2.25,
            'CHF' => 2.00,
        ];

        return [
            'currency' => $currency,
            'rate_to_bam' => fake()->randomFloat(5, $rates[$currency] * 0.95, $rates[$currency] * 1.05),
            'rate_date' => fake()->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
