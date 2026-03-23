<?php

namespace App\Http\Requests\Admin;

use App\Support\Procurement\Taxonomy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnouncementRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'organization' => $this->has('organization')
                ? preg_replace('/\s+/', ' ', trim($this->input('organization')))
                : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => ['required', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'reference_price' => ['nullable', 'numeric', 'min:0'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
            'publication_status' => ['required', Rule::in(['draft', 'published', 'hidden'])],
            'deadline' => ['required', 'date'],
            'attachment' => ['nullable', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:20480'],
        ];
    }
}
