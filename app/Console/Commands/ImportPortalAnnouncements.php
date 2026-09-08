<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Support\Procurement\AttachmentStorage;
use App\Support\Procurement\Taxonomy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use JsonException;
use RuntimeException;
use Throwable;

final class ImportPortalAnnouncements extends Command
{
    protected $signature = 'portal:import {path : Explicit path to portal_import.json}';

    protected $description = 'Validate portal-ocr JSON and import announcements as drafts';

    public function handle(): int
    {
        $path = (string) $this->argument('path');

        if (! is_file($path) || ! is_readable($path)) {
            return $this->failImport("file not found or unreadable: {$path}");
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return $this->failImport("could not read file: {$path}");
        }

        try {
            $rows = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            return $this->failImport('invalid JSON: '.$exception->getMessage());
        }

        if (! is_array($rows) || ! array_is_list($rows)) {
            return $this->failImport('the JSON root must be an array of announcement rows.');
        }

        $imported = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 1;

            if (! is_array($row)) {
                $this->error("Row {$rowNumber}: The row must be a JSON object.");
                $errors++;

                continue;
            }

            $row = $this->normalize($row);
            $validator = Validator::make($row, $this->rules());

            if ($validator->fails()) {
                $this->error("Row {$rowNumber}: ".implode(' ', $validator->errors()->all()));
                $errors++;

                continue;
            }

            try {
                $created = $this->importRow($row, $path);
            } catch (Throwable $exception) {
                $this->error("Row {$rowNumber}: Database import failed: {$exception->getMessage()}");
                $errors++;

                continue;
            }

            $created ? $imported++ : $skipped++;
        }

        $this->info("Import complete: imported={$imported} skipped={$skipped} errors={$errors}");

        return $errors === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function importRow(array $row, string $importPath): bool
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

    private function failImport(string $message): int
    {
        $this->error('Import failed: '.$message);
        $this->info('Import complete: imported=0 skipped=0 errors=1');

        return self::FAILURE;
    }

    private function normalize(array $row): array
    {
        foreach (['title', 'organization', 'record_key'] as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = trim($row[$field]);
            }
        }

        if (isset($row['organization']) && is_string($row['organization'])) {
            $row['organization'] = preg_replace('/\s+/u', ' ', $row['organization']);
        }

        foreach (['location', 'reference_price', 'contact_name', 'contact_phone', 'description', 'source_url'] as $field) {
            if (isset($row[$field]) && is_string($row[$field]) && trim($row[$field]) === '') {
                $row[$field] = null;
            }
        }

        return $row;
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'location' => ['nullable', 'string', 'max:255'],
            'reference_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
            'deadline' => ['required', 'date_format:Y-m-d'],
            'pdf_path' => ['required', 'string', 'max:2048'],
            'source_url' => ['nullable', 'url:http,https', 'max:2048'],
            'record_key' => ['required', 'string', 'max:255'],
            'validation_flags' => ['sometimes', 'array', 'list'],
            'validation_flags.*' => ['string'],
            'raw_text' => ['nullable', 'string'],
        ];
    }
}
