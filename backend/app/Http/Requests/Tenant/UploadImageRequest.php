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
                function ($attribute, $value, $fail) {
                    if (!$value || !$value->isValid()) {
                        $fail('File tidak valid.');
                        return;
                    }

                    // Validate MIME type (magic bytes check)
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                    $fileMime = $value->getMimeType();
                    
                    if (!in_array($fileMime, $allowedMimes)) {
                        $fail('Format file tidak valid. Hanya JPG, PNG, dan WEBP yang diizinkan.');
                        return;
                    }

                    // Additional check: verify file extension matches MIME type
                    $extension = strtolower($value->getClientOriginalExtension());
                    $extensionMimeMap = [
                        'jpg' => 'image/jpeg',
                        'jpeg' => 'image/jpeg',
                        'png' => 'image/png',
                        'webp' => 'image/webp',
                    ];

                    if (!isset($extensionMimeMap[$extension]) || 
                        $extensionMimeMap[$extension] !== $fileMime) {
                        $fail('Ekstensi file tidak sesuai dengan tipe file.');
                    }
                },
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

