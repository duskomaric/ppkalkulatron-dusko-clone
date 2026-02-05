<?php

use App\Models\Company;
use App\Models\Currency;
use App\Models\User;

it('tenant: user can list currencies for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Currency::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/currencies");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'company_id',
                    'code',
                    'name',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('tenant: user cannot list currencies for inaccessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/currencies");

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['You do not have permission to access this resource.']
            ]
        ]);
});

it('tenant: user can create currency for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/currencies", [
            'code' => 'eur',
            'name' => 'Euro',
            'symbol' => '€',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'company_id' => $company->id,
                'code' => 'EUR',
                'name' => 'Euro',
                'symbol' => '€',
            ]
        ]);

    $this->assertDatabaseHas('currencies', [
        'company_id' => $company->id,
        'code' => 'EUR',
    ]);
});

it('tenant: cannot show currency from different company (scoped binding)', function () {
    $user = User::factory()->create();
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    attachUserToCompany($user, $company1);

    $currency = Currency::factory()->create(['company_id' => $company2->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company1->slug}/currencies/{$currency->id}");

    $response->assertStatus(404);
});
