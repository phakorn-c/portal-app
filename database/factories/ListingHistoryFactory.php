<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\ListingHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListingHistoryFactory extends Factory
{
    protected $model = ListingHistory::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'announcement_id' => Announcement::factory(),
            'viewed_at' => now(),
        ];
    }
}
