<?php

namespace Tests\Feature;

use App\Models\Enums\UserRoleEnum;
use App\Models\User;
use Tests\TestCase;

class CreateUserCommandTest extends TestCase
{
    public function test_user_create_creates_user_when_not_exists(): void
    {
        $exitCode = $this->artisan('user:create', [
            '--first_name' => 'Admin',
            '--last_name' => 'Adminic',
            '--email' => 'admin@example.test',
            '--password' => '5uperSecurePassword!',
        ])->run();

        $this->assertSame(0, $exitCode);

        $user = User::query()->where('email', 'admin@example.test')->firstOrFail();

        $this->assertSame('Admin', $user->first_name);
        $this->assertSame('Adminic', $user->last_name);
        $this->assertSame(UserRoleEnum::ADMIN, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_user_create_updates_user_when_exists(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.test',
            'first_name' => 'Old',
            'last_name' => 'Name',
        ]);

        $exitCode = $this->artisan('user:create', [
            '--first_name' => 'New',
            '--last_name' => 'Adminic',
            '--email' => 'admin@example.test',
            '--password' => '5uperSecurePassword!',
        ])->run();

        $this->assertSame(0, $exitCode);

        $user->refresh();
        $this->assertSame('New', $user->first_name);
        $this->assertSame('Adminic', $user->last_name);
        $this->assertSame(UserRoleEnum::ADMIN, $user->role);
        $this->assertTrue($user->is_active);
    }
}
