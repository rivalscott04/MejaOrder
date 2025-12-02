<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Get platform maintenance mode settings.
     */
    public function getMaintenanceMode(): JsonResponse
    {
        $maintenanceMode = Cache::get('platform_maintenance_mode', [
            'is_enabled' => false,
            'message' => null,
            'estimated_completion_at' => null,
        ]);

        return response()->json($maintenanceMode);
    }

    /**
     * Update platform maintenance mode settings.
     */
    public function updateMaintenanceMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'message' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'estimated_completion_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $current = Cache::get('platform_maintenance_mode', [
            'is_enabled' => false,
            'message' => null,
            'estimated_completion_at' => null,
        ]);

        $updated = array_merge($current, $validated);
        Cache::forever('platform_maintenance_mode', $updated);

        return response()->json($updated);
    }
}














