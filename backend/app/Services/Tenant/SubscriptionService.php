<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Support\Carbon;

class SubscriptionService
{
    /**
     * Get current active subscription for a tenant.
     */
    public function current(Tenant $tenant): ?TenantSubscription
    {
        return TenantSubscription::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->with('plan')
            ->latest('end_date')
            ->first();
    }

    /**
     * Renew or create a subscription window.
     */
    public function renew(
        Tenant $tenant,
        int $planId,
        Carbon $startDate,
        Carbon $endDate,
        bool $autoRenew = false,
        string $status = 'active'
    ): TenantSubscription {
        return TenantSubscription::query()->create([
            'tenant_id' => $tenant->id,
            'plan_id' => $planId,
            'status' => $status,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_auto_renew' => $autoRenew,
        ]);
    }

    /**
     * Cancel active subscription for a tenant.
     * Sets status to 'canceled' and disables auto-renew.
     */
    public function cancel(Tenant $tenant): ?TenantSubscription
    {
        $activeSubscription = $this->current($tenant);
        
        if (!$activeSubscription) {
            // Try to find any active subscription (including trial)
            $activeSubscription = TenantSubscription::query()
                ->where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'trial'])
                ->whereDate('end_date', '>=', now()->toDateString())
                ->latest('end_date')
                ->first();
        }

        if (!$activeSubscription) {
            return null;
        }

        $activeSubscription->update([
            'status' => 'canceled',
            'is_auto_renew' => false,
        ]);

        return $activeSubscription->fresh();
    }
}

