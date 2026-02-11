<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Client;
use App\Models\Contract;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('tenant: user can list contracts for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Contract::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/contracts");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'contract_number',
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

it('tenant: user can upload file to contract', function () {
    Storage::fake('local');
    
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $contract = Contract::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $file = UploadedFile::fake()->create('document.pdf', 100);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/contracts/{$contract->id}/upload-file", [
            'file' => $file,
        ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'file_path',
        ]);

    expect($contract->fresh()->file_paths)->toHaveCount(1);
});

it('tenant: user can convert contract to invoice', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $contract = Contract::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/contracts/{$contract->id}/convert-to-invoice");

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'invoice_number',
                'source_type',
                'source_id',
            ]
        ]);

    expect($response->json('data.source_type'))->toBe('App\Models\Contract');
    expect($response->json('data.source_id'))->toBe($contract->id);
});
