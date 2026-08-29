<?php

namespace App\Support\Procurement;

use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use Illuminate\Database\QueryException;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

final class AttachmentStorage
{
    public const LOCK_NAME = 'procurement:attachment-storage';

    public const MANAGED_ROOT = 'attachments/managed';

    private const LOCK_SECONDS = 120;

    private const APPROVAL_INVALIDATING_FIELDS = [
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
        'deadline',
        'status',
        'source_url',
        'source_reference',
    ];

    public function store(
        Announcement $announcement,
        UploadedFile $file,
        array $announcementAttributes = [],
    ): AnnouncementAttachment {
        $lock = Cache::lock(self::LOCK_NAME, self::LOCK_SECONDS);

        if (! $lock->get()) {
            throw AttachmentStorageException::busy();
        }

        try {
            return $this->storeWhileLocked($announcement, $file, $announcementAttributes);
        } finally {
            $lock->release();
        }
    }

    public function updateAnnouncement(Announcement $announcement, array $attributes): Announcement
    {
        return DB::transaction(function () use ($announcement, $attributes): Announcement {
            $parent = Announcement::query()->lockForUpdate()->findOrFail($announcement->getKey());

            return $this->applyAnnouncementAttributes($parent, $attributes);
        });
    }

    private function storeWhileLocked(
        Announcement $announcement,
        UploadedFile $file,
        array $announcementAttributes,
    ): AnnouncementAttachment {
        $disk = Storage::disk('local');
        $basename = Str::uuid()->toString().'.pdf';
        $finalKey = self::MANAGED_ROOT.'/'.$basename;
        $uploadingKey = $finalKey.'.uploading';
        $storedKey = $file->storeAs(self::MANAGED_ROOT, $basename.'.uploading', 'local');

        if ($storedKey !== $uploadingKey) {
            $this->deleteNewFiles($disk, $uploadingKey, $finalKey);

            throw AttachmentStorageException::writeFailed();
        }

        $sha256 = hash_file('sha256', $disk->path($uploadingKey));

        if (! is_string($sha256)) {
            $this->deleteNewFiles($disk, $uploadingKey, $finalKey);

            throw AttachmentStorageException::writeFailed();
        }

        try {
            [$attachment, $extraction, $oldStoredKeys] = DB::transaction(function () use (
                $announcement,
                $announcementAttributes,
                $disk,
                $file,
                $finalKey,
                $sha256,
                $uploadingKey,
            ): array {
                $parent = $this->lockParent($announcement, $announcementAttributes);
                $oldAttachments = $parent->attachments()->lockForUpdate()->get();

                if (! $disk->move($uploadingKey, $finalKey)) {
                    throw AttachmentStorageException::writeFailed();
                }

                $attachment = $parent->attachments()->create([
                    'filename' => $file->getClientOriginalName(),
                    'stored_filename' => $finalKey,
                    'file_size' => $disk->size($finalKey),
                    'mime_type' => $file->getMimeType() ?: 'application/pdf',
                    'sha256' => $sha256,
                    'document_kind' => 'unknown',
                ]);
                $extraction = $attachment->extraction()->create(['status' => 'pending']);

                $oldAttachments->each->delete();

                return [$attachment, $extraction, $this->replaceableKeys($oldAttachments)];
            });
        } catch (QueryException $exception) {
            $this->deleteNewFiles($disk, $uploadingKey, $finalKey);

            if (AnnouncementAttachment::query()->where('sha256', $sha256)->exists()) {
                throw AttachmentStorageException::duplicate($exception);
            }

            throw $exception;
        } catch (Throwable $exception) {
            $this->deleteNewFiles($disk, $uploadingKey, $finalKey);

            throw $exception;
        }

        try {
            $dispatchFailed = ! ProcessDocumentExtraction::dispatchFor($extraction->id);
        } catch (Throwable) {
            $dispatchFailed = true;
        }

        if ($dispatchFailed) {
            DocumentExtraction::query()
                ->whereKey($extraction->id)
                ->where('status', 'pending')
                ->where('attempt_count', 0)
                ->update([
                    'status' => 'failed',
                    'error_message' => 'Extraction queue dispatch failed. Retry from the review page.',
                    'processed_at' => now(),
                ]);
        }

        foreach ($oldStoredKeys as $oldStoredKey) {
            $this->deleteRegularStoredFile($disk, $oldStoredKey);
        }

        return $attachment;
    }

    private function lockParent(Announcement $announcement, array $attributes): Announcement
    {
        if (! $announcement->exists) {
            $announcement->fill($attributes)->save();

            return Announcement::query()->lockForUpdate()->findOrFail($announcement->getKey());
        }

        $parent = Announcement::query()->lockForUpdate()->findOrFail($announcement->getKey());

        return $this->applyAnnouncementAttributes($parent, $attributes);
    }

    private function applyAnnouncementAttributes(Announcement $announcement, array $attributes): Announcement
    {
        if ($attributes === []) {
            return $announcement;
        }

        $announcement->fill($attributes);
        $invalidatesApproval = $announcement->isDirty(self::APPROVAL_INVALIDATING_FIELDS);
        $announcement->save();

        if ($invalidatesApproval) {
            DocumentExtraction::query()
                ->where('status', 'approved')
                ->whereHas('attachment', fn ($query) => $query->where('announcement_id', $announcement->id))
                ->lockForUpdate()
                ->get()
                ->each(fn (DocumentExtraction $extraction) => $extraction->update([
                    'status' => 'review',
                    'approved_at' => null,
                    'approved_by' => null,
                ]));
        }

        return $announcement;
    }

    private function replaceableKeys(Collection $attachments): array
    {
        return $attachments
            ->pluck('stored_filename')
            ->filter(fn (mixed $key): bool => is_string($key) && $this->isReplaceableKey($key))
            ->values()
            ->all();
    }

    private function isReplaceableKey(string $key): bool
    {
        return in_array(dirname($key), ['attachments', self::MANAGED_ROOT], true)
            && str_ends_with(basename($key), '.pdf');
    }

    private function deleteRegularStoredFile(FilesystemAdapter $disk, string $key): void
    {
        $path = $disk->path($key);

        if (! file_exists($path) || is_link($path) || ! is_file($path)) {
            return;
        }

        $disk->delete($key);
    }

    private function deleteNewFiles(FilesystemAdapter $disk, string $uploadingKey, string $finalKey): void
    {
        $disk->delete([$uploadingKey, $finalKey]);
    }
}
