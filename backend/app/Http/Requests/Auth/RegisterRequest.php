<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_name' => ['required', 'string', 'max:150'],
            'tenant_slug' => ['required', 'string', 'max:150', 'regex:/^[a-z0-9-]+$/', 'unique:tenants,slug'],
            'admin_name' => ['required', 'string', 'max:150'],
            'admin_email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_slug.regex' => 'Slug hanya boleh mengandung huruf kecil, angka, dan tanda hubung.',
            'tenant_slug.unique' => 'Slug tenant sudah digunakan. Silakan pilih slug lain.',
            'admin_email.unique' => 'Email sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }
}

