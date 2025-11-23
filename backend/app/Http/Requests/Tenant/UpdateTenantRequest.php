<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'logo_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'tax_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'payment_settings' => ['sometimes', 'nullable', 'array'],
            'payment_settings.banks' => ['sometimes', 'array'],
            'payment_settings.banks.*.bank' => ['required_with:payment_settings.banks', 'string', 'max:100'],
            'payment_settings.banks.*.account_number' => ['required_with:payment_settings.banks', 'string', 'max:50'],
            'payment_settings.banks.*.account_name' => ['required_with:payment_settings.banks', 'string', 'max:150'],
            'payment_settings.qris_image' => ['sometimes', 'nullable', 'string', 'max:255'],
            'maintenance_mode' => ['sometimes', 'nullable', 'array'],
            'maintenance_mode.is_enabled' => ['sometimes', 'boolean'],
            'maintenance_mode.message' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'maintenance_mode.image_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'maintenance_mode.estimated_completion_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}

