<?php

namespace App\Console\Commands;

use App\Models\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Console\Command;

class CreateUserCommand extends Command
{
    protected $signature = 'user:create
                            {--first_name= : First name of the user}
                            {--last_name= : Last name of the user}
                            {--email= : Email address of the user}
                            {--password= : User password}';

    protected $description = 'Create or update a user via CLI. Usage example: php artisan user:create --first_name="Admin" --last_name="Adminic" --email="admin@stage" --password="5uperSecurePassword!"';

    public function handle(): int
    {
        $first_name = $this->option('first_name');
        $last_name = $this->option('last_name');
        $email = $this->option('email');
        $password = $this->option('password');

        if (! $first_name || ! $last_name || ! $email || ! $password) {
            $this->error('Missing required options: --first_name, --last_name, --email, --password');

            return self::FAILURE;
        }

        $user = User::updateOrCreate(
            [
                'email' => $email,
            ],
            [
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email,
                'email_verified_at' => now(),
                'password' => bcrypt($password),
                'role' => UserRoleEnum::ADMIN,
                'is_active' => true,
                'last_seen_at' => now()
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->info("User **created** successfully ({$user->first_name} {$user->last_name} | {$user->email}).");
        } else {
            $this->info("User **updated** successfully ({$user->first_name} {$user->last_name} | {$user->email}).");
        }

        return self::SUCCESS;
    }
}
