<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\ListingHistory;
use App\Support\Procurement\Taxonomy;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShowController extends Controller
{
    public function show(Request $request, Announcement $announcement): Response
    {
        if ($announcement->publication_status !== 'published') {
            abort(404);
        }

        $announcement->load('attachments');
        $sourceUrl = $announcement->source_url;
        $sourceScheme = is_string($sourceUrl) ? parse_url($sourceUrl, PHP_URL_SCHEME) : null;
        $sourceHost = is_string($sourceUrl) ? parse_url($sourceUrl, PHP_URL_HOST) : null;
        $hasApprovedExtraction = $announcement->attachments()
            ->whereHas('extraction', fn ($query) => $query->where('status', 'approved'))
            ->exists();
        $showsSourceAttribution = $hasApprovedExtraction
            && is_string($sourceScheme)
            && in_array(strtolower($sourceScheme), ['http', 'https'], true)
            && is_string($sourceHost)
            && $sourceHost !== '';

        $user = $request->user();
        if ($user && $user->email_verified_at) {
            ListingHistory::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'announcement_id' => $announcement->id,
                ],
                ['viewed_at' => now()]
            );
        }

        return Inertia::render('procurement/show', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'organization' => $announcement->organization,
                'category' => $announcement->category,
                'method' => $announcement->method,
                'budget' => $announcement->budget,
                'deadline' => $announcement->deadline,
                'status' => $announcement->status,
                'description' => $announcement->description,
                'location' => $announcement->location,
                'contact_name' => $announcement->contact_name,
                'contact_phone' => $announcement->contact_phone,
                'publication_status' => $announcement->publication_status,
                'published_at' => $announcement->published_at,
                ...($showsSourceAttribution ? [
                    'source_url' => $sourceUrl,
                    'source_reference' => $announcement->source_reference,
                ] : []),
                'attachments' => $announcement->attachments->map(fn ($attachment): array => [
                    'id' => $attachment->id,
                    'filename' => $attachment->filename,
                    'url' => route('procurement.pdf', [
                        'announcement' => $announcement->id,
                        'attachment' => $attachment->id,
                    ]),
                    'preview_url' => route('procurement.pdf', [
                        'announcement' => $announcement->id,
                        'attachment' => $attachment->id,
                    ]),
                    'download_url' => route('procurement.pdf.download', [
                        'announcement' => $announcement->id,
                        'attachment' => $attachment->id,
                    ]),
                ]),
            ],
            'taxonomy' => [
                'methodLabels' => Taxonomy::methods(),
                'categoryLabels' => Taxonomy::categories(),
            ],
        ]);
    }
}
