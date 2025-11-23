<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'is_available' => ['boolean'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'sku' => ['nullable', 'string', 'max:50'],
            'option_group_ids' => ['nullable', 'array'],
            'option_group_ids.*' => ['integer', 'exists:option_groups,id'],
        ];
    }
}

