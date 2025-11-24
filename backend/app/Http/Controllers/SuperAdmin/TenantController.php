<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Services\Tenant\SubscriptionService;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::query()
            ->with('subscriptions.plan')
            ->latest()
            ->paginate(20);

        return response()->json($tenants);
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $tenant = Tenant::query()->create($request->validated());

        return response()->json($tenant, 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json($tenant->load(['subscriptions.plan']));
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): JsonResponse
    {
        $tenant->update($request->validated());

        return response()->json($tenant);
    }

    public function toggleStatus(Tenant $tenant): JsonResponse
    {
        $tenant->is_active = ! $tenant->is_active;
        $tenant->save();

        return response()->json(['is_active' => $tenant->is_active]);
    }

    public function getUsers(Tenant $tenant): JsonResponse
    {
        $users = User::query()
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        return response()->json(['data' => $users]);
    }

    public function createUser(Tenant $tenant, \Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:tenant_admin,cashier'],
        ]);

        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password'] ?? 'password123'),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Tenant $tenant, User $user, \Illuminate\Http\Request $request): JsonResponse
    {
        // Verify user belongs to tenant
        if ($user->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'User tidak ditemukan di tenant ini'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'email', 'max:150', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'in:tenant_admin,cashier'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->fill($validated);
        if (isset($validated['password'])) {
            $user->password = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }
        $user->save();

        return response()->json($user);
    }

    public function toggleUserStatus(Tenant $tenant, User $user): JsonResponse
    {
        // Verify user belongs to tenant
        if ($user->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'User tidak ditemukan di tenant ini'], 404);
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        return response()->json(['is_active' => $user->is_active]);
    }

    /**
     * Cancel subscription for a tenant (by subscription ID).
     */
    public function cancelSubscription(Tenant $tenant, TenantSubscription $subscription): JsonResponse
    {
        // Verify subscription belongs to tenant
        if ($subscription->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'Subscription tidak ditemukan untuk tenant ini'], 404);
        }

        // Check if subscription is already canceled
        if ($subscription->status === 'canceled') {
            return response()->json(['message' => 'Subscription sudah dibatalkan sebelumnya'], 400);
        }

        $subscriptionService = new SubscriptionService();
        $canceledSubscription = $subscriptionService->cancel($tenant);

        if (!$canceledSubscription) {
            return response()->json([
                'message' => 'Tidak ada subscription aktif yang dapat dibatalkan'
            ], 404);
        }

        return response()->json([
            'message' => 'Subscription berhasil dibatalkan',
            'subscription' => [
                'id' => $canceledSubscription->id,
                'status' => $canceledSubscription->status,
                'plan' => $canceledSubscription->plan->name ?? '-',
            ]
        ]);
    }
}

