<?php

use App\Models\User;

it('admin dashboard returns 200 for admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/admin');

    $response->assertStatus(200);
});

it('admin dashboard denies registered users', function () {
    $user = User::factory()->create(['role' => 'registered']);

    $response = $this->actingAs($user)->get('/admin');

    $response->assertStatus(403);
});

it('admin users page returns 200 for admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/admin/users');

    $response->assertStatus(200);
});

it('admin users page denies registered users', function () {
    $user = User::factory()->create(['role' => 'registered']);

    $response = $this->actingAs($user)->get('/admin/users');

    $response->assertStatus(403);
});

it('admin can update user role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'registered']);

    $response = $this->actingAs($admin)->patch("/admin/users/{$user->id}/role", [
        'role' => 'admin',
    ]);

    $response->assertStatus(200);
    $this->assertEquals('admin', $user->fresh()->role);
});

it('admin cannot demote last admin', function () {
    // Ensure there's only one admin
    User::where('role', 'admin')->delete();
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->patch("/admin/users/{$admin->id}/role", [
        'role' => 'registered',
    ]);

    $response->assertStatus(422);
    $this->assertEquals('admin', $admin->fresh()->role);
});
