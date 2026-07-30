<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\FiscalRecord;
use App\Models\User;
use App\Services\FiscalReceiptStore;
use Illuminate\Support\Facades\Http;

/**
 * OFS is faked — see the helpers in tests/Pest.php for why, and for how to run against a real
 * device instead.
 *
 * What is worth asserting is our side of the exchange: the three headers OFS requires, a payment
 * total that matches the sum of the items, and what we do with the response.
 */
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
