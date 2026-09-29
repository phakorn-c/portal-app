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

    public function validate(array $row): ValidatorContract
    {
        return Validator::make($row, $this->rules(), $this->messages());
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
