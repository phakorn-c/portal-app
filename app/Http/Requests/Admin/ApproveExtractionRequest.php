<?php

namespace App\Http\Requests\Admin;

use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Support\Procurement\Taxonomy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ApproveExtractionRequest extends FormRequest
{
    private const CANDIDATE_FIELDS = [
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
    ];

    public function authorize(): bool
    {
        $announcement = $this->route('announcement');
        $extraction = $this->route('extraction');

        if ($announcement instanceof Announcement && $extraction instanceof DocumentExtraction) {
            abort_unless(
                $extraction->attachment()->where('announcement_id', $announcement->id)->exists(),
                404,
            );
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('organization')) {
            $this->merge([
                'organization' => preg_replace('/\s+/', ' ', trim($this->input('organization'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => ['required', 'numeric', 'min:0'],
            'location' => ['present', 'nullable', 'string', 'max:255'],
            'reference_price' => ['present', 'nullable', 'numeric', 'min:0'],
            'contact_name' => ['present', 'nullable', 'string', 'max:255'],
            'contact_phone' => ['present', 'nullable', 'string', 'max:255'],
            'description' => ['present', 'nullable', 'string'],
            'deadline' => ['required', 'date'],
            'status' => ['required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $unknown = array_diff(array_keys($this->all()), self::CANDIDATE_FIELDS);

            if ($unknown !== []) {
                $validator->errors()->add('payload', 'The approval payload contains forbidden fields.');
            }
        });
    }
}
