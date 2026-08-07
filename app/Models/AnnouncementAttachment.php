<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AnnouncementAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'filename',
        'stored_filename',
        'file_size',
        'mime_type',
        'sha256',
        'document_kind',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }

    public function extraction(): HasOne
    {
        return $this->hasOne(DocumentExtraction::class, 'announcement_attachment_id');
    }
}
