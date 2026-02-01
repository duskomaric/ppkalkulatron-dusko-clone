<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        $companyName = fake()->company();

        return [
            'name' => $companyName,
            'slug' => Str::slug($companyName),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->country(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->companyEmail(),
            'website' => fake()->domainName(),
            'identification_number' => fake()->numerify('#########'),
            'vat_number' => fake()->numerify('HR#########'),
            'is_active' => true,
            'subscription_ends_at' => fake()->dateTimeBetween('+1 month', '+1 year'),
            ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function expiredSubscription(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_ends_at' => fake()->dateTimeBetween('-1 year', '-1 day'),
        ]);
    }
}
