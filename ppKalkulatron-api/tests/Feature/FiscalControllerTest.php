<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\FiscalRecord;
use App\Models\User;
use App\Services\FiscalReceiptStore;
use Illuminate\Support\Facades\Http;

/**
 * OFS is faked here.
 *
 * These used to call a real endpoint, which meant every run of the suite asked a live fiscal
 * system to issue receipts — real fiscal documents with real counters, not something a test should
 * be creating. The old base URL (http://api.ofs.ba) is the documentation site rather than the API,
 * so the calls timed out and the four tests failed on every run.
 *
 * What is worth asserting is our side of the exchange: the three headers OFS requires, a payment
 * total that matches the sum of the items, and what we do with the response. That is deterministic
 * and needs no network.
 *
 * To run against a real device or the cloud anyway, set OFS_LIVE_BASE_URL (plus OFS_LIVE_API_KEY,
 * OFS_LIVE_SERIAL_NUMBER, OFS_LIVE_PAC). Every run then issues real receipts.
 */
const OFS_FAKE_BASE_URL = 'https://pos.ofs.invalid';
const OFS_FAKE_API_KEY = 'test-api-key';
const OFS_FAKE_SERIAL_NUMBER = 'TEST-SERIAL-0001';
const OFS_FAKE_PAC = '000000';

/**
 * Point the company at OFS and stub it out.
 *
 * Http::fake keeps the first matching stub, so the response has to be decided here rather than
 * re-faked later in the test.
 *
 * @param  array|null  $response  null to have OFS answer 500 instead of a fiscalized invoice
 * @return bool true when OFS is faked, false when the test talks to a real device
 */
function useOfs(Company $company, ?array $response = []): bool
{
    $liveBaseUrl = env('OFS_LIVE_BASE_URL');

    CompanySetting::set('ofs_base_url', $liveBaseUrl ?: OFS_FAKE_BASE_URL, $company->id);
    CompanySetting::set('ofs_api_key', env('OFS_LIVE_API_KEY', OFS_FAKE_API_KEY), $company->id);
    CompanySetting::set('ofs_serial_number', env('OFS_LIVE_SERIAL_NUMBER', OFS_FAKE_SERIAL_NUMBER), $company->id);
    CompanySetting::set('ofs_pac', env('OFS_LIVE_PAC', OFS_FAKE_PAC), $company->id);
    CompanySetting::flushCache($company->id);

    if ($liveBaseUrl) {
        return false;
    }

    Http::fake([
        '*/api/invoices' => $response === null
            ? Http::response(['message' => 'PIN nije unesen'], 500)
            : Http::response(ofsInvoiceResponse($response), 200),
    ]);

    return true;
}

/** Shape of a successful POST /api/invoices response, per api.ofs.ba. */
function ofsInvoiceResponse(array $overrides = []): array
{
    return $overrides + [
        'invoiceNumber' => 'F41AEFFF-F41AEFFF-138',
        'invoiceCounter' => '100/138ПП',
        'invoiceCounterExtension' => 'ПП',
        'totalAmount' => 100.0,
        'sdcDateTime' => '2026-07-30T12:00:00+02:00',
        'verificationUrl' => 'https://sandbox.suf.uino.gov.ba/v/?vl=test',
        'verificationQRCode' => base64_encode('qr'),
        'journal' => '============ ФИСКАЛНИ РАЧУН ============',
        'messages' => 'Успешно',
        'mrc' => '01-0001-TEST',
        'invoiceImagePngBase64' => base64_encode('fake-receipt-png'),
    ];
}

function ofsArticle(User $user, Company $company, string $name, string $taxRate): int
{
    $response = test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/articles", [
            'name' => $name,
            'unit' => 'kom',
            'tax_rate' => $taxRate,
        ]);

    $response->assertStatus(201);

    return $response->json('data.id');
}

function ofsStoreInvoice(User $user, Company $company, Client $client, array $totals, array $items): int
{
    $response = test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", $totals + [
            'client_id' => $client->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'language' => \App\Models\Enums\LanguageEnum::Bosnian->value,
            'invoice_template' => \App\Models\Enums\DocumentTemplateEnum::Classic->value,
            'payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::Cash->value,
            'discount_total' => 0,
            'items' => $items,
        ]);

    $response->assertStatus(201);

    return $response->json('data.id');
}

/** @return array{0: User, 1: Company, 2: Client} */
function ofsTenant(): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $client = Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    return [$user, $company, $client];
}

it('F 11% - 1 item 100 BAM: invoice store pa fiscalize', function () {
    [$user, $company, $client] = ofsTenant();
    useOfs($company);

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 9009, 'tax_total' => 991, 'total' => 10000],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 10000,
            'subtotal' => 9009,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 991,
            'total' => 10000,
        ]],
    );

    $response = $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.request_id', fn ($v) => str_starts_with($v, 'inv-'));

    expect($response->json('data.fiscal_invoice_number'))->not->toBeNull();

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized')
        ->and($invoice->total)->toBe(10000);
});

it('F 11% - 2 items 50 BAM each: invoice store pa fiscalize', function () {
    [$user, $company, $client] = ofsTenant();
    useOfs($company);

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 9010, 'tax_total' => 990, 'total' => 10000],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 2,
            'unit_price' => 5000,
            'subtotal' => 9010,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 990,
            'total' => 10000,
        ]],
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200)
        ->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized')
        ->and($invoice->total)->toBe(10000);
});

it('P 40% - 1 item 140 BAM: invoice store pa fiscalize', function () {
    [$user, $company, $client] = ofsTenant();
    useOfs($company, ['totalAmount' => 140.0]);

    $articleId = ofsArticle($user, $company, 'Usluga P', 'P');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 10000, 'tax_total' => 4000, 'total' => 14000],
        [[
            'article_id' => $articleId,
            'name' => 'Usluga P',
            'quantity' => 1,
            'unit_price' => 14000,
            'subtotal' => 10000,
            'tax_rate' => 4000,
            'tax_label' => 'P',
            'tax_amount' => 4000,
            'total' => 14000,
        ]],
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200)
        ->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized')
        ->and($invoice->total)->toBe(14000);
});

it('Multiple items F + P: invoice store pa fiscalize', function () {
    [$user, $company, $client] = ofsTenant();
    useOfs($company, ['totalAmount' => 340.0]);

    $articleFId = ofsArticle($user, $company, 'Artikl F', 'F');
    $articlePId = ofsArticle($user, $company, 'Usluga P', 'P');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 28018, 'tax_total' => 5982, 'total' => 34000],
        [
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
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200)
        ->assertJson(['success' => true]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('fiscalized')
        ->and($invoice->total)->toBe(34000);
});

it('sends the three headers OFS requires and a payment equal to the sum of the items', function () {
    [$user, $company, $client] = ofsTenant();

    if (! useOfs($company)) {
        $this->markTestSkipped('Running against a live device — request assertions need the fake.');
    }

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 9009, 'tax_total' => 991, 'total' => 10000],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 10000,
            'subtotal' => 9009,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 991,
            'total' => 10000,
        ]],
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200);

    Http::assertSent(function ($request) {
        $body = $request->data();
        $invoiceRequest = $body['invoiceRequest'];
        $items = $invoiceRequest['items'];

        expect($request->url())->toBe(OFS_FAKE_BASE_URL.'/api/invoices')
            // The cloud API needs all three, not just the bearer token.
            ->and($request->hasHeader('Authorization', 'Bearer '.OFS_FAKE_API_KEY))->toBeTrue()
            ->and($request->hasHeader('X-Teron-SerialNumber', OFS_FAKE_SERIAL_NUMBER))->toBeTrue()
            ->and($request->hasHeader('X-PAC', OFS_FAKE_PAC))->toBeTrue()
            // RequestId lets us recover the response if it is lost in transit.
            ->and($request->header('RequestId')[0])->toStartWith('inv-')
            ->and($invoiceRequest['invoiceType'])->toBe('Normal')
            ->and($invoiceRequest['transactionType'])->toBe('Sale')
            // Amounts go out in BAM, not in pfening.
            ->and($items[0]['totalAmount'])->toBe(100.0)
            ->and($items[0]['unitPrice'])->toBe(100.0)
            ->and($items[0]['labels'])->toBe(['F'])
            // Payment must equal the sum of the items or OFS rejects the invoice.
            ->and($invoiceRequest['payment'][0]['amount'])->toBe(array_sum(array_column($items, 'totalAmount')));

        return true;
    });
});

it('stores the fiscal record and its receipt from the response', function () {
    [$user, $company, $client] = ofsTenant();
    useOfs($company);

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 9009, 'tax_total' => 991, 'total' => 10000],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 10000,
            'subtotal' => 9009,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 991,
            'total' => 10000,
        ]],
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200);

    $record = FiscalRecord::where('invoice_id', $invoiceId)->firstOrFail();

    expect($record->fiscal_invoice_number)->toBe('F41AEFFF-F41AEFFF-138')
        ->and($record->fiscal_counter)->toBe('100/138ПП')
        ->and($record->verification_url)->toBe('https://sandbox.suf.uino.gov.ba/v/?vl=test')
        ->and(app(FiscalReceiptStore::class)->binary($record))->toBe('fake-receipt-png');
});

it('reports a failure from OFS instead of marking the invoice fiscalized', function () {
    [$user, $company, $client] = ofsTenant();

    if (! useOfs($company, null)) {
        $this->markTestSkipped('Cannot force a failure on a live device.');
    }

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 9009, 'tax_total' => 991, 'total' => 10000],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 10000,
            'subtotal' => 9009,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 991,
            'total' => 10000,
        ]],
    );

    $this->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(502)
        ->assertJson(['success' => false]);

    $invoice = \App\Models\Invoice::find($invoiceId);
    expect($invoice->status->value)->toBe('created')
        ->and(FiscalRecord::where('invoice_id', $invoiceId)->exists())->toBeFalse();
});
