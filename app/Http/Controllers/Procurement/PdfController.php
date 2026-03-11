<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\ListingHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PdfController extends Controller
{
    public function show(Request $request, Announcement $announcement, AnnouncementAttachment $attachment): BinaryFileResponse
    {
        if ($announcement->publication_status !== 'published') {
            abort(404);
        }

        if ($attachment->announcement_id !== $announcement->id) {
            abort(404);
        }

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

        if (! Storage::disk('public')->exists($attachment->stored_filename)) {
            abort(404);
        }

        return response()->file(
            Storage::disk('public')->path($attachment->stored_filename),
            ['Content-Type' => 'application/pdf']
        );
    }
}
