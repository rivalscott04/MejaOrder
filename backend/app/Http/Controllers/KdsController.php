<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\Order\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KdsController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('currentTenant');

        $orders = Order::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('order_status', ['pending', 'accepted', 'preparing', 'ready'])
            ->with(['items.options', 'table'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Filter out orders where all items are served/completed if we want to hide them
        // But the query above already filters by order_status.
        // If order_status is 'completed', it won't show up.

        return response()->json([
            'data' => $orders,
        ]);
    }

    public function updateStatus(Request $request, Order $order, OrderStatusService $service)
    {
        $request->validate([
            'kitchen_status' => 'required|in:pending,preparing,ready,served',
            'order_item_id' => 'nullable|exists:order_items,id',
        ]);

        DB::transaction(function () use ($request, $order, $service) {
            $service->updateKitchenStatus(
                $order, 
                $request->kitchen_status, 
                $request->order_item_id,
                $request->user()
            );
        });

        return response()->json([
            'message' => 'Status updated',
            'order' => $order->fresh(['items']),
        ]);
    }
}
