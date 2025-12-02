<?php

namespace App\Http\Controllers\Customer;

use App\Events\OrderCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StorePublicOrderRequest;
use App\Models\Order;
use App\Models\Table;
use App\Models\Tenant;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
    ) {
    }

    public function store(StorePublicOrderRequest $request): JsonResponse
    {
        $tenant = $this->currentTenant();
        $table = $this->resolveTable($tenant, (string) $request->validated('qr_token'));

        $order = $this->orderService->createFromPublicPayload($tenant, $table, $request->validated());

        OrderCreated::dispatch($order);

        return response()->json($this->formatOrder($order), 201);
    }

    public function show(string $tenant_slug, string $order_code): JsonResponse
    {
        $tenant = $this->currentTenant();

        $order = Order::query()
            ->where('tenant_id', $tenant->id)
            ->where('order_code', $order_code)
            ->with(['items.options'])
            ->firstOrFail();

        return response()->json($this->formatOrder($order));
    }

    protected function resolveTable(Tenant $tenant, string $qrToken): Table
    {
        return Table::query()
            ->where('tenant_id', $tenant->id)
            ->where('qr_token', $qrToken)
            ->where('is_active', true)
            ->firstOrFail();
    }

    protected function currentTenant(): Tenant
    {
        $tenant = tenant();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        return $tenant;
    }

    protected function formatOrder(Order $order): array
    {
        $order->loadMissing('items.options');

        return [
            'order_code' => $order->order_code,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'order_status' => $order->order_status,
            'total_amount' => (float) $order->total_amount,
            'customer_note' => $order->customer_note,
            'items' => $order->items->map(function ($item) {
                return [
                    'menu_id' => $item->menu_id,
                    'menu_name' => $item->menu_name_snapshot,
                    'qty' => $item->qty,
                    'subtotal' => (float) $item->subtotal,
                    'note' => $item->item_note,
                    'options' => $item->options->map(fn ($option) => [
                        'group' => $option->option_group_name_snapshot,
                        'label' => $option->option_item_label_snapshot,
                        'extra_price' => (float) $option->extra_price_snapshot,
                    ]),
                ];
            }),
        ];
    }
}

