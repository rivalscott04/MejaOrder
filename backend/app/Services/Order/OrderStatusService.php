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
}

