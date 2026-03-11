<?php

namespace Database\Factories;

use App\Models\SearchHistory;
use App\Models\User;
use App\Support\Procurement\FilterState;
use Illuminate\Database\Eloquent\Factories\Factory;

class SearchHistoryFactory extends Factory
{
    protected $model = SearchHistory::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'criteria' => FilterState::defaults(),
            'result_count' => fake()->numberBetween(0, 200),
            'searched_at' => now(),
        ];
    }
}
