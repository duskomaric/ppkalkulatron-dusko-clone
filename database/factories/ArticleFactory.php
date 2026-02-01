<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Company;
use App\Models\Enums\ArticleTypeEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

class ArticleFactory extends Factory
{
    protected $model = Article::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => fake()->unique()->catchPhrase(),
            'description' => fake()->sentence(),
            'prices_meta' => [
                'USD' => 100.50,
                'EUR' => 122.30,
                'BAM' => 196.60,
            ],
            'unit' => fake()->randomElement(['KOM', 'SAT']),
            'tax_category' => fake()->randomElement(['F', 'N', 'T', 'E', 'P']),
            'is_active' => true,
            'type' => ArticleTypeEnum::SERVICES,
        ];
    }
}
