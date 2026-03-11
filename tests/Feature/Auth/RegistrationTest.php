<?php

use App\Models\User;

use function Pest\Laravel\assertAuthenticated;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

test('registration screen can be rendered', function () {
    $response = get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('newly created user gets registered role', function () {
    $response = post(route('register.store'), [
        'name' => 'Registered User',
        'email' => 'registered@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::query()->where('email', 'registered@example.com')->firstOrFail();

    expect($user->role)->toBe('registered');
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('client cannot self assign admin role during registration', function () {
    $response = post(route('register.store'), [
        'name' => 'Admin Attempt',
        'email' => 'admin-attempt@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'admin',
    ]);

    $user = User::query()->where('email', 'admin-attempt@example.com')->firstOrFail();

    expect($user->role)->toBe('registered');
    $response->assertRedirect(route('dashboard', absolute: false));
});
