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
