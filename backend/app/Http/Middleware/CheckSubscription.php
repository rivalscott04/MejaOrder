<?php

namespace App\Http\Middleware;

use App\Models\TenantSubscription;
use Closure;
use Illuminate\Http\Request;

class CheckSubscription
{
    /**
     * Verify that the current tenant has an active subscription.
     * Super admin bypasses this check.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        // Super admin bypasses subscription check
        $user = $request->user();
        if ($user && $user->role === 'super_admin') {
            return $next($request);
        }

        $tenant = app('currentTenant');

        if (! $tenant) {
            abort(403, 'No tenant context available.');
        }

        $activeSubscription = TenantSubscription::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['active', 'trial']) // Allow both active and trial subscriptions
            ->whereDate('end_date', '>=', now()->toDateString())
            ->first();

        if (! $activeSubscription) {
            abort(402, 'Subscription inactive or expired.');
        }

        app()->instance('currentTenantSubscription', $activeSubscription);

        return $next($request);
    }
}

