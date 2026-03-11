<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\ListingHistory;
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
                'publication_status' => $announcement->publication_status,
                'published_at' => $announcement->published_at,
                'attachments' => $announcement->attachments->map(fn ($attachment): array => [
                    'id' => $attachment->id,
                    'filename' => $attachment->filename,
                    'url' => route('procurement.pdf', [
                        'announcement' => $announcement->id,
                        'attachment' => $attachment->id,
                    ]),
                ]),
            ],
        ]);
    }
}
