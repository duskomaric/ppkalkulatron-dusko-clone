<?php

use App\Models\User;
use App\Models\Company;

it('auth: admin sees all companies on login', function () {
    $admin = User::factory()->admin()->create(['password' => bcrypt('password')]);
    Company::factory()->count(3)->create();

    $response = $this->postJson('/api/v1/login', [
        'email' => $admin->email,
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'companies' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                    ]
                ]
            ]
        ]);

    expect($response->json('user.companies'))->toHaveCount(3);
});

it('auth: regular user sees only assigned companies on login', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $companies = Company::factory()->count(3)->create();
    
    // Attach user to only one company
    $user->companies()->attach($companies[0]->id);
    
    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(200);
    
    // Check role is included in response
    expect($response->json('user.role'))->toMatchArray([
        'value' => 'user',
        'label' => 'User',
        'color' => 'blue',
    ]);
    
    // Regular user should only see their assigned company
    expect($response->json('user.companies'))->toHaveCount(1);
    expect($response->json('user.companies.0.id'))->toBe($companies[0]->id);
});
