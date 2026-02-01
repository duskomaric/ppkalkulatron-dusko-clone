<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Client;

it('tenant: user can list clients for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Client::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/clients");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'company_id',
                    'name',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('tenant: user cannot list clients for inaccessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/clients");

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['You do not have permission to access this resource.']
            ]
        ]);
});

it('tenant: user can create client for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/clients", [
            'name' => 'Test Client',
            'email' => 'client@test.com',
            'is_active' => true,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'company_id' => $company->id,
                'name' => 'Test Client',
                'email' => 'client@test.com',
                'is_active' => true,
            ]
        ]);

    $this->assertDatabaseHas('clients', [
        'company_id' => $company->id,
        'name' => 'Test Client',
        'email' => 'client@test.com',
    ]);
});

it('tenant: cannot show client from different company (scoped binding)', function () {
    $user = User::factory()->create();
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    attachUserToCompany($user, $company1);

    $client = Client::factory()->create(['company_id' => $company2->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company1->slug}/clients/{$client->id}");

    $response->assertStatus(404);
});
