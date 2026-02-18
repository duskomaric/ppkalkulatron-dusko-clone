<?php

use App\Models\User;
use App\Models\Company;
use App\Models\DocumentCounter;

it('tenant: user can preview next document number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2024,
        'last_number' => 5,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/document-numbers/next?type=invoice&year=2024");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'number',
            'formatted',
        ]);

    expect($response->json('number'))->toBe(6);
    expect($response->json('formatted'))->toBe('0006/2024');
});

it('tenant: preview does not increment counter', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2024,
        'last_number' => 5,
    ]);

    $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/document-numbers/next?type=invoice&year=2024");

    expect($counter->fresh()->last_number)->toBe(5);
});

it('tenant: user can reserve document number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2024,
        'last_number' => 5,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/document-numbers/reserve", [
            'type' => 'invoice',
            'year' => 2024,
        ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'number',
            'formatted',
        ]);

    expect($response->json('number'))->toBe(6);
    expect($response->json('formatted'))->toBe('0006/2024');

    // Counter should be incremented
    $counter = DocumentCounter::where('company_id', $company->id)
        ->where('type', 'invoice')
        ->where('year', 2024)
        ->first();

    expect($counter->last_number)->toBe(6);
});

it('tenant: reservation creates counter if not exists', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/document-numbers/reserve", [
            'type' => 'invoice',
            'year' => 2024,
        ]);

    $response->assertStatus(200);

    $counter = DocumentCounter::where('company_id', $company->id)
        ->where('type', 'invoice')
        ->where('year', 2024)
        ->first();

    expect($counter)->not->toBeNull();
    expect($counter->last_number)->toBe(1);
});
