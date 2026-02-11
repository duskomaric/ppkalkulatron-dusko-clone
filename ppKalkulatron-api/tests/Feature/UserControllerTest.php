<?php

use App\Models\User;

it('admin: can list users', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(2)->create();

    $response = $this->withHeaders(authHeaders($admin))
        ->getJson('/api/v1/users');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'role' => [
                        'value',
                        'label',
                        'color',
                    ],
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('cannot get users list without authentication', function () {
    $response = $this->getJson('/api/v1/users');

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'Unauthenticated.',
            'errors' => [
                'auth' => ['Authentication required. Please provide a valid token.']
            ]
        ]);
});

it('regular user cannot access users endpoints', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/users');

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['Admin access required.']
            ]
        ]);
});
