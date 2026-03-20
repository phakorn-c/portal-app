<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\artisan;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\seed;

uses(RefreshDatabase::class);

test('admin is created from environment configuration on boot', function () {
    config([
        'admin.email' => 'admin@example.com',
        'admin.password' => 'password',
        'admin.first_name' => 'System',
        'admin.last_name' => 'Administrator',
    ]);

    // Trigger the boot service manually since config was set after boot
    \App\Support\Admin\EnsureConfiguredAdminExists::handle();

    $admin = User::query()->where('email', 'admin@example.com')->first();

    expect($admin)->not()->toBeNull();
    expect($admin->isAdmin())->toBeTrue();
    expect(Hash::check('password', $admin->password))->toBeTrue();
});

test('promote command upgrades a registered user to admin', function () {
    $user = User::factory()->registered()->create([
        'email' => 'registered@example.com',
    ]);

    artisan('user:promote', ['email' => $user->email])
        ->expectsOutput('User registered@example.com promoted to admin successfully.')
        ->assertExitCode(0);

    expect($user->fresh()->isAdmin())->toBeTrue();
});

test('demoting the last admin is rejected', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin);

    $response = patchJson(route('admin.users.update-role', $admin), [
        'role' => 'registered',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Cannot remove the last admin');

    expect($admin->fresh()->isAdmin())->toBeTrue();
});

test('deleting the last admin is rejected', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin);

    $response = deleteJson(route('admin.users.destroy', $admin));

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Cannot remove the last admin');

    expect(User::query()->whereKey($admin->id)->exists())->toBeTrue();
});
