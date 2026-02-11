<?php

use App\Models\User;
use App\Models\UserSetting;

it('me: user settings returns defaults with correct types', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/me/settings');

    $response->assertStatus(200);

    $settings = $response->json('data.settings');

    expect($settings['log_viewer_access_key'])->toBeNull()
        ->and($settings['support_link'])->toBeNull();
});

it('me: user settings can be updated', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->patchJson('/api/v1/me/settings', [
            'settings' => [
                'log_viewer_access_key' => 'abc123',
                'support_link' => 'https://support.example.com',
            ],
        ]);

    $response->assertStatus(200);

    expect(UserSetting::get('log_viewer_access_key', null, $user->id))->toBe('abc123')
        ->and(UserSetting::get('support_link', null, $user->id))->toBe('https://support.example.com');
});

it('me: cannot update user setting with invalid key', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->patchJson('/api/v1/me/settings', [
            'settings' => [
                'not_a_real_key' => 'x',
            ],
        ]);

    $response->assertStatus(422);
});
