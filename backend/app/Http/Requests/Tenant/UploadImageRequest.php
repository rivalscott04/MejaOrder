<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,webp',
                'max:350', // 350KB in kilobytes
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'Gambar harus diupload.',
            'image.file' => 'File harus berupa file yang valid.',
            'image.mimes' => 'Format gambar harus JPG, PNG, atau WEBP.',
            'image.max' => 'Ukuran gambar maksimal 350KB.',
        ];
    }
}

