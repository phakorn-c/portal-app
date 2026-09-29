<?php

namespace App\Support\Procurement\PortalImport;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Support\Procurement\AttachmentStorage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

final class RowPersistence
{
    public function import(array $row, string $importPath): bool
    {
        $lock = Cache::lock(AttachmentStorage::LOCK_NAME, 120);

        if (! $lock->get()) {
            throw new RuntimeException('Attachment storage is busy. Try the import again.');
        }

        $storedKey = null;

        try {
            return DB::transaction(function () use ($row, $importPath, &$storedKey): bool {
                $exists = Announcement::query()
                    ->where('source_reference', $row['record_key'])
                    ->lockForUpdate()
                    ->exists();

                if ($exists) {
                    return false;
                }

                $sourcePath = $this->sourcePdfPath($importPath, $row['pdf_path']);
                $sha256 = hash_file('sha256', $sourcePath);
                $fileSize = filesize($sourcePath);

                if (! is_string($sha256) || ! is_int($fileSize)) {
                    throw new RuntimeException('Could not inspect the source PDF.');
                }

                if (AnnouncementAttachment::query()->where('sha256', $sha256)->exists()) {
                    throw new RuntimeException('The PDF content has already been imported.');
                }

                $storedKey = AttachmentStorage::MANAGED_ROOT.'/'.$sha256.'.pdf';
                $this->copyPdf($sourcePath, $storedKey);

                $announcement = Announcement::query()->create([
                    'title' => $row['title'],
                    'organization' => $row['organization'],
                    'category' => $row['category'],
                    'method' => $row['method'],
                    'budget' => $row['budget'],
                    'location' => $row['location'] ?? null,
                    'reference_price' => $row['reference_price'] ?? null,
                    'contact_name' => $row['contact_name'] ?? null,
                    'contact_phone' => $row['contact_phone'] ?? null,
                    'description' => $row['description'] ?? null,
                    'status' => $row['status'],
                    'publication_status' => 'draft',
                    'published_at' => null,
                    'deadline' => $row['deadline'],
                    'source_url' => $row['source_url'] ?? null,
                    'source_reference' => $row['record_key'],
                ]);

                $attachment = $announcement->attachments()->create([
                    'filename' => basename($sourcePath),
                    'stored_filename' => $storedKey,
                    'file_size' => $fileSize,
                    'mime_type' => 'application/pdf',
                    'sha256' => $sha256,
                    'document_kind' => 'unknown',
                ]);

                $attachment->extraction()->create([
                    'status' => 'review',
                    'method' => 'portal-ocr',
                    'candidate' => $this->candidate($row),
                    'confidence' => [],
                    'warnings' => $row['validation_flags'] ?? [],
                    'raw_text' => $row['raw_text'] ?? null,
                    'processed_at' => now(),
                ]);

                return true;
            });
        } catch (Throwable $exception) {
            if ($storedKey !== null) {
                Storage::disk('local')->delete($storedKey);
            }

            throw $exception;
        } finally {
            $lock->release();
        }
    }

    private function sourcePdfPath(string $importPath, string $pdfPath): string
    {
        $pathSegments = preg_split('/[\\\\\/]+/', $pdfPath);

        if (
            str_starts_with($pdfPath, '/')
            || preg_match('/^[A-Za-z]:[\\\\\/]/', $pdfPath) === 1
            || (is_array($pathSegments) && in_array('..', $pathSegments, true))
        ) {
            throw new RuntimeException('The pdf_path must be relative to portal_attachments.');
        }

        $root = realpath(dirname($importPath).'/portal_attachments');

        if ($root === false) {
            throw new RuntimeException('The portal_attachments directory is missing or unreadable.');
        }

        $candidatePath = $root.'/'.$pdfPath;

        if (! is_file($candidatePath) || ! is_readable($candidatePath)) {
            throw new RuntimeException('The source PDF is missing or unreadable.');
        }

        $sourcePath = realpath($candidatePath);

        if ($sourcePath === false || ! str_starts_with($sourcePath, $root.DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('The pdf_path must resolve inside portal_attachments.');
        }

        $stream = fopen($sourcePath, 'rb');
        $signature = $stream === false ? false : fread($stream, 5);

        if (is_resource($stream)) {
            fclose($stream);
        }

        if (strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION)) !== 'pdf' || $signature !== '%PDF-') {
            throw new RuntimeException('The source file must be a PDF.');
        }

        return $sourcePath;
    }

    private function copyPdf(string $sourcePath, string $storedKey): void
    {
        $stream = fopen($sourcePath, 'rb');

        if ($stream === false) {
            throw new RuntimeException('Could not open the source PDF.');
        }

        try {
            if (! Storage::disk('local')->writeStream($storedKey, $stream)) {
                throw new RuntimeException('Could not copy the source PDF into managed storage.');
            }
        } finally {
            fclose($stream);
        }
    }

    private function candidate(array $row): array
    {
        return collect([
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
        ])->mapWithKeys(fn (string $field): array => [$field => $row[$field] ?? null])->all();
    }
}
