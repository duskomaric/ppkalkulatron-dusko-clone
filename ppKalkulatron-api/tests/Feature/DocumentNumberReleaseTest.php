<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\DocumentCounter;
use App\Models\Enums\DocumentStatusEnum;
use App\Models\Invoice;
use App\Models\Proforma;
use App\Models\Quote;
use App\Models\User;
use App\Services\DocumentNumberService;

it('releaseNumber decrements counter so the deleted last number can be reused', function () {
    $company = Company::factory()->create();
    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2026,
        'last_number' => 10,
    ]);

    app(DocumentNumberService::class)->releaseNumber($company, 'invoice', '0010/2026');

    expect($counter->fresh()->last_number)->toBe(9);
});

it('releaseNumber does not go below configured starting number minus one', function () {
    $company = Company::factory()->create();
    CompanySetting::set('invoice_numbering_starting_number', 8, $company->id);

    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2026,
        'last_number' => 8,
    ]);

    app(DocumentNumberService::class)->releaseNumber($company, 'invoice', '0008/2026');

    expect($counter->fresh()->last_number)->toBe(7);
});

it('releaseNumber does not decrement when deleting a non-last number', function () {
    $company = Company::factory()->create();
    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2026,
        'last_number' => 8,
    ]);

    app(DocumentNumberService::class)->releaseNumber($company, 'invoice', '0005/2026');

    expect($counter->fresh()->last_number)->toBe(8);
});

it('releaseNumber parses prefixed numbers', function () {
    $company = Company::factory()->create();
    CompanySetting::set('invoice_numbering_prefix', 'INV', $company->id);

    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 2026,
        'last_number' => 3,
    ]);

    app(DocumentNumberService::class)->releaseNumber($company, 'invoice', 'INV-0003/2026');

    expect($counter->fresh()->last_number)->toBe(2);
});

it('releaseNumber works without year suffix when yearly reset is disabled', function () {
    $company = Company::factory()->create();
    CompanySetting::set('document_numbering_reset_yearly', false, $company->id);

    $counter = DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => 0,
        'last_number' => 4,
    ]);

    app(DocumentNumberService::class)->releaseNumber($company, 'invoice', '0004');

    expect($counter->fresh()->last_number)->toBe(3);
});

it('tenant: deleting last invoice reuses its number on next create', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $year = (int) date('Y');
    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => $year,
        'last_number' => 3,
    ]);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'status' => DocumentStatusEnum::Created,
        'invoice_number' => sprintf('0003/%d', $year),
        'date' => "{$year}-06-15",
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/invoices/{$invoice->id}")
        ->assertStatus(200);

    expect(
        DocumentCounter::where('company_id', $company->id)
            ->where('type', 'invoice')
            ->where('year', $year)
            ->first()
            ->last_number
    )->toBe(2);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => "{$year}-06-20",
            'due_date' => "{$year}-07-20",
            'language' => \App\Models\Enums\LanguageEnum::English->value,
            'invoice_template' => \App\Models\Enums\DocumentTemplateEnum::Classic->value,
            'payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::Cash->value,
            'subtotal' => 10000,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => 10000,
            'items' => [
                [
                    'name' => 'Test',
                    'quantity' => 1,
                    'unit_price' => 10000,
                    'subtotal' => 10000,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'total' => 10000,
                ],
            ],
        ]);

    $response->assertStatus(201);
    expect($response->json('data.invoice_number'))->toBe(sprintf('0003/%d', $year));
});

it('tenant: deleting last invoice in a series reuses that number on next create', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $year = (int) date('Y');
    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'invoice',
        'year' => $year,
        'last_number' => 10,
    ]);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'status' => DocumentStatusEnum::Created,
        'invoice_number' => sprintf('0010/%d', $year),
        'date' => "{$year}-06-15",
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/invoices/{$invoice->id}")
        ->assertStatus(200);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => "{$year}-06-20",
            'due_date' => "{$year}-07-20",
            'language' => \App\Models\Enums\LanguageEnum::English->value,
            'invoice_template' => \App\Models\Enums\DocumentTemplateEnum::Classic->value,
            'payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::Cash->value,
            'subtotal' => 10000,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => 10000,
            'items' => [
                [
                    'name' => 'Test',
                    'quantity' => 1,
                    'unit_price' => 10000,
                    'subtotal' => 10000,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'total' => 10000,
                ],
            ],
        ]);

    $response->assertStatus(201);
    expect($response->json('data.invoice_number'))->toBe(sprintf('0010/%d', $year));
});

it('tenant: deleting quote releases last quote number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $year = (int) date('Y');
    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'quote',
        'year' => $year,
        'last_number' => 2,
    ]);

    $quote = Quote::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'quote_number' => sprintf('0002/%d', $year),
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/quotes/{$quote->id}")
        ->assertStatus(200);

    expect(
        DocumentCounter::where('company_id', $company->id)
            ->where('type', 'quote')
            ->where('year', $year)
            ->first()
            ->last_number
    )->toBe(1);
});

it('tenant: deleting proforma releases last proforma number', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);

    $year = (int) date('Y');
    DocumentCounter::factory()->create([
        'company_id' => $company->id,
        'type' => 'proforma',
        'year' => $year,
        'last_number' => 5,
    ]);

    $proforma = Proforma::factory()->create([
        'company_id' => $company->id,
        'client_id' => $client->id,
        'proforma_number' => sprintf('0005/%d', $year),
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson("/api/v1/{$company->slug}/proformas/{$proforma->id}")
        ->assertStatus(200);

    expect(
        DocumentCounter::where('company_id', $company->id)
            ->where('type', 'proforma')
            ->where('year', $year)
            ->first()
            ->last_number
    )->toBe(4);
});
