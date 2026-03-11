<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AnnouncementAttachmentFactory extends Factory
{
    protected $model = AnnouncementAttachment::class;

    public function definition(): array
    {
        $hash = Str::uuid()->toString();

        return [
            'announcement_id' => Announcement::factory(),
            'filename' => fake()->slug().'.pdf',
            'stored_filename' => 'attachments/'.$hash.'.pdf',
            'file_size' => fake()->numberBetween(1024, 20 * 1024 * 1024),
            'mime_type' => 'application/pdf',
        ];
    }
}
