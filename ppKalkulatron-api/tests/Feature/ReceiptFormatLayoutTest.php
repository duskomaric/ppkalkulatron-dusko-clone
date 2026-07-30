<?php

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;

/**
 * The A4 ("Invoice") layout cannot render PNG. OFS does not say so — it answers 200 with a valid
 * but blank PNG, 82 bytes and one pixel tall, measured against the test register. So the
 * combination has to be kept from being saved, and tolerated if it is already stored.
 */
function settingsTenant(array $stored = []): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    foreach ($stored as $key => $value) {
        CompanySetting::set($key, $value, $company->id);
    }
    CompanySetting::flushCache($company->id);

    return [$user, $company];
}

function patchSettings(User $user, Company $company, array $settings)
{
    return test()->withHeaders(authHeaders($user))
        ->patchJson("/api/v1/{$company->slug}/settings", ['settings' => $settings]);
}

it('refuses a layout that cannot render the stored format', function () {
    [$user, $company] = settingsTenant(['ofs_receipt_image_format' => 'Png', 'ofs_receipt_layout' => 'Slip']);

    // Only the layout is sent — this is the request that used to slip through.
    patchSettings($user, $company, ['ofs_receipt_layout' => 'Invoice'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('settings.ofs_receipt_layout');

    expect(CompanySetting::get('ofs_receipt_layout', null, $company->id))->toBe('Slip');
});

it('refuses a format the stored layout cannot render', function () {
    [$user, $company] = settingsTenant(['ofs_receipt_layout' => 'Invoice', 'ofs_receipt_image_format' => 'Pdf']);

    patchSettings($user, $company, ['ofs_receipt_image_format' => 'Png'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('settings.ofs_receipt_image_format');

    expect(CompanySetting::get('ofs_receipt_image_format', null, $company->id))->toBe('Pdf');
});

it('accepts a layout change together with a format it can render', function () {
    [$user, $company] = settingsTenant(['ofs_receipt_layout' => 'Slip', 'ofs_receipt_image_format' => 'Png']);

    patchSettings($user, $company, [
        'ofs_receipt_layout' => 'Invoice',
        'ofs_receipt_image_format' => 'Pdf',
    ])->assertStatus(200);

    expect(CompanySetting::get('ofs_receipt_layout', null, $company->id))->toBe('Invoice')
        ->and(CompanySetting::get('ofs_receipt_image_format', null, $company->id))->toBe('Pdf');
});

it('accepts every combination the device can render', function (string $layout, string $format) {
    [$user, $company] = settingsTenant();

    patchSettings($user, $company, [
        'ofs_receipt_layout' => $layout,
        'ofs_receipt_image_format' => $format,
    ])->assertStatus(200);
})->with([
    ['Slip', 'Png'],
    ['Slip', 'Pdf'],
    ['Slip', 'Html'],
    ['Invoice', 'Pdf'],
    ['Invoice', 'Html'],
]);

it('does not fiscalize into a blank receipt when the stored pair is already broken', function () {
    [$user, $company] = settingsTenant([
        // Saved before the validation covered this, so it bypasses the request entirely.
        'ofs_receipt_layout' => 'Invoice',
        'ofs_receipt_image_format' => 'Png',
    ]);
    useOfs($company);
    $client = Client::factory()->create(['company_id' => $company->id, 'vat_id' => '4200000000001']);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');
    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 90, 'tax_total' => 10, 'total' => 100],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 100,
            'subtotal' => 90,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 10,
            'total' => 100,
        ]],
    );

    test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200);

    Http::assertSent(function ($request) {
        // Png would have come back as an 82-byte blank; Pdf renders.
        expect($request->data()['receiptImageFormat'])->toBe('Pdf')
            ->and($request->data()['receiptLayout'])->toBe('Invoice');

        return true;
    });
});

it('leaves a renderable format alone', function () {
    [$user, $company] = settingsTenant([
        'ofs_receipt_layout' => 'Slip',
        'ofs_receipt_image_format' => 'Html',
    ]);
    useOfs($company);
    $client = Client::factory()->create(['company_id' => $company->id, 'vat_id' => '4200000000001']);
    \App\Models\Currency::factory()->bam()->create(['company_id' => $company->id, 'is_default' => true]);

    $articleId = ofsArticle($user, $company, 'Artikl F', 'F');
    $invoiceId = ofsStoreInvoice($user, $company, $client,
        ['subtotal' => 90, 'tax_total' => 10, 'total' => 100],
        [[
            'article_id' => $articleId,
            'name' => 'Artikl F',
            'quantity' => 1,
            'unit_price' => 100,
            'subtotal' => 90,
            'tax_rate' => 1100,
            'tax_label' => 'F',
            'tax_amount' => 10,
            'total' => 100,
        ]],
    );

    test()->withHeaders(authHeaders($user))
        ->postJson("/api/v1/{$company->slug}/invoices/{$invoiceId}/fiscalize")
        ->assertStatus(200);

    Http::assertSent(function ($request) {
        expect($request->data()['receiptImageFormat'])->toBe('Html');

        return true;
    });
});
