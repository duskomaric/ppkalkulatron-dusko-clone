<?php

use App\Models\User;
use App\Models\Company;

it('admin: can list companies', function () {
    $admin = User::factory()->admin()->create();
    Company::factory()->count(2)->create();

    $response = $this->withHeaders(authHeaders($admin))
        ->getJson('/api/v1/companies');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'slug',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
});

it('cannot get companies list without authentication', function () {
    $response = $this->getJson('/api/v1/companies');

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'Unauthenticated.',
            'errors' => [
                'auth' => ['Authentication required. Please provide a valid token.']
            ]
        ]);
});

it('regular user cannot access companies endpoints', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/companies');

    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['Admin access required.']
            ]
        ]);
});
