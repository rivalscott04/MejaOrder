<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TenantContext
{
    /**
     * Resolve the current tenant either from route parameters or the authenticated user.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $tenant = null;

        if ($request->route()?->hasParameter('tenant_slug')) {
            $tenantSlug = (string) $request->route('tenant_slug');

            /** @var Tenant|null $tenant */
            $tenant = Tenant::query()
                ->where('slug', $tenantSlug)
                ->where('is_active', true)
                ->first();

            if (! $tenant) {
                throw new NotFoundHttpException('Tenant not found or inactive.');
            }
        } elseif ($request->user() && $request->user()->tenant_id) {
            $tenant = $request->user()->tenant;

            if (! $tenant?->is_active) {
                abort(403, 'Tenant inactive.');
            }
        }

        app()->instance('currentTenant', $tenant);

        return $next($request);
    }
}

