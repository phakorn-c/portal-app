<?php

namespace Database\Factories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(6),
            'organization' => fake()->company(),
            'category' => fake()->randomElement(['Construction', 'IT Services', 'Office Supplies']),
            'method' => fake()->randomElement(['e-bidding', 'specific method', 'selection']),
            'budget' => fake()->randomFloat(2, 10000, 5000000),
            'location' => fake()->optional()->city(),
            'reference_price' => fake()->optional()->randomFloat(2, 5000, 4500000),
            'contact_name' => fake()->optional()->name(),
            'contact_phone' => fake()->optional()->phoneNumber(),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(['open', 'urgent', 'closing', 'closed']),
            'publication_status' => 'draft',
            'published_at' => null,
            'deadline' => fake()->dateTimeBetween('now', '+2 months')->format('Y-m-d'),
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'publication_status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'publication_status' => 'draft',
            'published_at' => null,
        ]);
    }

    public function hidden(): static
    {
        return $this->state(fn () => [
            'publication_status' => 'hidden',
            'published_at' => null,
        ]);
    }
}
