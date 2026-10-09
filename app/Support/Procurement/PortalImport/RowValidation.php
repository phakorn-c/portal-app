<?php

namespace App\Support\Procurement\PortalImport;

use App\Support\Procurement\Taxonomy;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

final class RowValidation
{
    public function normalize(array $row): array
    {
        if (array_key_exists('agency', $row)) {
            $source = $row;
            $category = match ($row['procurement_category'] ?? null) {
                'works' => 'construction',
                'supply' => 'goods',
                'service' => 'services',
                'consulting' => 'consulting',
                default => 'other',
            };

            foreach (['announced_at', 'submission_deadline', 'award_announced_at'] as $field) {
                $row[$field] = $this->gregorianDate($row[$field] ?? null);

                if (is_string($row[$field]) && preg_match('/^(\d{4})-\d{2}-\d{2}$/', $row[$field], $parts)
                    && ((int) $parts[1] < 2000 || (int) $parts[1] > now()->year + 10)
                    && is_array($row['validation_flags'] ?? [])) {
                    $row['validation_flags'][] = "implausible_date:{$field}";
                }
            }

            $deadline = $row['submission_deadline'];
            $row['organization'] = trim((string) ($row['agency'] ?? ''));
            $row['category'] = $category;
            $row['method'] = trim((string) ($row['method'] ?? ''));
            $row['location'] = implode(' ', array_filter([
                $row['subdistrict'] ?? null,
                $row['district'] ?? null,
                $row['province'] ?? null,
            ], static fn ($part): bool => is_string($part) && trim($part) !== '')) ?: null;
            $row['description'] = null;
            $row['contact_phone'] = null;
            $row['deadline'] = $deadline;
            $row['status'] = $deadline === null ? null : (
                $deadline < now()->toDateString() ? 'closed' : (
                    $deadline <= now()->addDays(7)->toDateString() ? 'closing' : 'open'
                )
            );
            $row['_ocr_source'] = $source;
        }

        foreach (['title', 'organization', 'record_key'] as $field) {
            if (isset($row[$field]) && is_string($row[$field])) {
                $row[$field] = trim($row[$field]);
            }
        }

        if (isset($row['organization']) && is_string($row['organization'])) {
            $row['organization'] = preg_replace('/\s+/u', ' ', $row['organization']);
        }

        foreach (['location', 'reference_price', 'contact_name', 'contact_phone', 'description', 'source_url', 'project_key', 'project_no', 'display_price', 'winner_name', 'winning_price'] as $field) {
            if (isset($row[$field]) && is_string($row[$field]) && trim($row[$field]) === '') {
                $row[$field] = null;
            }
        }

        return $row;
    }

    private function gregorianDate(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_string($value) || ! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts)) {
            return $value;
        }

        $year = (int) $parts[1];
        $year = $year > 2400 ? $year - 543 : $year;

        return sprintf('%04d-%s-%s', $year, $parts[2], $parts[3]);
    }

    public function validate(array $row): ValidatorContract
    {
        return Validator::make($row, $this->rules(isset($row['_ocr_source'])), $this->messages());
    }

    private function rules(bool $raw): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => $raw ? ['required', 'string', 'max:255'] : ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => $raw ? ['required', 'string', 'max:255'] : ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => [$raw ? 'nullable' : 'required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'location' => ['nullable', 'string', 'max:255'],
            'reference_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => [$raw ? 'nullable' : 'required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
            'deadline' => [$raw ? 'nullable' : 'required', 'date_format:Y-m-d'],
            'pdf_path' => ['required', 'string', 'max:2048'],
            'source_url' => ['nullable', 'url:http,https', 'max:2048'],
            'record_key' => ['required', 'string', 'max:255'],
            'validation_flags' => ['sometimes', 'array', 'list'],
            'validation_flags.*' => ['string'],
            'raw_text' => ['nullable', 'string'],
            'source_id' => $raw ? ['required', 'string', 'max:255'] : ['sometimes', 'nullable', 'string'],
            'notice_type' => ['sometimes', 'nullable', Rule::in(['invitation', 'award'])],
            'procurement_category' => ['sometimes', 'nullable', Rule::in(['works', 'supply', 'service', 'consulting', 'other'])],
            'tags' => ['sometimes', 'array', 'list'],
            'tags.*' => ['string'],
            'bidders' => ['sometimes', 'array', 'list'],
            'bidders.*' => ['array'],
            'display_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'winning_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'announced_at' => ['nullable', 'date_format:Y-m-d'],
            'submission_deadline' => ['nullable', 'date_format:Y-m-d'],
            'award_announced_at' => ['nullable', 'date_format:Y-m-d'],
            'contact_website' => ['nullable', 'url:http,https', 'max:2048'],
        ];
    }

    private function messages(): array
    {
        return [
            'budget.required' => 'The budget field is required; the importer does not generate a fallback for this NOT NULL field.',
            'budget.numeric' => 'The budget field must be an explicitly extracted number; the importer does not generate a fallback.',
            'deadline.required' => 'The deadline field is required; the importer does not generate a fallback for this NOT NULL field.',
            'deadline.date_format' => 'The deadline field must be an explicitly extracted date in YYYY-MM-DD format; the importer does not generate a fallback.',
        ];
    }
}
