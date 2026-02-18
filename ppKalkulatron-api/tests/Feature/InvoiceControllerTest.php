<?php

use App\Models\User;
use App\Models\Company;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Contract;

it('tenant: user can list invoices for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    Invoice::factory()->count(3)->create(['company_id' => $company->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/invoices");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'invoice_number',
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

it('tenant: user can create invoice for accessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'language' => \App\Models\Enums\LanguageEnum::English->value,
            'invoice_template' => \App\Models\Enums\DocumentTemplateEnum::Classic->value,
            'payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::Cash->value,
            'subtotal' => 10000,
            'tax_total' => 1700,
            'discount_total' => 0,
            'total' => 11700,
            'items' => [
                [
                    'name' => 'Test Item',
                    'quantity' => 1,
                    'unit_price' => 10000,
                    'subtotal' => 10000,
                    'tax_rate' => 1700,
                    'tax_amount' => 1700,
                    'total' => 11700,
                ]
            ],
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'invoice_number',
                'company_id',
                'client_id',
            ]
        ]);
});

it('tenant: user can create invoice from proforma', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $proforma = Proforma::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/proformas/{$proforma->id}/create-invoice");

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

it('tenant: user can create invoice from contract', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $contract = Contract::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/contracts/{$contract->id}/create-invoice");

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

it('tenant: cannot show invoice from different company', function () {
    $user = User::factory()->create();
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    attachUserToCompany($user, $company1);

    $invoice = Invoice::factory()->create(['company_id' => $company2->id]);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company1->slug}/invoices/{$invoice->id}");

    $response->assertStatus(404);
});

it('tenant: user can create refund invoice', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'status' => \App\Models\Enums\DocumentStatusEnum::Fiscalized, // Must be fiscalized
        'total' => 100,
    ]);
    
    // Mock fiscal record
    $invoice->fiscalRecords()->create([
        'type' => \App\Models\Enums\FiscalRecordTypeEnum::Original,
        'fiscal_invoice_number' => 'BF123456',
        'request_id' => 'req-123',
        // 'company_id', 'response_id', 'subtotal', etc do not exist in fiscal_records table
    ]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/create-refund");

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'invoice_number',
                'status',
                'original_invoice_id',
            ]
        ]);
        
    expect($response->json('data.status'))->toBe(\App\Models\Enums\DocumentStatusEnum::RefundCreated->value);
    expect($response->json('data.original_invoice_id'))->toBe($invoice->id);
});
