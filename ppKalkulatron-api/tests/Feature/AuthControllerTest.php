<?php

use App\Models\User;

it('auth: user can login and receives token + user payload', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'role' => [
                    'value',
                    'label',
                    'color',
                ],
                'is_active',
            ]
        ]);
});

it('auth: login fails with invalid credentials', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(422)
        ->assertJsonStructure([
            'message',
            'errors' => [
                'email',
            ]
        ]);
});
