<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantRequest;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = tenant();

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'logo_url' => $tenant->logo_url,
            'address' => $tenant->address,
            'phone' => $tenant->phone,
            'timezone' => $tenant->timezone,
            'tax_percentage' => (float) $tenant->tax_percentage,
            'payment_settings' => $tenant->payment_settings ?? [
                'banks' => [],
                'qris_image' => null,
            ],
            'is_active' => $tenant->is_active,
        ]);
    }

    public function update(UpdateTenantRequest $request): JsonResponse
    {
        $tenant = tenant();

        $data = $request->validated();
        
        // Handle payment_settings separately to merge with existing
        if (isset($data['payment_settings'])) {
            $currentSettings = $tenant->payment_settings ?? ['banks' => [], 'qris_image' => null];
            $data['payment_settings'] = array_merge($currentSettings, $data['payment_settings']);
        }

        $tenant->update($data);

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'logo_url' => $tenant->logo_url,
            'address' => $tenant->address,
            'phone' => $tenant->phone,
            'timezone' => $tenant->timezone,
            'tax_percentage' => (float) $tenant->tax_percentage,
            'payment_settings' => $tenant->payment_settings ?? [
                'banks' => [],
                'qris_image' => null,
            ],
            'is_active' => $tenant->is_active,
        ]);
    }
}

