<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\ListingHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PdfController extends Controller
{
    public function show(Request $request, Announcement $announcement, AnnouncementAttachment $attachment): StreamedResponse
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

        if (! Storage::disk('local')->exists($attachment->stored_filename)) {
            abort(404);
        }

        return response()->streamDownload(function () use ($attachment): void {
            $stream = Storage::disk('local')->readStream($attachment->stored_filename);

            if (is_resource($stream)) {
                fpassthru($stream);
                fclose($stream);
            }
        }, $attachment->filename, ['Content-Type' => 'application/pdf']);
    }
}
