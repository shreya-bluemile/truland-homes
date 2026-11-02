<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Local/demo login. Change the password immediately on any shared or live server.
        User::firstOrCreate(
            ['email' => 'admin@trulandhomes.com.au'],
            ['name' => 'Admin', 'password' => 'password']
        );

        $this->call([
            EmailTemplateSeeder::class,
            ReferenceDataSeeder::class,
        ]);
    }
}
