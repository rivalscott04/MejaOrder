<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            Log::warning('Unauthorized role access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'required_roles' => $allowedRoles,
                'route' => $request->path(),
                'ip' => $request->ip(),
            ]);
            abort(403, 'Unauthorized role.');
        }

        return $next($request);
    }
}

