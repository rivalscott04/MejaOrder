<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadPaymentProofRequest extends FormRequest
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
            'proof' => ['required', 'file', 'mimes:jpeg,png,webp,pdf', 'max:2048'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'method' => ['nullable', Rule::in(['cash', 'transfer', 'qris'])],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'account_number' => ['nullable', 'string', 'max:150'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}

