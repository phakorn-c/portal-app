<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Jobs\EvaluateSavedSearchAlerts;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.dashboard');
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $data = $this->normalizePublicationData($request->safe()->except('attachment'));
        $announcement = Announcement::create($data);

        if ($request->hasFile('attachment')) {
            $this->attachPdf($announcement, $request->file('attachment'));
        }

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement created successfully.');
    }

    public function show(Announcement $announcement): RedirectResponse
    {
        return redirect()->route('admin.announcements.index');
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $data = $this->normalizePublicationData($request->safe()->except('attachment'));
        $announcement->update($data);

        if ($request->hasFile('attachment')) {
            $this->removeStoredFiles($announcement);
            $announcement->attachments()->delete();
            $this->attachPdf($announcement, $request->file('attachment'));
        }

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $this->removeStoredFiles($announcement);
        $announcement->delete();

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement deleted successfully.');
    }

    public function publish(Announcement $announcement): RedirectResponse
    {
        $isAlreadyPublished = $announcement->publication_status === 'published' && $announcement->published_at !== null;

        if ($isAlreadyPublished) {
            return redirect()->route('admin.announcements.index');
        }

        $announcement->update([
            'publication_status' => 'published',
            'published_at' => $announcement->published_at ?? now(),
        ]);

        EvaluateSavedSearchAlerts::dispatch($announcement->refresh());

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement published successfully.');
    }

    public function hide(Announcement $announcement): RedirectResponse
    {
        $announcement->update([
            'publication_status' => 'hidden',
        ]);

        return redirect()->route('admin.announcements.index')->with('success', 'Announcement hidden successfully.');
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
