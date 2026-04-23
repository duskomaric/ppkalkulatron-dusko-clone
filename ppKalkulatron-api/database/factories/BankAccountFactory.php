<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\BankAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

class BankAccountFactory extends Factory
{
    protected $model = BankAccount::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'bank_name' => fake()->company().' Bank',
            'account_number' => fake()->numerify('##########'),
            'swift' => fake()->optional()->regexify('[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{3}'),
            'show_on_documents' => true,
        ];
    }
}
