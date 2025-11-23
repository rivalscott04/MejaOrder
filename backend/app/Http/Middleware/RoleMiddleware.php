<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Ensure the authenticated user has one of the required roles.
     *
     * Usage: ->middleware('role:tenant_admin,cashier')
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (! $user || ! $user->is_active) {
            abort(401, 'Unauthenticated.');
        }

        $allowedRoles = collect($roles)
            ->flatMap(fn (string $roleSet) => preg_split('/[,|]/', $roleSet))
            ->filter()
            ->map(fn ($role) => trim($role))
            ->values()
            ->all();

        if (empty($allowedRoles) || ! in_array($user->role, $allowedRoles, true)) {
            abort(403, 'Unauthorized role.');
        }

        return $next($request);
    }
}

