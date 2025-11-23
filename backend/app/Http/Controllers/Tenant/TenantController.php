<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantRequest;
use App\Models\Plan;
use App\Services\Tenant\SubscriptionService;
use App\Services\Tenant\PlanLimitService;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    public function __construct(
        protected PlanLimitService $planLimitService
    ) {}

    public function show(): JsonResponse
    {
        $tenant = tenant();
        $subscriptionService = new SubscriptionService();
        $currentSubscription = $subscriptionService->current($tenant);

        $subscriptionInfo = null;
        if ($currentSubscription) {
            // Load plan relationship if not already loaded
            if (!$currentSubscription->relationLoaded('plan')) {
                $currentSubscription->load('plan');
            }
            $subscriptionInfo = [
                'plan' => $currentSubscription->plan->name ?? '-',
                'status' => ucfirst($currentSubscription->status),
                'expires_at' => $currentSubscription->end_date->format('Y-m-d'),
            ];
        }

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
            'maintenance_mode' => $tenant->maintenance_mode ?? [
                'is_enabled' => false,
                'message' => null,
                'image_url' => null,
                'estimated_completion_at' => null,
            ],
            'is_active' => $tenant->is_active,
            'subscription' => $subscriptionInfo,
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

        // Handle maintenance_mode separately to merge with existing
        if (isset($data['maintenance_mode'])) {
            $currentMaintenance = $tenant->maintenance_mode ?? [
                'is_enabled' => false,
                'message' => null,
                'image_url' => null,
                'estimated_completion_at' => null,
            ];
            $data['maintenance_mode'] = array_merge($currentMaintenance, $data['maintenance_mode']);
        }

        $tenant->update($data);

        $subscriptionService = new SubscriptionService();
        $currentSubscription = $subscriptionService->current($tenant);

        $subscriptionInfo = null;
        if ($currentSubscription) {
            $subscriptionInfo = [
                'plan' => $currentSubscription->plan->name ?? '-',
                'status' => ucfirst($currentSubscription->status),
                'expires_at' => $currentSubscription->end_date->format('Y-m-d'),
            ];
        }

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
            'maintenance_mode' => $tenant->maintenance_mode ?? [
                'is_enabled' => false,
                'message' => null,
                'image_url' => null,
                'estimated_completion_at' => null,
            ],
            'is_active' => $tenant->is_active,
            'subscription' => $subscriptionInfo,
        ]);
    }

    /**
     * Get available plans for tenant to view.
     */
    public function plans(): JsonResponse
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->latest()
            ->paginate(20);

        return response()->json($plans);
    }

    /**
     * Get current plan usage statistics.
     */
    public function usageStats(): JsonResponse
    {
        $tenant = tenant();
        $stats = $this->planLimitService->getUsageStats($tenant);

        return response()->json($stats);
    }
}

