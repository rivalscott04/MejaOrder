<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Check if tenant is in maintenance mode and return maintenance info if enabled.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $tenant = app('currentTenant');

        if (!$tenant) {
            return $next($request);
        }

        $maintenanceMode = $tenant->maintenance_mode ?? [
            'is_enabled' => false,
            'message' => null,
            'image_url' => null,
            'estimated_completion_at' => null,
        ];

        if (isset($maintenanceMode['is_enabled']) && $maintenanceMode['is_enabled'] === true) {
            return response()->json([
                'maintenance_mode' => true,
                'message' => $maintenanceMode['message'] ?? 'Sistem sedang dalam pemeliharaan. Mohon maaf atas ketidaknyamanannya.',
                'image_url' => $maintenanceMode['image_url'] ?? null,
                'estimated_completion_at' => $maintenanceMode['estimated_completion_at'] ?? null,
            ], 503);
        }

        return $next($request);
    }
}

