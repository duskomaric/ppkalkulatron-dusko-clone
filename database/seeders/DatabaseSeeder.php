<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Enums\UserRoleEnum;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create existing admin user
        $adminUser = User::factory()->create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => 'admin',
            'role' => UserRoleEnum::ADMIN,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

        // Create 3 additional users
        $duskoUser = User::factory()->create([
            'first_name' => 'Dusko',
            'last_name' => 'User',
            'email' => 'dusko@dusko.com',
            'password' => 'dusko',
            'role' => UserRoleEnum::USER,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

        $sandroUser = User::factory()->create([
            'first_name' => 'Sandro',
            'last_name' => 'User',
            'email' => 'sandro@sandro.com',
            'password' => 'sandro',
            'role' => UserRoleEnum::USER,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

        $borisUser = User::factory()->create([
            'first_name' => 'Boris',
            'last_name' => 'User',
            'email' => 'boris@boris.com',
            'password' => 'boris',
            'role' => UserRoleEnum::USER,
            'is_active' => true,
            'last_seen_at' => now(),
        ]);

        // Create 4 companies
        $duskoCompany = Company::factory()->create(['name' => '++Dusko d.o.o.', 'slug' => 'plusplus-dusko']);
        $sandroCompany = Company::factory()->create(['name' => '++Sandro d.o.o.', 'slug' => 'plusplus-sandro']);
        $borisCompany = Company::factory()->create(['name' => '++Boris d.o.o.', 'slug' => 'plusplus-boris']);
        $plusiCompany = Company::factory()->create(['name' => '++i d.o.o.', 'slug' => 'plusplus-i']);

        // Assign companies to users
        // Dusko sees ++i and ++Dusko
        $duskoUser->companies()->attach([$duskoCompany->id, $plusiCompany->id]);

        // Sandro sees ++i and ++Sandro
        $sandroUser->companies()->attach([$sandroCompany->id, $plusiCompany->id]);

        // Boris sees ++i and ++Boris
        $borisUser->companies()->attach([$borisCompany->id, $plusiCompany->id]);

        // Admin sees ++i
        $adminUser->companies()->attach([$plusiCompany->id]);

        // Create clients for each company (test data for leak detection)
        $duskoCompany->clients()->createMany([
            ['name' => 'Dusko Client 1', 'email' => 'client1@dusko.com', 'phone' => '+381601111111'],
            ['name' => 'Dusko Client 2', 'email' => 'client2@dusko.com', 'phone' => '+381602222222'],
            ['name' => 'Dusko Client 3', 'email' => 'client3@dusko.com', 'phone' => '+381603333333'],
        ]);

        $sandroCompany->clients()->createMany([
            ['name' => 'Sandro Client 1', 'email' => 'client1@sandro.com', 'phone' => '+381604444444'],
            ['name' => 'Sandro Client 2', 'email' => 'client2@sandro.com', 'phone' => '+381605555555'],
            ['name' => 'Sandro Client 3', 'email' => 'client3@sandro.com', 'phone' => '+381606666666'],
        ]);

        $borisCompany->clients()->createMany([
            ['name' => 'Boris Client 1', 'email' => 'client1@boris.com', 'phone' => '+381607777777'],
            ['name' => 'Boris Client 2', 'email' => 'client2@boris.com', 'phone' => '+381608888888'],
            ['name' => 'Boris Client 3', 'email' => 'client3@boris.com', 'phone' => '+381609999999'],
        ]);

        $plusiCompany->clients()->createMany([
            ['name' => '++i Client 1', 'email' => 'client1@plusplus-i.com', 'phone' => '+381610101010'],
            ['name' => '++i Client 2', 'email' => 'client2@plusplus-i.com', 'phone' => '+381611202020'],
            ['name' => '++i Client 3', 'email' => 'client3@plusplus-i.com', 'phone' => '+381612303030'],
        ]);

        // Create articles for each company (test data for leak detection)
        $duskoCompany->articles()->createMany([
            ['name' => 'Dusko Article 1', 'type' => 'products'],
            ['name' => 'Dusko Article 2', 'type' => 'services'],
            ['name' => 'Dusko Article 3', 'type' => 'products'],
        ]);

        $sandroCompany->articles()->createMany([
            ['name' => 'Sandro Article 1', 'type' => 'products'],
            ['name' => 'Sandro Article 2', 'type' => 'services'],
            ['name' => 'Sandro Article 3', 'type' => 'products'],
        ]);

        $borisCompany->articles()->createMany([
            ['name' => 'Boris Article 1', 'type' => 'products'],
            ['name' => 'Boris Article 2', 'type' => 'services'],
            ['name' => 'Boris Article 3', 'type' => 'products'],
        ]);

        $plusiCompany->articles()->createMany([
            ['name' => '++i Article 1', 'type' => 'products'],
            ['name' => '++i Article 2', 'type' => 'services'],
            ['name' => '++i Article 3', 'type' => 'products'],
        ]);
    }
}
