<?php

namespace App\Console\Commands;

use App\Support\Procurement\PortalImport\RowPersistence;
use App\Support\Procurement\PortalImport\RowValidation;
use Illuminate\Console\Command;
use JsonException;
use Throwable;

final class ImportPortalAnnouncements extends Command
{
    protected $signature = 'portal:import {path : Path to output.json or portal_import.json} {--pdf-dir= : Directory containing raw OCR PDFs}';

    protected $description = 'Validate OCR records and import announcements as reviewable drafts';

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

        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents);

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
        $rowValidation = new RowValidation;
        $rowPersistence = new RowPersistence;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 1;

            if (! is_array($row)) {
                $this->error("Row {$rowNumber}: The row must be a JSON object.");
                $errors++;

                continue;
            }

            $row = $rowValidation->normalize($row);
            $validator = $rowValidation->validate($row);

            if ($validator->fails()) {
                $this->error("Row {$rowNumber}: ".implode(' ', $validator->errors()->all()));
                $errors++;

                continue;
            }

            try {
                $created = $rowPersistence->import($row, $path, $this->option('pdf-dir'));
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

    private function failImport(string $message): int
    {
        $this->error('Import failed: '.$message);
        $this->info('Import complete: imported=0 skipped=0 errors=1');

        return self::FAILURE;
    }
}
