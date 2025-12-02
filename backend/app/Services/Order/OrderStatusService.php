<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    /**
     * Allowed transitions map.
     *
     * @var array<string, array<int, string>>
     */
    protected array $transitions = [
        'pending' => ['accepted', 'canceled'],
        'accepted' => ['preparing', 'canceled'],
        'preparing' => ['ready', 'canceled'],
        'ready' => ['completed'],
        'completed' => [],
        'canceled' => [],
    ];

    /**
     * Update order status with validation & logging.
     * 
     * @param bool $force If true, skip transition validation (allows skipping statuses)
     */
    public function transition(Order $order, string $toStatus, ?User $actor = null, ?string $note = null, bool $force = false): Order
    {
        $toStatus = strtolower($toStatus);
        $fromStatus = $order->order_status;

        // Only validate transitions if not forcing
        if (!$force) {
            if (! isset($this->transitions[$fromStatus]) || ! in_array($toStatus, $this->transitions[$fromStatus], true)) {
                throw ValidationException::withMessages([
                    'order_status' => "Cannot transition from {$fromStatus} to {$toStatus}.",
                ]);
            }
        }

        $order->forceFill(['order_status' => $toStatus])->save();

        $order->logs()->create([
            'user_id' => $actor?->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'note' => $note ?? ($force ? 'Status changed (forced)' : null),
        ]);

        return $order;
    }

    /**
     * Update kitchen status for an item or all items in an order.
     */
    public function updateKitchenStatus(Order $order, string $kitchenStatus, ?int $orderItemId = null, ?User $actor = null): void
    {
        $now = now();
        $updates = ['kitchen_status' => $kitchenStatus];

        if ($kitchenStatus === 'preparing') {
            $updates['kitchen_started_at'] = $now;
        } elseif ($kitchenStatus === 'ready') {
            $updates['kitchen_ready_at'] = $now;
        }

        if ($orderItemId) {
            $order->items()->where('id', $orderItemId)->update($updates);
        } else {
            $order->items()->update($updates);
        }

        $this->syncOrderWithKitchenStatus($order, $actor);
    }

    /**
     * Sync main order status based on kitchen items status.
     */
    public function syncOrderWithKitchenStatus(Order $order, ?User $actor = null): void
    {
        $items = $order->items()->get();
        
        if ($items->isEmpty()) {
            return;
        }

        $allPending = $items->every(fn ($item) => $item->kitchen_status === 'pending');
        $anyPreparing = $items->contains(fn ($item) => $item->kitchen_status === 'preparing');
        $allReady = $items->every(fn ($item) => $item->kitchen_status === 'ready' || $item->kitchen_status === 'served');
        $allServed = $items->every(fn ($item) => $item->kitchen_status === 'served');

        $newStatus = null;

        if ($allServed) {
            $newStatus = 'completed';
        } elseif ($allReady) {
            $newStatus = 'ready';
        } elseif ($anyPreparing) {
            $newStatus = 'preparing';
        } elseif ($allPending) {
            // If currently accepted/preparing but all items pending (maybe reset), revert to accepted?
            // Or keep as is. Let's say if all pending, we ensure it's at least accepted if it was paid.
            // For now, let's not auto-revert to pending if it was already accepted.
            // But if it was pending, stay pending.
        }

        if ($newStatus && $newStatus !== $order->order_status) {
            // Use force=true because kitchen updates might skip standard flow (e.g. pending -> ready directly)
            $this->transition($order, $newStatus, $actor, 'Auto-updated from Kitchen Status', force: true);
        }
    }
}

