<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\ListingHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PdfController extends Controller
{
    public function show(Request $request, Announcement $announcement, AnnouncementAttachment $attachment): StreamedResponse
    {
        $this->assertCanAccessAttachment($request, $announcement, $attachment);

        return response()->stream(function () use ($attachment): void {
            $this->streamAttachment($attachment);
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $this->contentDisposition('inline', $attachment->filename),
        ]);
    }

    public function download(Request $request, Announcement $announcement, AnnouncementAttachment $attachment): StreamedResponse
    {
        $this->assertCanAccessAttachment($request, $announcement, $attachment);

        return response()->stream(function () use ($attachment): void {
            $this->streamAttachment($attachment);
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $this->contentDisposition('attachment', $attachment->filename),
        ]);
    }

    private function assertCanAccessAttachment(Request $request, Announcement $announcement, AnnouncementAttachment $attachment): void
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
    }

    private function streamAttachment(AnnouncementAttachment $attachment): void
    {
        $stream = Storage::disk('local')->readStream($attachment->stored_filename);

        if (is_resource($stream)) {
            fpassthru($stream);
            fclose($stream);
        }
    }

    private function contentDisposition(string $type, string $clientFilename): string
    {
        $filename = preg_replace('/[\x00-\x1F\x7F\/\\\\]/u', '-', $clientFilename) ?: 'document.pdf';
        $fallback = str_replace('%', '-', Str::ascii($filename)) ?: 'document.pdf';

        return HeaderUtils::makeDisposition($type, $filename, $fallback);
    }
}
