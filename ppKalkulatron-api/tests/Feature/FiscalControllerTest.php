<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\User;

/**
 * OFS ESIR credentials za integracijske testove (pravi API pozivi).
 * Iz dokumentacije / Postman kolekcije.
 * OFS_TEST_BASE_URL: ako OFS radi na hostu, koristite http://host.docker.internal:3566
 */
const OFS_TEST_BASE_URL = 'http://api.ofs.ba';
const OFS_TEST_API_KEY = 'bb7584a167578b89c459d6ab1759b0cc';
const OFS_TEST_SERIAL_NUMBER = 'F41AEFFF110A4B5ABB266299A41EE479';
const OFS_TEST_PAC = '123456';

function setOfsTestCredentials(Company $company): void
{
    CompanySetting::set('ofs_base_url', OFS_TEST_BASE_URL, $company->id);
    CompanySetting::set('ofs_api_key', OFS_TEST_API_KEY, $company->id);
    CompanySetting::set('ofs_serial_number', OFS_TEST_SERIAL_NUMBER, $company->id);
    CompanySetting::set('ofs_pac', OFS_TEST_PAC, $company->id);
    CompanySetting::flushCache($company->id);
}

it('F 11% - 1 item 100 BAM: invoice store pa fiscalize', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    setOfsTestCredentials($company);

    $articleResp = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Artikl F',
            'unit' => 'kom',
            'tax_rate' => 'F',
        ]);
    $articleResp->assertStatus(201);
    $articleId = $articleResp->json('data.id');

    $total = 10000; // 100 BAM u pfening
    $subtotal = 9009;
    $taxAmount = 991;

    $storeResponse = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'items' => [
                [
                    'article_id' => $articleId,
                    'name' => 'Artikl F',
                    'quantity' => 1,
                    'unit_price' => $total,
                    'subtotal' => $subtotal,
                    'tax_rate' => 1100,
                    'tax_label' => 'F',
                    'tax_amount' => $taxAmount,
                    'total' => $total,
                ],
            ],
        ]);

    $storeResponse->assertStatus(201);
    $invoiceId = $storeResponse->json('data.id');

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.request_id', fn ($v) => str_starts_with($v, 'inv-'));

    expect($response->json('data.fiscal_invoice_number'))->not->toBeNull();

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized');
    expect($invoice->total)->toBe(10000);
});

it('F 11% - 2 items 50 BAM each: invoice store pa fiscalize', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    setOfsTestCredentials($company);

    $articleResp = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Artikl F',
            'unit' => 'kom',
            'tax_rate' => 'F',
        ]);
    $articleResp->assertStatus(201);
    $articleId = $articleResp->json('data.id');

    $unitTotal = 5000; // 50 BAM
    $unitSubtotal = 4505;
    $unitTax = 495;

    $storeResponse = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'items' => [
                [
                    'article_id' => $articleId,
                    'name' => 'Artikl F',
                    'quantity' => 2,
                    'unit_price' => $unitTotal,
                    'subtotal' => $unitSubtotal * 2,
                    'tax_rate' => 1100,
                    'tax_label' => 'F',
                    'tax_amount' => $unitTax * 2,
                    'total' => $unitTotal * 2,
                ],
            ],
        ]);

    $storeResponse->assertStatus(201);
    $invoiceId = $storeResponse->json('data.id');

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize");

    $response->assertStatus(200)->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized');
    expect($invoice->total)->toBe(10000);
});

it('P 40% - 1 item 140 BAM: invoice store pa fiscalize', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    setOfsTestCredentials($company);

    $articleResp = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Usluga P',
            'unit' => 'kom',
            'tax_rate' => 'P',
        ]);
    $articleResp->assertStatus(201);
    $articleId = $articleResp->json('data.id');

    $total = 14000; // 140 BAM
    $subtotal = 10000;
    $taxAmount = 4000;

    $storeResponse = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'items' => [
                [
                    'article_id' => $articleId,
                    'name' => 'Usluga P',
                    'quantity' => 1,
                    'unit_price' => $total,
                    'subtotal' => $subtotal,
                    'tax_rate' => 4000,
                    'tax_label' => 'P',
                    'tax_amount' => $taxAmount,
                    'total' => $total,
                ],
            ],
        ]);

    $storeResponse->assertStatus(201);
    $invoiceId = $storeResponse->json('data.id');

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize");

    $response->assertStatus(200)->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized');
    expect($invoice->total)->toBe(14000);
});

it('Multiple items F + P: invoice store pa fiscalize', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    setOfsTestCredentials($company);

    $articleFResp = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Artikl F',
            'unit' => 'kom',
            'tax_rate' => 'F',
        ]);
    $articlePResp = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => 'Usluga P',
            'unit' => 'kom',
            'tax_rate' => 'P',
        ]);
    $articleFResp->assertStatus(201);
    $articlePResp->assertStatus(201);
    $articleFId = $articleFResp->json('data.id');
    $articlePId = $articlePResp->json('data.id');

    $storeResponse = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'items' => [
                [
                    'article_id' => $articleFId,
                    'name' => 'Artikl F',
                    'quantity' => 2,
                    'unit_price' => 10000,
                    'subtotal' => 18018,
                    'tax_rate' => 1100,
                    'tax_label' => 'F',
                    'tax_amount' => 1982,
                    'total' => 20000,
                ],
                [
                    'article_id' => $articlePId,
                    'name' => 'Usluga P',
                    'quantity' => 1,
                    'unit_price' => 14000,
                    'subtotal' => 10000,
                    'tax_rate' => 4000,
                    'tax_label' => 'P',
                    'tax_amount' => 4000,
                    'total' => 14000,
                ],
            ],
        ]);

    $storeResponse->assertStatus(201);
    $invoiceId = $storeResponse->json('data.id');

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize");

    $response->assertStatus(200)->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized');
    expect($invoice->total)->toBe(34000);
});
