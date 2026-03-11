<?php

namespace Database\Factories;

use App\Models\SavedSearch;
use App\Models\User;
use App\Support\Procurement\FilterState;
use Illuminate\Database\Eloquent\Factories\Factory;

class SavedSearchFactory extends Factory
{
    protected $model = SavedSearch::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->sentence(3),
            'criteria' => FilterState::defaults(),
            'alert_enabled' => false,
            'last_notified_at' => null,
        ];
    }

    public function withAlert(): static
    {
        return $this->state(fn () => [
            'alert_enabled' => true,
            'last_notified_at' => now(),
        ]);
    }
}
