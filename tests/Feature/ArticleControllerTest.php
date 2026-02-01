<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Article;
use App\Models\Enums\ArticleTypeEnum;

it('tenant: user can list articles for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Article::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/articles");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'company_id',
                    'name',
                    'type',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('tenant: user cannot list articles for inaccessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/articles");

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['You do not have permission to access this resource.']
            ]
        ]);
});

it('tenant: user can create article for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Test Article',
            'type' => 'goods',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'company_id' => $company->id,
                'name' => 'Test Article',
                'type' => 'goods',
                'type_label' => 'Roba',
                'type_color' => 'blue-500',
            ]
        ]);

    $this->assertDatabaseHas('articles', [
        'company_id' => $company->id,
        'name' => 'Test Article',
        'type' => 'goods',
    ]);
});

it('tenant: user can show article within accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $article = Article::factory()->create([
        'company_id' => $company->id,
        'type' => ArticleTypeEnum::SERVICES
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/articles/{$article->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $article->id,
                'company_id' => $company->id,
                'name' => $article->name,
                'type' => 'services',
                'type_label' => 'Usluge',
                'type_color' => 'green-500',
            ]
        ]);
});

it('tenant: cannot show article from different company (scoped binding)', function () {
    $user = User::factory()->create();
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    attachUserToCompany($user, $company1);

    $article = Article::factory()->create(['company_id' => $company2->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company1->slug}/articles/{$article->id}");

    // Should return 404 because article is not in company1 (scoped route model binding)
    $response->assertStatus(404);
});
