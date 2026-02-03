<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Client;
use App\Models\Proforma;
use App\Models\Quote;

it('tenant: user can list proformas for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Proforma::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/proformas");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'proforma_number',
                    'company_id',
                    'client_id',
                    'status',
                    'total',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('tenant: user can create proforma from quote', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $quote = Quote::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/quotes/{$quote->id}/create-proforma");

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'proforma_number',
                'source_type',
                'source_id',
            ]
        ]);

    expect($response->json('data.source_type'))->toBe('App\Models\Quote');
    expect($response->json('data.source_id'))->toBe($quote->id);
});

it('tenant: user can convert proforma to invoice', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $proforma = Proforma::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/proformas/{$proforma->id}/convert-to-invoice");

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'invoice_number',
                'source_type',
                'source_id',
            ]
        ]);

    expect($response->json('data.source_type'))->toBe('App\Models\Proforma');
    expect($response->json('data.source_id'))->toBe($proforma->id);
});
