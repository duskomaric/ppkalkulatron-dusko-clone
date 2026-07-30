<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;

/**
 * buyerId, per api.ofs.ba: "identifikacija kupca (JIB firme, broj lične karte, broj pasoša)", and
 * "Ukoliko je u pitanju evidentiranje prometa u veleprodaji neophodno je da ovo polje počinja sa
 * prefiksom 'VP:'".
 *
 * The client's JIB is vat_id ("Identifikacioni broj"); tax_id holds the PDV number and must not be
 * sent as the buyer's identification.
 */
function buyerIdTenant(array $clientAttributes = [], bool $wholesale = false): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    useOfs($company);

    if ($wholesale) {
        CompanySetting::set('ofs_wholesale', true, $company->id);
    }

    $client = Client::factory()->create($clientAttributes + ['company_id' => $company->id]);

    return [$user, $company, $client];
}

function fiscalizeSimpleInvoice(User $user, Company $company, ?Client $client)
{
    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');

    $response = test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", [
            'client_id' => $client?->id,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'language' => \App\Models\Enums\LanguageEnum::Bosnian->value,
            'invoice_template' => \App\Models\Enums\DocumentTemplateEnum::Classic->value,
            'payment_type' => \App\Models\Enums\FiscalPaymentTypeEnum::Cash->value,
            'subtotal' => 9009,
            'tax_total' => 991,
            'discount_total' => 0,
            'total' => 10000,
            'items' => [[
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
        ]);

    $response->assertStatus(201);

    return test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$response->json('data.id')}/fiscalize");
}

/**
 * The store endpoint requires client_id, but the column is nullable and the domain treats
 * "null = račun bez klijenta", so build that case directly.
 */
function fiscalizeInvoiceWithoutClient(User $user, Company $company)
{
    $invoice = \App\Models\Invoice::factory()->create([
        'company_id' => $company->id,
        'client_id' => null,
        'invoice_number' => '0001/2026',
        'status' => \App\Models\Enums\DocumentStatusEnum::Created,
        'total' => 10000,
        'total_bam' => 10000,
    ]);

    \App\Models\InvoiceItem::factory()->create([
        'invoice_id' => $invoice->id,
        'article_id' => null,
        'name' => 'Artikl F',
        'quantity' => 1,
        'unit_price' => 10000,
        'unit_price_bam' => 10000,
        'tax_label' => 'F',
        'total' => 10000,
        'total_bam' => 10000,
    ]);

    return test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoice->id}/fiscalize");
}

/** @return string|null the buyerId OFS received, or null when the field was omitted */
function sentBuyerId(): ?string
{
    $buyerId = null;

    Http::assertSent(function ($request) use (&$buyerId) {
        $buyerId = $request->data()['invoiceRequest']['buyerId'] ?? null;

        return true;
    });

    return $buyerId;
}

it('sends the buyer JIB in retail, not the PDV number', function () {
    [$user, $company, $client] = buyerIdTenant([
        'vat_id' => '4200000000001',  // JIB
        'tax_id' => '200000000001',   // PDV — must not be sent
    ]);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    expect(sentBuyerId())->toBe('4200000000001');
});

it('omits buyerId in retail when the client has no JIB', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => null, 'tax_id' => '200000000001']);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    expect(sentBuyerId())->toBeNull();
});

it('omits buyerId in retail when the invoice has no client', function () {
    [$user, $company] = buyerIdTenant();

    fiscalizeInvoiceWithoutClient($user, $company)->assertStatus(200);

    expect(sentBuyerId())->toBeNull();
});

it('prefixes the JIB with VP for wholesale', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => '4200000000001'], wholesale: true);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    expect(sentBuyerId())->toBe('VP:4200000000001');
});

it('does not prefix a JIB that already carries VP', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => 'VP:4200000000001'], wholesale: true);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    expect(sentBuyerId())->toBe('VP:4200000000001');
});

it('sends the all-nines JIB for a foreign wholesale buyer', function () {
    [$user, $company, $client] = buyerIdTenant(
        ['vat_id' => null, 'country' => 'Germany'],
        wholesale: true,
    );

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    expect(sentBuyerId())->toBe('VP:9999999999999');
});

it('treats a client without a country as domestic', function (string $country) {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => null, 'country' => $country], wholesale: true);

    // Domestic and no JIB — refused rather than reported as a foreign buyer.
    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(422);
})->with(['', 'BA', 'BiH', 'Bosna i Hercegovina', 'Bosnia and Herzegovina']);

it('refuses wholesale fiscalization when the buyer has no JIB', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => null, 'country' => 'BA'], wholesale: true);

    $response = fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(422);

    expect($response->json('message'))->toContain('JIB kupca')
        ->and($response->json('success'))->toBeFalse();

    Http::assertNothingSent();
});

it('refuses wholesale fiscalization for an invoice without a client', function () {
    [$user, $company] = buyerIdTenant(wholesale: true);

    $response = fiscalizeInvoiceWithoutClient($user, $company)->assertStatus(422);

    expect($response->json('message'))->toContain('bez klijenta');
});

it('leaves the invoice unfiscalized when wholesale is refused', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => null, 'country' => 'BA'], wholesale: true);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(422);

    expect(\App\Models\Invoice::where('company_id', $company->id)->first()->status->value)->toBe('created');
});

it('does not send a personal email address with the invoice', function () {
    [$user, $company, $client] = buyerIdTenant(['vat_id' => '4200000000001']);

    fiscalizeSimpleInvoice($user, $company, $client)->assertStatus(200);

    Http::assertSent(function ($request) {
        // A hardcoded address used to go out on every fiscalization, for every company.
        expect($request->data())->not->toHaveKey('email');

        return true;
    });
});
