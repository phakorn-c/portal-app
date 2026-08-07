<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentExtraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_attachment_id',
        'status',
        'method',
        'candidate',
        'confidence',
        'warnings',
        'raw_text',
        'error_message',
        'attempt_count',
        'processing_token',
        'processing_started_at',
        'processed_at',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'candidate' => 'array',
            'confidence' => 'array',
            'warnings' => 'array',
            'processing_started_at' => 'datetime',
            'processed_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function attachment(): BelongsTo
    {
        return $this->belongsTo(AnnouncementAttachment::class, 'announcement_attachment_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
