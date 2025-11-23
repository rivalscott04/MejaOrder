<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreTenantUserRequest;
use App\Http\Requests\Tenant\UpdateTenantUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $tenant = tenant();

        $users = User::query()
            ->where('tenant_id', $tenant->id)
            ->when(request('role'), fn ($query, $role) => $query->where('role', $role))
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    public function store(StoreTenantUserRequest $request): JsonResponse
    {
        $tenant = tenant();

        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password', 'password123')),
            'role' => $request->validated('role'),
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function update(UpdateTenantUserRequest $request, User $user): JsonResponse
    {
        $this->authorizeUser($user);

        $user->fill($request->validated());
        if ($request->filled('password')) {
            $user->password = Hash::make($request->validated('password'));
        }
        $user->save();

        return response()->json($user);
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $this->authorizeUser($user);

        $user->is_active = ! $user->is_active;
        $user->save();

        return response()->json(['is_active' => $user->is_active]);
    }

    protected function authorizeUser(User $user): void
    {
        if ($user->tenant_id !== tenant()->id) {
            abort(403);
        }

        if ($user->role === 'super_admin') {
            abort(403);
        }
    }
}

