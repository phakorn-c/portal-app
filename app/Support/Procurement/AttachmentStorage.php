<?php

namespace App\Support\Procurement;

use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
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
            [$attachment, $oldStoredKeys] = DB::transaction(function () use (
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

                if (! ProcessDocumentExtraction::dispatchFor($extraction->id)) {
                    throw AttachmentStorageException::dispatchFailed();
                }

                $oldAttachments->each->delete();

                return [$attachment, $this->replaceableKeys($oldAttachments)];
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

        foreach ($oldStoredKeys as $oldStoredKey) {
            $this->deleteRegularStoredFile($disk, $oldStoredKey);
        }

        return $attachment;
    }

    private function lockParent(Announcement $announcement, array $attributes): Announcement
    {
        if (! $announcement->exists) {
            $announcement->fill($attributes)->save();
        }

        $parent = Announcement::query()->lockForUpdate()->findOrFail($announcement->getKey());

        if ($announcement->exists && $attributes !== []) {
            $parent->update($attributes);
        }

        return $parent;
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
