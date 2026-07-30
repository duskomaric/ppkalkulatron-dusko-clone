<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test case is the environment in which
| your tests will be executed. The closure should return a PHPUnit
| test case or a Pest test case. The default is to use the base test
| case provided by Laravel.
|
*/

use Tests\TestCase;

uses(TestCase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out of the box, you may have some testing
| code specific to your application that you don't want to repeat in
| your tests. Here you can also expose helpers as global functions to
| help you to reduce the number of lines of code in your test files.
|
*/

function createTestUser()
{
    return \App\Models\User::factory()->create([
        'password' => bcrypt('password'),
    ]);
}

function createTestCompany()
{
    return \App\Models\Company::factory()->create();
}

function createTestToken($user)
{
    return $user->createToken('test')->plainTextToken;
}

function authHeaders($user): array
{
    return [
        'Authorization' => 'Bearer ' . createTestToken($user),
    ];
}

function attachUserToCompany($user, $company): void
{
    $user->companies()->attach($company->id);
}

/*
|--------------------------------------------------------------------------
| OFS fiscalization helpers
|--------------------------------------------------------------------------
|
| OFS is faked in tests. It used to be called for real, which meant every run of
| the suite asked a live fiscal system to issue receipts. Set OFS_LIVE_BASE_URL
| (plus OFS_LIVE_API_KEY, OFS_LIVE_SERIAL_NUMBER, OFS_LIVE_PAC) to talk to a real
| device instead — every run then issues real fiscal receipts.
|
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
function useOfs(\App\Models\Company $company, ?array $response = []): bool
{
    $liveBaseUrl = env('OFS_LIVE_BASE_URL');

    \App\Models\CompanySetting::set('ofs_base_url', $liveBaseUrl ?: OFS_FAKE_BASE_URL, $company->id);
    \App\Models\CompanySetting::set('ofs_api_key', env('OFS_LIVE_API_KEY', OFS_FAKE_API_KEY), $company->id);
    \App\Models\CompanySetting::set('ofs_serial_number', env('OFS_LIVE_SERIAL_NUMBER', OFS_FAKE_SERIAL_NUMBER), $company->id);
    \App\Models\CompanySetting::set('ofs_pac', env('OFS_LIVE_PAC', OFS_FAKE_PAC), $company->id);
    \App\Models\CompanySetting::flushCache($company->id);

    if ($liveBaseUrl) {
        return false;
    }

    \Illuminate\Support\Facades\Http::fake([
        '*/api/invoices' => $response === null
            ? \Illuminate\Support\Facades\Http::response(['message' => 'PIN nije unesen'], 500)
            : \Illuminate\Support\Facades\Http::response(ofsInvoiceResponse($response), 200),
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

function ofsArticle($user, \App\Models\Company $company, string $name, string $taxRate): int
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

function ofsStoreInvoice($user, \App\Models\Company $company, ?\App\Models\Client $client, array $totals, array $items): int
{
    $response = test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices", $totals + [
            'client_id' => $client?->id,
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

/** @return array{0: \App\Models\User, 1: \App\Models\Company, 2: \App\Models\Client} */
function ofsTenant(): array
{
    $user = \App\Models\User::factory()->create();
    $company = \App\Models\Company::factory()->create();
    $client = \App\Models\Client::factory()->create(['company_id' => $company->id]);
    attachUserToCompany($user, $company);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    return [$user, $company, $client];
}
