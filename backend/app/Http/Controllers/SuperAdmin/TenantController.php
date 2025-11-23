<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Models\Tenant;
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
}

