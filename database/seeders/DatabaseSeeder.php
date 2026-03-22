<?php

namespace Database\Seeders;

use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $demoPassword = Hash::make('password');

        DB::table('users')->updateOrInsert(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Demo Admin',
                'email_verified_at' => '2026-03-22 09:00:00',
                'role' => 'admin',
                'password' => $demoPassword,
                'created_at' => '2026-03-22 09:00:00',
                'updated_at' => '2026-03-22 09:00:00',
            ],
        );

        DB::table('users')->updateOrInsert(
            ['email' => 'test@example.com'],
            [
                'name' => 'Demo Member',
                'email_verified_at' => '2026-03-22 09:05:00',
                'role' => 'registered',
                'password' => $demoPassword,
                'created_at' => '2026-03-22 09:05:00',
                'updated_at' => '2026-03-22 09:05:00',
            ],
        );

        $testUser = User::where('email', 'test@example.com')->first();
        if ($testUser) {
            NotificationPreference::updateOrCreate(
                ['user_id' => $testUser->id],
                [
                    'website_enabled' => true,
                    'email_enabled' => true,
                ]
            );
        }

        $this->call(DemoAnnouncementSeeder::class);
    }
}
