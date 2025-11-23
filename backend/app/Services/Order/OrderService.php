<?php

namespace App\Services\Order;

use App\Models\Menu;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create a customer order strictly based on menu & option IDs from the frontend payload.
     * Payment method defaults to 'cash' if not provided.
     *
     * @param  array{
     *     qr_token?:string,
     *     customer_note?:string,
     *     payment_method?:string,
     *     bank_choice?:string,
     *     items:array<int, array{
     *         menu_id:int,
     *         qty:int,
     *         option_item_ids?:array<int>,
     *         item_note?:string
     *     }>
     * }  $payload
     */
    public function createFromPublicPayload(Tenant $tenant, Table $table, array $payload): Order
    {
        $itemsPayload = Arr::get($payload, 'items', []);

        if (empty($itemsPayload)) {
            throw ValidationException::withMessages([
                'items' => 'Order items cannot be empty.',
            ]);
        }

        $lineItems = $this->buildLineItems($tenant, $itemsPayload);

        $paymentMethod = Arr::get($payload, 'payment_method', 'cash');

        if (! in_array($paymentMethod, ['cash', 'transfer', 'qris'], true)) {
            throw ValidationException::withMessages([
                'payment_method' => 'Unsupported payment method.',
            ]);
        }

        return DB::transaction(function () use ($tenant, $table, $payload, $lineItems, $paymentMethod) {
            // Calculate subtotal from all items
            $subtotal = $lineItems->sum('subtotal');
            
            // Calculate tax from total subtotal based on tenant tax_percentage
            $taxAmount = 0;
            if ($tenant->tax_percentage > 0) {
                $taxAmount = $subtotal * ($tenant->tax_percentage / 100);
            }
            
            // Total amount = subtotal + tax
            $totalAmount = $subtotal + $taxAmount;
            
            $paymentStatus = $paymentMethod === 'cash' ? 'unpaid' : 'waiting_verification';

            $order = Order::query()->create([
                'tenant_id' => $tenant->id,
                'table_id' => $table->id,
                'order_code' => $this->generateOrderCode($tenant),
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'order_status' => 'pending',
                'customer_name' => Arr::get($payload, 'customer_name'),
                'customer_note' => Arr::get($payload, 'customer_note'),
            ]);

            $lineItems->each(function (array $lineItem) use ($order) {
                /** @var OrderItem $orderItem */
                $orderItem = $order->items()->create([
                    'menu_id' => $lineItem['menu']->id,
                    'menu_name_snapshot' => $lineItem['menu']->name,
                    'price_snapshot' => $lineItem['menu']->price,
                    'qty' => $lineItem['qty'],
                    'subtotal' => $lineItem['subtotal'],
                    'item_note' => $lineItem['note'],
                ]);

                $lineItem['options']->each(fn (OptionItem $optionItem) => $orderItem->options()->create([
                    'option_group_name_snapshot' => $optionItem->group->name,
                    'option_item_label_snapshot' => $optionItem->label,
                    'extra_price_snapshot' => $optionItem->extra_price,
                ]));
            });

            $order->logs()->create([
                'user_id' => null,
                'from_status' => null,
                'to_status' => 'pending',
                'note' => 'Order created via QR flow.',
            ]);

            return $order->load('items.options');
        });
    }

    /**
     * Prepare validated line items with calculated subtotal.
     *
     * @param  array<int, array<string, mixed>>  $itemsPayload
     */
    protected function buildLineItems(Tenant $tenant, array $itemsPayload): Collection
    {
        return collect($itemsPayload)->map(function (array $item) use ($tenant) {
            $menu = $this->resolveMenuForTenant($tenant, (int) Arr::get($item, 'menu_id'));
            $qty = max(1, (int) Arr::get($item, 'qty', 1));
            $optionIds = collect(Arr::get($item, 'option_item_ids', []))
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();

            $options = $this->resolveOptionItems($tenant, $menu, $optionIds);
            $optionsExtra = $options->sum(fn (OptionItem $optionItem) => (float) $optionItem->extra_price);
            $subtotal = ($menu->price + $optionsExtra) * $qty;

            return [
                'menu' => $menu,
                'qty' => $qty,
                'options' => $options,
                'subtotal' => $subtotal,
                'note' => Arr::get($item, 'item_note'),
            ];
        });
    }

    protected function resolveMenuForTenant(Tenant $tenant, int $menuId): Menu
    {
        /** @var Menu|null $menu */
        $menu = Menu::query()
            ->whereKey($menuId)
            ->where('tenant_id', $tenant->id)
            ->where('is_available', true)
            ->first();

        if (! $menu) {
            throw ValidationException::withMessages([
                'items' => "Menu {$menuId} is not available.",
            ]);
        }

        return $menu->loadMissing('optionGroups:id');
    }

    /**
     * @param  array<int>  $optionIds
     */
    protected function resolveOptionItems(Tenant $tenant, Menu $menu, array $optionIds): Collection
    {
        if (empty($optionIds)) {
            return collect();
        }

        /** @var Collection<int, OptionItem> $options */
        $options = OptionItem::query()
            ->with('group')
            ->whereIn('id', $optionIds)
            ->whereHas('group', function ($query) use ($tenant) {
                $query->where('tenant_id', $tenant->id)->where('is_active', true);
            })
            ->get();

        $missingIds = collect($optionIds)->diff($options->pluck('id')->all());

        if ($missingIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Some option items are invalid for this tenant.',
            ]);
        }

        $menuGroupIds = $menu->optionGroups()->pluck('option_groups.id')->all();

        $options->each(function (OptionItem $optionItem) use ($menuGroupIds) {
            if (! in_array($optionItem->group->getKey(), $menuGroupIds, true)) {
                throw ValidationException::withMessages([
                    'items' => "Option {$optionItem->id} is not attached to the selected menu.",
                ]);
            }
        });

        return $options;
    }

    protected function generateOrderCode(Tenant $tenant): string
    {
        // Format: [digit pertama tanggal][3 digit random][tanggal][bulan][tahun 2 digit]
        // Contoh: 1234221125 (1 = digit pertama tanggal 22, 234 = random, 221125 = 22 Nov 2025)
        // Karena order sudah di-scope per tenant (ada tenant_id), 
        // kita hanya perlu cek unik per tenant, bukan global
        $day = now()->format('d'); // Format: 01-31
        $dayFirstDigit = substr($day, 0, 1); // Ambil digit pertama tanggal (1 untuk 10-19, 2 untuk 20-29, dll)
        $random3Digits = str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
        $month = now()->format('m');
        $year = now()->format('y'); // 2 digit terakhir tahun

        $orderCode = "{$dayFirstDigit}{$random3Digits}{$day}{$month}{$year}";

        // Ensure uniqueness per tenant (tidak perlu global karena sudah ada tenant_id)
        $maxAttempts = 10;
        $attempts = 0;
        while (Order::where('tenant_id', $tenant->id)
            ->where('order_code', $orderCode)
            ->exists() && $attempts < $maxAttempts) {
            $random3Digits = str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            $orderCode = "{$dayFirstDigit}{$random3Digits}{$day}{$month}{$year}";
            $attempts++;
        }

        return $orderCode;
    }
}

