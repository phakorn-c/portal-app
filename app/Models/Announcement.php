<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'organization',
        'category',
        'method',
        'budget',
        'location',
        'reference_price',
        'contact_name',
        'contact_phone',
        'description',
        'status',
        'publication_status',
        'deadline',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'published_at' => 'datetime',
            'deadline' => 'date',
        ];
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AnnouncementAttachment::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('publication_status', 'published');
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('publication_status', 'published');
    }
}
