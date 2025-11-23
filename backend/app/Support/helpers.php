<?php

use App\Models\Tenant;
use App\Models\TenantSubscription;

if (! function_exists('tenant')) {
    /**
     * Helper to access the current tenant resolved by TenantContext middleware.
     */
    function tenant(): ?Tenant
    {
        return app()->bound('currentTenant') ? app('currentTenant') : null;
    }
}

if (! function_exists('tenant_subscription')) {
    /**
     * Helper to access the current tenant subscription (if resolved).
     */
    function tenant_subscription(): ?TenantSubscription
    {
        return app()->bound('currentTenantSubscription')
            ? app('currentTenantSubscription')
            : null;
    }
}

