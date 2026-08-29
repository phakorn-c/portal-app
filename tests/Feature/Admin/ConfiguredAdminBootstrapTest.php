<?php

/**
 * Tests for environment-driven admin bootstrap functionality.
 *
 * These tests verify that an admin user can be created automatically from
 * environment configuration variables when the application boots.
 * They ensure proper handling of complete configs, partial configs, idempotency,
 * existing users, and edge cases.
 */

use App\Models\User;
use App\Support\Admin\EnsureConfiguredAdminExists;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

describe('env-driven admin bootstrap', function () {
    it('never creates an administrator automatically in production', function () {
        $environment = app()->environment();
        app()->instance('env', 'production');
        config([
            'admin.email' => 'admin@example.com',
            'admin.password' => 'password',
            'admin.first_name' => 'Public',
            'admin.last_name' => 'Default',
        ]);

        try {
            expect(EnsureConfiguredAdminExists::handle())->toBeFalse()
                ->and(User::query()->count())->toBe(0);
        } finally {
            app()->instance('env', $environment);
        }
    });

    describe('successful admin creation', function () {
        it('creates admin when all required config values are present', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'SecurePassword123!',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeTrue();

            $admin = User::query()->where('email', 'admin@example.com')->first();

            expect($admin)->not->toBeNull()
                ->and($admin->email)->toBe('admin@example.com')
                ->and($admin->name)->toBe('John Doe')
                ->and($admin->isAdmin())->toBeTrue()
                ->and(Hash::check('SecurePassword123!', $admin->password))->toBeTrue()
                ->and($admin->email_verified_at)->not->toBeNull();
        });

        it('combines first and last names correctly', function () {
            config([
                'admin.email' => 'alice@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'Alice',
                'admin.last_name' => 'Smith',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'alice@example.com')->first();

            expect($admin->name)->toBe('Alice Smith');
        });

        it('sets email_verified_at to current timestamp', function () {
            $now = now();

            config([
                'admin.email' => 'verified@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'Test',
                'admin.last_name' => 'User',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'verified@example.com')->first();

            expect($admin->email_verified_at)->not->toBeNull();
            // Check that email_verified_at is within a reasonable time window (1 minute)
            expect($admin->email_verified_at->diffInSeconds($now))->toBeLessThan(60);
        });

        it('hashes password using Laravel hash', function () {
            $plainPassword = 'MySecurePassword123!@';

            config([
                'admin.email' => 'hashed@example.com',
                'admin.password' => $plainPassword,
                'admin.first_name' => 'Hash',
                'admin.last_name' => 'Test',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'hashed@example.com')->first();

            expect(Hash::check($plainPassword, $admin->password))->toBeTrue();
            expect($admin->password)->not->toBe($plainPassword);
        });

        it('sets role to admin', function () {
            config([
                'admin.email' => 'role@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'Role',
                'admin.last_name' => 'Check',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'role@example.com')->first();

            expect($admin->role)->toBe('admin');
            expect($admin->isAdmin())->toBeTrue();
        });
    });

    describe('partial or missing config', function () {
        it('does nothing when email is missing', function () {
            config([
                'admin.email' => null,
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });

        it('does nothing when password is missing', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => null,
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });

        it('does nothing when first_name is missing', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => null,
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });

        it('does nothing when last_name is missing', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => null,
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });

        it('does nothing when all config is missing', function () {
            config([
                'admin.email' => null,
                'admin.password' => null,
                'admin.first_name' => null,
                'admin.last_name' => null,
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });

        it('does nothing when config is empty string', function () {
            config([
                'admin.email' => '',
                'admin.password' => '',
                'admin.first_name' => '',
                'admin.last_name' => '',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->count())->toBe(0);
        });
    });

    describe('idempotency', function () {
        it('running bootstrap twice does not create duplicate admin', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            // First run
            $result1 = EnsureConfiguredAdminExists::handle();
            expect($result1)->toBeTrue();
            expect(User::query()->count())->toBe(1);

            // Second run
            $result2 = EnsureConfiguredAdminExists::handle();
            expect($result2)->toBeFalse();
            expect(User::query()->count())->toBe(1);
        });

        it('running bootstrap multiple times is safe', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            // Run multiple times
            for ($i = 0; $i < 3; $i++) {
                EnsureConfiguredAdminExists::handle();
            }

            expect(User::query()->count())->toBe(1);

            $admin = User::query()->first();
            expect($admin->email)->toBe('admin@example.com');
            expect($admin->name)->toBe('John Doe');
        });
    });

    describe('existing users', function () {
        it('does not modify existing user with same email', function () {
            $existingAdmin = User::factory()->admin()->create([
                'email' => 'admin@example.com',
                'name' => 'Existing Admin',
                'password' => Hash::make('oldPassword'),
            ]);

            $originalPassword = $existingAdmin->password;

            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'newPassword',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();

            $existingAdmin->refresh();

            expect($existingAdmin->name)->toBe('Existing Admin')
                ->and($existingAdmin->password)->toBe($originalPassword);
        });

        it('does not create duplicate when registered user exists with same email', function () {
            User::factory()->registered()->create([
                'email' => 'admin@example.com',
                'name' => 'Existing User',
            ]);

            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeFalse();
            expect(User::query()->where('email', 'admin@example.com')->count())->toBe(1);
        });

        it('allows creation when different admin email is configured', function () {
            User::factory()->admin()->create([
                'email' => 'existing@example.com',
            ]);

            config([
                'admin.email' => 'new-admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'New',
                'admin.last_name' => 'Admin',
            ]);

            $result = EnsureConfiguredAdminExists::handle();

            expect($result)->toBeTrue();
            expect(User::query()->count())->toBe(2);
            expect(User::query()->where('email', 'new-admin@example.com')->first())->not->toBeNull();
        });
    });

    describe('edge cases', function () {
        it('handles whitespace in names correctly', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => '  John  ',
                'admin.last_name' => '  Doe  ',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'admin@example.com')->first();

            // Should trim whitespace
            expect($admin->name)->toBe('John Doe');
        });

        it('handles special characters in password', function () {
            $specialPassword = 'P@$$w0rd!#%^&*()_+-=[]{}|;:,.<>?';

            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => $specialPassword,
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'admin@example.com')->first();

            expect(Hash::check($specialPassword, $admin->password))->toBeTrue();
        });

        it('handles unicode characters in names', function () {
            config([
                'admin.email' => 'admin@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'João',
                'admin.last_name' => 'Müller',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'admin@example.com')->first();

            expect($admin->name)->toBe('João Müller');
        });

        it('handles email with subdomain', function () {
            config([
                'admin.email' => 'admin@sub.example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'admin@sub.example.com')->first();

            expect($admin)->not->toBeNull()
                ->and($admin->email)->toBe('admin@sub.example.com');
        });

        it('handles email with plus addressing', function () {
            config([
                'admin.email' => 'admin+test@example.com',
                'admin.password' => 'Password123',
                'admin.first_name' => 'John',
                'admin.last_name' => 'Doe',
            ]);

            EnsureConfiguredAdminExists::handle();

            $admin = User::query()->where('email', 'admin+test@example.com')->first();

            expect($admin)->not->toBeNull()
                ->and($admin->email)->toBe('admin+test@example.com');
        });
    });
});
