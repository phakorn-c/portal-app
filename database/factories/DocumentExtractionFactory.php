<?php

namespace Database\Factories;

use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentExtractionFactory extends Factory
{
    protected $model = DocumentExtraction::class;

    public function definition(): array
    {
        return [
            'announcement_attachment_id' => AnnouncementAttachment::factory(),
            'status' => 'pending',
            'method' => null,
            'candidate' => null,
            'confidence' => null,
            'warnings' => null,
            'raw_text' => null,
            'error_message' => null,
            'attempt_count' => 0,
            'processing_token' => null,
            'processing_started_at' => null,
            'processed_at' => null,
            'approved_at' => null,
            'approved_by' => null,
        ];
    }
}
