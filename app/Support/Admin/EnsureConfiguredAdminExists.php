<?php

namespace App\Support\Admin;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class EnsureConfiguredAdminExists
{
    /**
     * Ensure an admin user exists based on configuration values.
     *
     * Creates an admin user if the configuration is complete and the user doesn't exist.
     * Returns early if any required config is missing.
     * Does nothing if the user already exists (idempotent).
     *
     * @return bool True if admin was created, false otherwise
     */
    public static function handle(): bool
    {
        try {
            // Guard against missing users table (avoid pre-migration errors)
            if (! Schema::hasTable('users')) {
                return false;
            }

            // Read config values
            $email = config('admin.email');
            $password = config('admin.password');
            $firstName = config('admin.first_name');
            $lastName = config('admin.last_name');

            // Return early if any required config is missing or null
            if (! $email || ! $password || ! $firstName || ! $lastName) {
                return false;
            }

            // Check if user with this email already exists (idempotency)
            if (User::whereEmail($email)->exists()) {
                return false;
            }

            // Create the admin user
            $name = trim($firstName).' '.trim($lastName);

            User::create([
                'name' => $name,
                'email' => $email,
                'role' => 'admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            return true;
        } catch (QueryException $e) {
            // Database not available (e.g., during testing or before migrations)
            return false;
        }
    }
}
