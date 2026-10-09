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
        'source_url',
        'source_reference',
        'source_document_key',
        'project_key',
        'project_no',
        'notice_type',
        'procurement_category',
        'tags',
        'display_price',
        'display_price_source',
        'province',
        'district',
        'subdistrict',
        'location_source',
        'contact_website',
        'announcer_name',
        'announcer_position',
        'winner_name',
        'winning_price',
        'bidders',
        'announced_at',
        'submission_deadline',
        'award_announced_at',
        'process_status',
        'source_id',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'display_price' => 'decimal:2',
            'winning_price' => 'decimal:2',
            'tags' => 'array',
            'bidders' => 'array',
            'published_at' => 'datetime',
            'deadline' => 'date',
            'announced_at' => 'date',
            'submission_deadline' => 'date',
            'award_announced_at' => 'date',
        ];
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AnnouncementAttachment::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $this->scopeVisible($query);
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('publication_status', 'published')
            ->where(function (Builder $builder): void {
                $builder->whereNull('source_document_key')
                    ->orWhereHas('attachments.extraction', fn (Builder $extraction): Builder => $extraction->where('status', 'approved'));
            });
    }
}
