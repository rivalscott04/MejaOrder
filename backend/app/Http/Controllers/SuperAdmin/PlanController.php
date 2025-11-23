<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StorePlanRequest;
use App\Http\Requests\SuperAdmin\UpdatePlanRequest;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $plans = Plan::query()
            ->latest()
            ->paginate(20);

        return response()->json($plans);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = Plan::query()->create($request->validated());

        return response()->json($plan, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Plan $plan): JsonResponse
    {
        return response()->json($plan);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePlanRequest $request, Plan $plan): JsonResponse
    {
        $plan->update($request->validated());

        return response()->json($plan);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Plan $plan): JsonResponse
    {
        // Check if plan has active subscriptions
        if ($plan->subscriptions()->where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'Cannot delete plan with active subscriptions'
            ], 422);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan deleted successfully']);
    }
}
