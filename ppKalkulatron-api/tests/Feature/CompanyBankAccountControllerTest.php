<?php

use App\Models\Company;
use App\Models\BankAccount;
use App\Models\User;

it('tenant: user can list bank accounts for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    BankAccount::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/bank-accounts");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'company_id',
                    'bank_name',
                    'account_number',
                    'is_default',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('tenant: user cannot list bank accounts for inaccessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/bank-accounts");

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['You do not have permission to access this resource.']
            ]
        ]);
});

it('tenant: user can create a default bank account and it unsets previous defaults', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $existingDefault = BankAccount::factory()->default()->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/bank-accounts", [
            'bank_name' => 'Test Bank',
            'account_number' => '1234567890',
            'swift' => 'AAAABBCCDDD',
            'is_default' => true,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'company_id' => $company->id,
                'bank_name' => 'Test Bank',
                'account_number' => '1234567890',
                'is_default' => true,
            ]
        ]);

    $this->assertDatabaseHas('bank_accounts', [
        'company_id' => $company->id,
        'account_number' => '1234567890',
        'is_default' => true,
    ]);

    $this->assertDatabaseHas('bank_accounts', [
        'id' => $existingDefault->id,
        'is_default' => false,
    ]);
});

it('tenant: cannot show bank account from different company (scoped binding)', function () {
    $user = User::factory()->create();
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    attachUserToCompany($user, $company1);

    $bankAccount = BankAccount::factory()->create(['company_id' => $company2->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company1->slug}/bank-accounts/{$bankAccount->id}");

    $response->assertStatus(404);
});
