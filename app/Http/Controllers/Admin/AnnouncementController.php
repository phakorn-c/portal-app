<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Jobs\EvaluateSavedSearchAlerts;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(): JsonResponse
    {
        $announcements = Announcement::with('attachments')->latest()->get();

        return response()->json($announcements);
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $data = $this->normalizePublicationData($request->safe()->except('attachment'));
        $announcement = Announcement::create($data);

        if ($request->hasFile('attachment')) {
            $this->attachPdf($announcement, $request->file('attachment'));
        }

        return response()->json($announcement->load('attachments'), 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json($announcement->load('attachments'));
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        $data = $this->normalizePublicationData($request->safe()->except('attachment'));
        $announcement->update($data);

        if ($request->hasFile('attachment')) {
            $this->removeStoredFiles($announcement);
            $announcement->attachments()->delete();
            $this->attachPdf($announcement, $request->file('attachment'));
        }

        return response()->json($announcement->load('attachments'));
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $this->removeStoredFiles($announcement);
        $announcement->delete();

        return response()->json(status: 204);
    }

    public function publish(Announcement $announcement): JsonResponse
    {
        $isAlreadyPublished = $announcement->publication_status === 'published' && $announcement->published_at !== null;

        if ($isAlreadyPublished) {
            return response()->json($announcement->refresh()->load('attachments'));
        }

        $announcement->update([
            'publication_status' => 'published',
            'published_at' => now(),
        ]);

        EvaluateSavedSearchAlerts::dispatch($announcement->refresh());

        return response()->json($announcement->refresh()->load('attachments'));
    }

    public function hide(Announcement $announcement): JsonResponse
    {
        $announcement->update([
            'publication_status' => 'hidden',
        ]);

        return response()->json($announcement->refresh()->load('attachments'));
    }

    protected function attachPdf(Announcement $announcement, ?UploadedFile $file): void
    {
        if (! $file instanceof UploadedFile) {
            return;
        }

        $storedFilename = $file->store('attachments', 'local');

        $announcement->attachments()->create([
            'filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_size' => $file->getSize() ?? 0,
            'mime_type' => $file->getMimeType() ?: 'application/pdf',
        ]);
    }

    protected function removeStoredFiles(Announcement $announcement): void
    {
        $announcement->attachments->each(function ($attachment): void {
            Storage::disk('local')->delete($attachment->stored_filename);
        });
    }

    protected function normalizePublicationData(array $data): array
    {
        if (($data['publication_status'] ?? null) === 'published' && ! isset($data['published_at'])) {
            $data['published_at'] = now();
        }

        if (($data['publication_status'] ?? null) !== 'published') {
            $data['published_at'] = null;
        }

        return $data;
    }
}
