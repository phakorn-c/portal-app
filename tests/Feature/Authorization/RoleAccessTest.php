<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;

uses(RefreshDatabase::class);

test('guest is redirected to login when visiting admin dashboard', function () {
    $response = get('/admin');

    $response->assertRedirect(route('login'));
});

test('registered user receives forbidden when visiting admin dashboard', function () {
    $user = User::factory()->registered()->create();
    actingAs($user);

    $response = get('/admin');

    $response->assertForbidden();
});

test('admin user can visit admin dashboard', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = get('/admin');

    $response->assertOk();
});

test('dashboard redirects admin users to admin dashboard', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = get('/dashboard');

    $response->assertRedirect(route('admin.dashboard'));
});

test('dashboard redirects registered users to user dashboard', function () {
    $user = User::factory()->registered()->create();
    actingAs($user);

    $response = get('/dashboard');

    $response->assertRedirect(route('user.dashboard'));
});

test('procurement search remains public for guests', function () {
    $response = get('/procurement');

    $response->assertOk();
});

test('registered user cannot change another user\'s role', function () {
    $user = User::factory()->registered()->create();
    $otherUser = User::factory()->registered()->create();

    $response = actingAs($user)->patch("/admin/users/{$otherUser->id}/role", [
        'role' => 'admin',
    ]);

    $response->assertForbidden();
    $this->assertEquals('registered', $otherUser->fresh()->role);
});

test('guest cannot change user roles', function () {
    $user = User::factory()->registered()->create();

    $response = patch("/admin/users/{$user->id}/role", [
        'role' => 'admin',
    ]);

    $response->assertRedirect(route('login'));
    $this->assertEquals('registered', $user->fresh()->role);
});

test('registered user cannot change their own role', function () {
    $user = User::factory()->registered()->create();

    $response = actingAs($user)->patch("/admin/users/{$user->id}/role", [
        'role' => 'admin',
    ]);

    $response->assertForbidden();
    $this->assertEquals('registered', $user->fresh()->role);
});
