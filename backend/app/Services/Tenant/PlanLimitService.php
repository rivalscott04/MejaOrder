<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Http\JsonResponse;

class PlanLimitService
{
    /**
     * Get current active subscription for tenant.
     */
    protected function getActiveSubscription(Tenant $tenant): ?TenantSubscription
    {
        return TenantSubscription::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['active', 'trial'])
            ->whereDate('end_date', '>=', now()->toDateString())
            ->with('plan')
            ->latest('end_date')
            ->first();
    }

    /**
     * Check if tenant can create more menus.
     * Returns null if allowed, or error response if limit reached.
     */
    public function checkMenuLimit(Tenant $tenant): ?JsonResponse
    {
        $subscription = $this->getActiveSubscription($tenant);
        
        if (!$subscription || !$subscription->plan) {
            return response()->json([
                'message' => 'Anda tidak memiliki subscription aktif.',
                'error_code' => 'NO_SUBSCRIPTION',
            ], 402);
        }

        $plan = $subscription->plan;
        
        // If max_menus is null, unlimited
        if ($plan->max_menus === null) {
            return null;
        }

        $currentMenuCount = $tenant->menus()->count();
        
        if ($currentMenuCount >= $plan->max_menus) {
            return response()->json([
                'message' => "Maksimal jumlah menu ({$plan->max_menus}) sudah tercapai. Silakan upgrade paket untuk menambahkan menu lebih banyak.",
                'error_code' => 'MENU_LIMIT_REACHED',
                'limit_type' => 'max_menus',
                'current_count' => $currentMenuCount,
                'max_limit' => $plan->max_menus,
                'plan_name' => $plan->name,
            ], 403);
        }

        return null;
    }

    /**
     * Check if tenant can create more users.
     * Returns null if allowed, or error response if limit reached.
     */
    public function checkUserLimit(Tenant $tenant): ?JsonResponse
    {
        $subscription = $this->getActiveSubscription($tenant);
        
        if (!$subscription || !$subscription->plan) {
            return response()->json([
                'message' => 'Anda tidak memiliki subscription aktif.',
                'error_code' => 'NO_SUBSCRIPTION',
            ], 402);
        }

        $plan = $subscription->plan;
        
        // If max_users is null, unlimited
        if ($plan->max_users === null) {
            return null;
        }

        $currentUserCount = $tenant->users()->count();
        
        if ($currentUserCount >= $plan->max_users) {
            return response()->json([
                'message' => "Maksimal jumlah user ({$plan->max_users}) sudah tercapai. Silakan upgrade paket untuk menambahkan user lebih banyak.",
                'error_code' => 'USER_LIMIT_REACHED',
                'limit_type' => 'max_users',
                'current_count' => $currentUserCount,
                'max_limit' => $plan->max_users,
                'plan_name' => $plan->name,
            ], 403);
        }

        return null;
    }

    /**
     * Get current usage statistics for tenant's plan.
     */
    public function getUsageStats(Tenant $tenant): array
    {
        $subscription = $this->getActiveSubscription($tenant);
        
        if (!$subscription || !$subscription->plan) {
            return [
                'has_subscription' => false,
            ];
        }

        $plan = $subscription->plan;
        
        // Get allowed report tabs, default to all if null
        $allowedTabs = $plan->allowed_report_tabs;
        if ($allowedTabs === null) {
            // If null, allow all tabs (backward compatibility)
            $allowedTabs = ['financial', 'sales', 'operational', 'analytics', 'accounting'];
        }
        
        return [
            'has_subscription' => true,
            'plan_name' => $plan->name,
            'menus' => [
                'current' => $tenant->menus()->count(),
                'max' => $plan->max_menus,
                'is_unlimited' => $plan->max_menus === null,
                'percentage' => $plan->max_menus ? min(100, ($tenant->menus()->count() / $plan->max_menus) * 100) : 0,
            ],
            'users' => [
                'current' => $tenant->users()->count(),
                'max' => $plan->max_users,
                'is_unlimited' => $plan->max_users === null,
                'percentage' => $plan->max_users ? min(100, ($tenant->users()->count() / $plan->max_users) * 100) : 0,
            ],
            'allowed_report_tabs' => $allowedTabs,
        ];
    }
}

