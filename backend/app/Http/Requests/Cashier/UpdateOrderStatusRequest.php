<?php

namespace App\Http\Requests\Cashier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_status' => ['required', Rule::in(['pending', 'accepted', 'preparing', 'ready', 'completed', 'canceled'])],
            'note' => ['nullable', 'string', 'max:500'],
            'force' => ['nullable', 'boolean'],
        ];
    }
}

