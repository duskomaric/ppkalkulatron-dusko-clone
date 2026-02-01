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
            'BAM' => ['name' => 'Konvertibilna Marka', 'prefix' => 'KM'],
            'EUR' => ['name' => 'Euro', 'prefix' => '€'],
            'USD' => ['name' => 'US Dollar', 'prefix' => '$'],
            'GBP' => ['name' => 'British Pound', 'prefix' => '£'],
            'CHF' => ['name' => 'Swiss Franc', 'prefix' => 'CHF'],
            'JPY' => ['name' => 'Japanese Yen', 'prefix' => '¥'],
            'CAD' => ['name' => 'Canadian Dollar', 'prefix' => '$'],
            'AUD' => ['name' => 'Australian Dollar', 'prefix' => '$'],
        ];

        $code = fake()->unique()->randomElement(array_keys($currencyMetaByCode));
        $currency = $currencyMetaByCode[$code];

        return [
            'company_id' => Company::factory(),
            'code' => $code,
            'name' => $currency['name'],
            'prefix' => $currency['prefix'],
        ];
    }

    public function bam(): static
    {
        return $this->state(fn () => [
            'code' => 'BAM',
            'name' => 'Konvertibilna Marka',
            'prefix' => 'KM',
        ]);
    }

    public function eur(): static
    {
        return $this->state(fn () => [
            'code' => 'EUR',
            'name' => 'Euro',
            'prefix' => '€',
        ]);
    }

    public function usd(): static
    {
        return $this->state(fn () => [
            'code' => 'USD',
            'name' => 'US Dollar',
            'prefix' => '$',
        ]);
    }

    public function gbp(): static
    {
        return $this->state(fn () => [
            'code' => 'GBP',
            'name' => 'British Pound',
            'prefix' => '£',
        ]);
    }
}
