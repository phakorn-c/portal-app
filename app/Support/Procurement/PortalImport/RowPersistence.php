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
    public function import(array $row, string $importPath, ?string $pdfDirectory = null): bool
    {
        $lock = Cache::lock(AttachmentStorage::LOCK_NAME, 120);

        if (! $lock->get()) {
            throw new RuntimeException('Attachment storage is busy. Try the import again.');
        }

        $storedKey = null;

        try {
            return DB::transaction(function () use ($row, $importPath, $pdfDirectory, &$storedKey): bool {
                $raw = isset($row['_ocr_source']);

                if (! $raw && Announcement::query()->where('source_reference', $row['record_key'])->lockForUpdate()->exists()) {
                    return false;
                }

                $sourcePath = $this->sourceDocumentPath($importPath, $row['pdf_path'], $raw, $pdfDirectory);
                $sha256 = hash_file('sha256', $sourcePath);
                $fileSize = filesize($sourcePath);

                if (! is_string($sha256) || ! is_int($fileSize)) {
                    throw new RuntimeException('Could not inspect the source PDF.');
                }

                $documentKey = $raw
                    ? hash('sha256', $row['source_id']."\0".($row['source_url']
                        ? $row['source_url']."\0".$row['pdf_path']
                        : 'pdf:'.$sha256))
                    : null;

                if ($documentKey !== null) {
                    $existing = Announcement::query()->where('source_document_key', $documentKey)->lockForUpdate()->first();
                    if ($existing !== null) {
                        if ($existing->attachments()->where('sha256', $sha256)->exists()) {
                            return false;
                        }

                        throw new RuntimeException('The source document changed PDF content after import.');
                    }
                } elseif (AnnouncementAttachment::query()->where('sha256', $sha256)->exists()) {
                    throw new RuntimeException('The PDF content has already been imported.');
                }

                $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
                $storedKey = AttachmentStorage::MANAGED_ROOT.'/'.($documentKey ?? $sha256).'.'.$extension;
                $this->copyDocument($sourcePath, $storedKey);

                $attributes = [
                    'title' => $row['title'],
                    'organization' => $row['organization'],
                    'category' => $row['category'],
                    'method' => $row['method'],
                    'budget' => $row['budget'] ?? null,
                    'location' => $row['location'] ?? null,
                    'reference_price' => $row['reference_price'] ?? null,
                    'contact_name' => $row['contact_name'] ?? null,
                    'contact_phone' => $row['contact_phone'] ?? null,
                    'description' => $row['description'] ?? null,
                    'status' => $row['status'] ?? null,
                    'publication_status' => 'draft',
                    'published_at' => null,
                    'deadline' => $row['deadline'] ?? null,
                    'source_url' => $row['source_url'] ?? null,
                    'source_reference' => $row['record_key'],
                    'source_document_key' => $documentKey,
                ];

                if ($raw) {
                    $attributes += collect([
                        'project_key', 'project_no', 'notice_type', 'procurement_category',
                        'tags', 'display_price', 'display_price_source', 'province',
                        'district', 'subdistrict', 'location_source', 'contact_website',
                        'announcer_name', 'announcer_position', 'winner_name',
                        'winning_price', 'bidders', 'announced_at',
                        'submission_deadline', 'award_announced_at',
                        'process_status', 'source_id',
                    ])->mapWithKeys(fn (string $field): array => [$field => $row[$field] ?? null])->all();
                }

                $announcement = Announcement::query()->create($attributes);

                $attachment = $announcement->attachments()->create([
                    'filename' => basename($sourcePath),
                    'stored_filename' => $storedKey,
                    'file_size' => $fileSize,
                    'mime_type' => $extension === 'pdf' ? 'application/pdf' : 'image/jpeg',
                    'sha256' => $sha256,
                    'document_kind' => 'unknown',
                ]);

                $attachment->extraction()->create([
                    'status' => 'review',
                    'method' => 'portal-ocr',
                    'candidate' => $raw
                        ? array_diff_key($row, ['_ocr_source' => true]) + ['source_values' => $row['_ocr_source']]
                        : $this->candidate($row),
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

    private function sourceDocumentPath(string $importPath, string $pdfPath, bool $raw, ?string $pdfDirectory): string
    {
        $pathSegments = preg_split('/[\\\\\/]+/', $pdfPath);

        if (
            str_starts_with($pdfPath, '/')
            || preg_match('/^[A-Za-z]:[\\\\\/]/', $pdfPath) === 1
            || (is_array($pathSegments) && in_array('..', $pathSegments, true))
        ) {
            throw new RuntimeException('The pdf_path must be relative to portal_attachments.');
        }

        $root = realpath($raw
            ? ($pdfDirectory ?? dirname($importPath).'/../data/pdfs')
            : dirname($importPath).'/portal_attachments');

        if ($root === false) {
            throw new RuntimeException('The source PDF directory is missing or unreadable.');
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

        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
        if (
            ! ($extension === 'pdf' && $signature === '%PDF-')
            && ! ($raw && in_array($extension, ['jpg', 'jpeg'], true)
                && is_string($signature) && str_starts_with($signature, "\xFF\xD8\xFF"))
        ) {
            throw new RuntimeException($raw ? 'The source file must be a PDF or JPEG image.' : 'The source file must be a PDF.');
        }

        return $sourcePath;
    }

    private function copyDocument(string $sourcePath, string $storedKey): void
    {
        $stream = fopen($sourcePath, 'rb');

        if ($stream === false) {
            throw new RuntimeException('Could not open the source document.');
        }

        try {
            if (! Storage::disk('local')->writeStream($storedKey, $stream)) {
                throw new RuntimeException('Could not copy the source document into managed storage.');
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
