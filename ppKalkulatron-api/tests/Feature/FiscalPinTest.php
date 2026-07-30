<?php

use App\Http\Controllers\API\V1\FiscalController;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Http;

/**
 * PIN sigurnosnog elementa, per api.ofs.ba: POST /api/pin is "the only API call that accepts plain
 * text as input", the body is a 4-digit PIN, and success is HTTP 200 with the body "0100". It is
 * needed when GET /api/status reports code 1500 in "gsc" — a field that does not exist on a VPFR,
 * so this concerns the local ESIR.
 */
function pinTenant(): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);
    useOfs($company);

    return [$user, $company];
}

function postPin(User $user, Company $company, string $pin)
{
    return test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/fiscal/pin", ['pin' => $pin]);
}

it('sends the PIN as plain text, not as JSON', function () {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/pin' => Http::response('0100', 200)]);

    postPin($user, $company, '1234')->assertStatus(200)->assertJson(['success' => true]);

    Http::assertSent(function ($request) {
        expect($request->body())->toBe('1234')
            ->and($request->header('Content-Type')[0])->toContain('text/plain')
            ->and($request->hasHeader('Authorization', 'Bearer '.OFS_FAKE_API_KEY))->toBeTrue();

        return true;
    });
});

it('rejects a PIN that is not four digits', function (string $pin) {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/pin' => Http::response('0100', 200)]);

    postPin($user, $company, $pin)->assertStatus(422);

    Http::assertNothingSent();
})->with(['123', '12345', 'abcd', '12a4', '']);

it('explains each error code the device can answer with', function (string $code, string $expected) {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/pin' => Http::response($code, 400)]);

    $response = postPin($user, $company, '1234')->assertStatus(502);

    expect($response->json('success'))->toBeFalse()
        ->and($response->json('code'))->toBe($code)
        ->and($response->json('message'))->toContain($expected);
})->with([
    ['1300', 'Sigurnosni element nije prisutan'],
    ['2400', 'nije spreman'],
    ['2800', '4 cifre'],
    ['2806', '4 cifre'],
]);

it('does not treat an unexpected 200 body as success', function () {
    [$user, $company] = pinTenant();
    // 200 with something other than "0100" is not a confirmed PIN.
    Http::fake(['*/api/pin' => Http::response('9999', 200)]);

    postPin($user, $company, '1234')->assertStatus(502);
});

it('keeps the PIN out of the logs', function () {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/pin' => Http::response('0100', 200)]);

    \Illuminate\Support\Facades\Log::spy();

    postPin($user, $company, '1234')->assertStatus(200);

    \Illuminate\Support\Facades\Log::shouldNotHaveReceived('info', function ($message, $context = []) {
        return str_contains(json_encode($context), '1234');
    });
});

it('reports that the device is asking for a PIN', function () {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/status' => Http::response(['gsc' => ['1500'], 'uid' => 'TEST'], 200)]);

    $response = test()->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/fiscal/test-status")
        ->assertStatus(200);

    expect($response->json('pin_required'))->toBeTrue()
        ->and($response->json('message'))->toContain('traži PIN');
});

it('does not ask for a PIN when the status is clean', function () {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/status' => Http::response(['gsc' => [], 'uid' => 'TEST'], 200)]);

    $response = test()->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/fiscal/test-status")
        ->assertStatus(200);

    expect($response->json('pin_required'))->toBeFalse();
});

it('does not ask for a PIN on a cloud device, which has no gsc field', function () {
    [$user, $company] = pinTenant();
    Http::fake(['*/api/status' => Http::response(['uid' => 'TEST'], 200)]);

    $response = test()->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/fiscal/test-status")
        ->assertStatus(200);

    expect($response->json('pin_required'))->toBeFalse();
});

it('builds a RequestId that OFS accepts', function () {
    // OFS: "maksimalna dužina je 32 alfanumerička znaka".
    foreach (['inv', 'copy', 'refund'] as $prefix) {
        foreach ([1, 999_999_999] as $invoiceId) {
            $requestId = FiscalController::fiscalRequestId($prefix, $invoiceId);

            expect($requestId)->toMatch('/^[A-Za-z0-9]+$/')
                ->and(strlen($requestId))->toBeLessThanOrEqual(32)
                ->and($requestId)->toStartWith($prefix.$invoiceId);
        }
    }
});

it('refuses a client-supplied RequestId that OFS would reject', function (string $requestId, int $status) {
    [$user, $company] = pinTenant();
    $client = \App\Models\Client::factory()->create(['company_id' => $company->id, 'vat_id' => '4200000000001']);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

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

    test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize", ['request_id' => $requestId])
        ->assertStatus($status);
})->with([
    'hyphens are not alphanumeric' => ['inv-12-abcd', 422],
    'over 32 characters' => [str_repeat('a', 33), 422],
    'plain alphanumeric is fine' => ['inv12abcd', 200],
]);

it('sends a cashier name rather than a blank space', function () {
    // The columns are NOT NULL, so blank is how a nameless user actually looks.
    $user = User::factory()->create(['first_name' => '', 'last_name' => '']);
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);
    useOfs($company);
    $client = \App\Models\Client::factory()->create(['company_id' => $company->id, 'vat_id' => '4200000000001']);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

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

    test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200);

    Http::assertSent(function ($request) {
        // The old expression could never reach its fallback, so an unnamed user went out as " ".
        expect($request->data()['invoiceRequest']['cashier'])->toBe('Prodavac');

        return true;
    });
});
