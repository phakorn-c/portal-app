<?php

namespace App\Http\Requests\User;

use App\Support\Procurement\FilterState;
use Illuminate\Foundation\Http\FormRequest;

class StoreSavedSearchRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            ...FilterState::validationRules('criteria'),
        ];
    }
}
