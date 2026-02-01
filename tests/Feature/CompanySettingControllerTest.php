<?php

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\User;

it('tenant: company settings returns defaults with correct types', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/settings");

    $response->assertStatus(200);

    $settings = $response->json('data.settings');

    expect($settings['default_invoice_due_days'])->toBeInt()
        ->and($settings['invoice_numbering_reset_yearly'])->toBeBool()
        ->and($settings['default_invoice_template'])->toBeString()
        ->and($settings['invoice_footer_lines'])->toBeArray();
});

it('tenant: company settings can be updated and values are typed', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->patchJson("/api/v1/{$company->slug}/settings", [
            'settings' => [
                'default_invoice_due_days' => '30',
                'invoice_numbering_reset_yearly' => 'false',
                'invoice_numbering_prefix' => 'INV-',
                'invoice_footer_lines' => ['Line 1', 'Line 2'],
            ],
        ]);

    $response->assertStatus(200);

    expect(CompanySetting::get('default_invoice_due_days', null, $company->id))->toBe(30)
        ->and(CompanySetting::get('invoice_numbering_reset_yearly', null, $company->id))->toBeFalse();
});

it('tenant: user cannot access company settings for inaccessible company', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson("/api/v1/{$company->slug}/settings");

    $response->assertStatus(403);
});

it('tenant: cannot update company setting with invalid key', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->patchJson("/api/v1/{$company->slug}/settings", [
            'settings' => [
                'not_a_real_key' => 'x',
            ],
        ]);

    $response->assertStatus(422);
});

it('tenant: cannot update company setting with invalid type', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    attachUserToCompany($user, $company);

    $response = $this->withHeaders(authHeaders($user))
        ->patchJson("/api/v1/{$company->slug}/settings", [
            'settings' => [
                'default_invoice_due_days' => 'not-an-int',
            ],
        ]);

    $response->assertStatus(422);
});
