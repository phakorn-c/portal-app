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
        if (! Announcement::query()->visible()->whereKey($announcement->id)->exists()) {
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
                'reference_price' => $announcement->reference_price,
                'deadline' => $announcement->deadline,
                'status' => $announcement->status,
                'description' => $announcement->description,
                'location' => $announcement->location,
                'contact_name' => $announcement->contact_name,
                'contact_phone' => $announcement->contact_phone,
                'publication_status' => $announcement->publication_status,
                'published_at' => $announcement->published_at,
                'project_key' => $announcement->project_key,
                'project_no' => $announcement->project_no,
                'notice_type' => $announcement->notice_type,
                'procurement_category' => $announcement->procurement_category,
                'tags' => $announcement->tags,
                'display_price' => $announcement->display_price,
                'display_price_source' => $announcement->display_price_source,
                'province' => $announcement->province,
                'district' => $announcement->district,
                'subdistrict' => $announcement->subdistrict,
                'location_source' => $announcement->location_source,
                'contact_website' => $announcement->contact_website,
                'announcer_name' => $announcement->announcer_name,
                'announcer_position' => $announcement->announcer_position,
                'winner_name' => $announcement->notice_type === 'award' ? $announcement->winner_name : null,
                'winning_price' => $announcement->notice_type === 'award' ? $announcement->winning_price : null,
                'bidders' => $announcement->notice_type === 'award' ? $announcement->bidders : null,
                'announced_at' => $announcement->announced_at,
                'submission_deadline' => $announcement->submission_deadline,
                'award_announced_at' => $announcement->award_announced_at,
                'process_status' => $announcement->process_status,
                'source_id' => $announcement->source_id,
                ...($showsSourceAttribution ? [
                    'source_url' => $sourceUrl,
                    'source_reference' => $announcement->source_reference,
                ] : []),
                'attachments' => $announcement->attachments->map(fn ($attachment): array => [
                    'id' => $attachment->id,
                    'filename' => $attachment->filename,
                    'mime_type' => $attachment->mime_type,
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
