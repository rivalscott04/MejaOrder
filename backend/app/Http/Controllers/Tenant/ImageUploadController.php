<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UploadImageRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadController extends Controller
{
    public function upload(UploadImageRequest $request): JsonResponse
    {
        $tenant = tenant();
        $file = $request->file('image');

        // Generate unique filename
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "tenants/{$tenant->id}/menus/{$filename}";

        // Store file in public disk
        $storedPath = $file->storeAs("tenants/{$tenant->id}/menus", $filename, 'public');

        // Get public URL
        $url = Storage::disk('public')->url($storedPath);

        return response()->json([
            'url' => $url,
            'path' => $storedPath,
            'image_url' => $url, // Alias for compatibility
        ]);
    }
}

