<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cashier\UpdateOrderPaymentStatusRequest;
use App\Http\Requests\Cashier\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\Order\OrderStatusService;
use App\Services\Order\PaymentService;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function __construct(
        protected OrderStatusService $statusService,
        protected PaymentService $paymentService,
    ) {
    }

    public function index(): JsonResponse
    {
        $tenant = tenant();

        $query = Order::query()
            ->where('tenant_id', $tenant->id)
            ->with(['table:id,table_number,description', 'items:id,order_id,menu_id,menu_name_snapshot,qty,subtotal'])
            ->when(request('order_status'), fn ($query, $status) => $query->where('order_status', $status))
            ->when(request('payment_status'), fn ($query, $status) => $query->where('payment_status', $status))
            ->when(request('date'), fn ($query, $date) => $query->whereDate('created_at', $date))
            ->when(request('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when(request('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest();

        // If all=true, return all results without pagination (useful for statistics)
        if (request('all') === 'true') {
            $orders = $query->get();
            $total = $orders->count();
            
            // Transform orders to include table.number instead of table.table_number
            $orders->transform(function ($order) {
                if ($order->table) {
                    $order->table->number = $order->table->table_number;
                }
                return $order;
            });

            // Return in pagination-like format for consistency
            return response()->json([
                'data' => $orders,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $total,
                'total' => $total,
            ]);
        }

        $orders = $query->paginate(20);

        // Transform orders to include table.number instead of table.table_number
        $orders->getCollection()->transform(function ($order) {
            if ($order->table) {
                $order->table->number = $order->table->table_number;
            }
            return $order;
        });

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorizeOrder($order);

        $order->load(['table:id,table_number,description', 'items.options', 'payments.verifier']);
        
        // Transform table to include number instead of table_number
        if ($order->table) {
            $order->table->number = $order->table->table_number;
        }

        return response()->json($order);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($order);

        $updated = $this->statusService->transition($order, $request->validated('order_status'), $request->user(), $request->validated('note'));

        return response()->json($updated);
    }

    public function updatePaymentStatus(UpdateOrderPaymentStatusRequest $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($order);

        // For cash payments, create payment record if it doesn't exist
        $payment = $order->payments()->latest()->first();
        
        if (!$payment && $order->payment_method === 'cash' && $request->validated('payment_status') === 'paid') {
            // Create payment record for cash payment
            $payment = $this->paymentService->submit($order, [
                'method' => 'cash',
                'amount' => $order->total_amount,
            ]);
        }

        if (!$payment) {
            abort(404, 'Payment record not found. Please ensure payment has been submitted first.');
        }

        if ($request->validated('payment_status') === 'paid') {
            $this->paymentService->markAsPaid($order, $payment, $request->user());
        }

        return response()->json([
            'payment_status' => $order->payment_status,
        ]);
    }

    public function markInvoicePrinted(Order $order): JsonResponse
    {
        $this->authorizeOrder($order);

        if (!$order->invoice_printed_at) {
            $order->update([
                'invoice_printed_at' => now(),
            ]);

            $order->logs()->create([
                'user_id' => auth()->id(),
                'from_status' => $order->order_status,
                'to_status' => $order->order_status,
                'note' => 'Invoice printed.',
            ]);
        }

        return response()->json([
            'invoice_printed_at' => $order->invoice_printed_at,
        ]);
    }

    protected function authorizeOrder(Order $order): void
    {
        if ($order->tenant_id !== tenant()->id) {
            abort(403);
        }
    }
}

