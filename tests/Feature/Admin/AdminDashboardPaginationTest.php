<?php

namespace Tests\Feature\Admin;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcements_are_paginated_deterministically_when_timestamps_match(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $timestamp = now()->startOfSecond();
        $announcements = Announcement::factory()->count(30)->create([
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        $expectedIds = $announcements->pluck('id')->sortDesc()->values();

        $this->actingAs($admin)
            ->get('/admin')
            ->assertInertia(fn (Assert $page) => $page
                ->where('announcements.data', fn ($rows) => $rows->pluck('id')->values()->all() === $expectedIds->take(15)->all())
            );

        $this->actingAs($admin)
            ->get('/admin?page=2')
            ->assertInertia(fn (Assert $page) => $page
                ->where('announcements.data', fn ($rows) => $rows->pluck('id')->values()->all() === $expectedIds->skip(15)->values()->all())
            );
    }
}
