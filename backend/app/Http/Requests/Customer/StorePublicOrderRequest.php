<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePublicOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'qr_token' => ['required', 'string', 'max:150'],
            'customer_name' => ['nullable', 'string', 'max:150'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', Rule::in(['cash', 'transfer', 'qris'])],
            'bank_choice' => ['nullable', 'string', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'integer', 'exists:menus,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.item_note' => ['nullable', 'string', 'max:500'],
            'items.*.option_item_ids' => ['nullable', 'array'],
            'items.*.option_item_ids.*' => ['integer', 'exists:option_items,id'],
        ];
    }

    /**
     * Prepare the data for validation.
     * Set default payment_method to 'cash' if not provided.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('payment_method') || $this->payment_method === null) {
            $this->merge([
                'payment_method' => 'cash',
            ]);
        }
    }
}

