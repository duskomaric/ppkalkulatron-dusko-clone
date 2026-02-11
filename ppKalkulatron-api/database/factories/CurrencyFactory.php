<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Currency;
use Illuminate\Database\Eloquent\Factories\Factory;

class CurrencyFactory extends Factory
{
    protected $model = Currency::class;

    public function definition(): array
    {
        $currencyMetaByCode = [
            'BAM' => ['name' => 'Konvertibilna Marka', 'symbol' => 'KM'],
            'EUR' => ['name' => 'Euro', 'symbol' => '€'],
            'USD' => ['name' => 'US Dollar', 'symbol' => '$'],
            'GBP' => ['name' => 'British Pound', 'symbol' => '£'],
            'CHF' => ['name' => 'Swiss Franc', 'symbol' => 'CHF'],
            'JPY' => ['name' => 'Japanese Yen', 'symbol' => '¥'],
            'CAD' => ['name' => 'Canadian Dollar', 'symbol' => '$'],
            'AUD' => ['name' => 'Australian Dollar', 'symbol' => '$'],
        ];

        $code = fake()->unique()->randomElement(array_keys($currencyMetaByCode));
        $currency = $currencyMetaByCode[$code];

        return [
            'company_id' => Company::factory(),
            'code' => $code,
            'name' => $currency['name'],
            'symbol' => $currency['symbol'],
        ];
    }

    public function bam(): static
    {
        return $this->state(fn () => [
            'code' => 'BAM',
            'name' => 'Konvertibilna Marka',
            'symbol' => 'KM',
        ]);
    }

    public function eur(): static
    {
        return $this->state(fn () => [
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
        ]);
    }

    public function usd(): static
    {
        return $this->state(fn () => [
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
        ]);
    }

    public function gbp(): static
    {
        return $this->state(fn () => [
            'code' => 'GBP',
            'name' => 'British Pound',
            'symbol' => '£',
        ]);
    }
}
