<?php

namespace App\Console\Commands;

use App\Models\AnnouncementAttachment;
use App\Support\Procurement\AttachmentStorage;
use DirectoryIterator;
use Illuminate\Console\Command;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

final class ReconcileAttachmentStorage extends Command
{
    protected $signature = 'procurement:reconcile-attachments
        {--age=24 : Minimum file age in hours (minimum 24)}
        {--delete : Delete eligible orphan files instead of listing them}';

    protected $description = 'List or delete aged orphan files from managed attachment storage';

    public function handle(): int
    {
        $ageHours = filter_var($this->option('age'), FILTER_VALIDATE_INT);

        if (! is_int($ageHours) || $ageHours < 24) {
            $this->error('Attachment reconciliation age must be at least 24 hours.');

            return self::FAILURE;
        }

        $lock = Cache::lock(AttachmentStorage::LOCK_NAME, 120);

        if (! $lock->get()) {
            $this->error('The attachment storage lock is held; reconciliation was not started.');

            return self::FAILURE;
        }

        try {
            return $this->reconcile(Storage::disk('local'), $ageHours, (bool) $this->option('delete'));
        } finally {
            $lock->release();
        }
    }

    private function reconcile(FilesystemAdapter $disk, int $ageHours, bool $delete): int
    {
        $rootPath = $disk->path(AttachmentStorage::MANAGED_ROOT);

        if (! file_exists($rootPath)) {
            $this->info('Managed attachment root does not exist; nothing to reconcile.');

            return self::SUCCESS;
        }

        if (is_link($rootPath) || ! is_dir($rootPath) || ! $this->isExpectedRoot($disk, $rootPath)) {
            $this->error('The managed root must be a regular directory inside local storage.');

            return self::FAILURE;
        }

        $cutoff = now()->subHours($ageHours)->timestamp;
        $failed = false;

        foreach (new DirectoryIterator($rootPath) as $entry) {
            if ($entry->isDot()) {
                continue;
            }

            $key = AttachmentStorage::MANAGED_ROOT.'/'.$entry->getFilename();

            if ($entry->isLink()) {
                $this->warn("WARNING symlink skipped: {$key}");

                continue;
            }

            $stat = lstat($entry->getPathname());

            if (! is_array($stat)
                || ! $this->isRegularFile($stat['mode'])
                || ! $this->isCandidate($entry->getFilename())
                || $stat['mtime'] > $cutoff
                || AnnouncementAttachment::query()->where('stored_filename', $key)->exists()) {
                continue;
            }

            if (! $delete) {
                $this->line("DRY-RUN {$key}");

                continue;
            }

            $latest = lstat($entry->getPathname());

            if (! is_array($latest)
                || ! $this->isRegularFile($latest['mode'])
                || is_link($entry->getPathname())
                || $latest['mtime'] > $cutoff) {
                $this->warn("WARNING changed before deletion: {$key}");

                continue;
            }

            if (AnnouncementAttachment::query()->where('stored_filename', $key)->exists()) {
                $this->warn("WARNING referenced before deletion: {$key}");

                continue;
            }

            if (! $disk->delete($key)) {
                $this->warn("WARNING deletion failed: {$key}");
                $failed = true;

                continue;
            }

            $this->info("DELETED {$key}");
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    private function isExpectedRoot(FilesystemAdapter $disk, string $rootPath): bool
    {
        $diskRoot = realpath($disk->path(''));
        $managedRoot = realpath($rootPath);

        return is_string($diskRoot)
            && is_string($managedRoot)
            && $managedRoot === $diskRoot.DIRECTORY_SEPARATOR.'attachments'.DIRECTORY_SEPARATOR.'managed';
    }

    private function isCandidate(string $filename): bool
    {
        return str_ends_with($filename, '.pdf') || str_ends_with($filename, '.pdf.uploading');
    }

    private function isRegularFile(int $mode): bool
    {
        return ($mode & 0170000) === 0100000;
    }
}
