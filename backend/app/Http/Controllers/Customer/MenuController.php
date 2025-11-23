<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Menu;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function __invoke(string $tenant_slug, string $qr_token): JsonResponse
    {
        $tenant = tenant();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        /** @var Table $table */
        $table = Table::query()
            ->where('tenant_id', $tenant->id)
            ->where('qr_token', $qr_token)
            ->where('is_active', true)
            ->firstOrFail();

        $categories = Category::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'sort_order']);

        // Calculate sales statistics for best seller badge (last 30 days)
        $thirtyDaysAgo = now()->subDays(30);
        
        $menuSales = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenant->id)
            ->where('orders.created_at', '>=', $thirtyDaysAgo)
            ->whereIn('orders.order_status', ['accepted', 'preparing', 'ready', 'completed'])
            ->select('order_items.menu_id', DB::raw('SUM(order_items.qty) as total_sold'))
            ->groupBy('order_items.menu_id')
            ->get()
            ->keyBy('menu_id');

        // Get top 20% of menus by sales for "Terlaris" badge
        $salesThreshold = $menuSales->max('total_sold');
        $bestSellerThreshold = $salesThreshold ? $salesThreshold * 0.2 : 0; // Top 20%

        $menus = Menu::query()
            ->where('tenant_id', $tenant->id)
            ->with('optionGroups:id')
            ->orderBy('name')
            ->get()
            ->map(function (Menu $menu) use ($menuSales, $bestSellerThreshold, $thirtyDaysAgo) {
                $sales = $menuSales->get($menu->id);
                $totalSold = $sales ? (int) $sales->total_sold : 0;
                $isBestSeller = $totalSold > 0 && $totalSold >= $bestSellerThreshold;
                
                // Check if menu is new (created within last 30 days)
                $isNew = $menu->created_at >= $thirtyDaysAgo;
                
                // Calculate badges
                $badges = [];
                if ($isBestSeller) {
                    $badges[] = 'Terlaris';
                }
                if ($isNew) {
                    $badges[] = 'Baru';
                }
                // "Layak Dicoba" bisa ditambahkan berdasarkan logika lain atau manual

                return [
                    'id' => $menu->id,
                    'tenant_id' => $menu->tenant_id,
                    'category_id' => $menu->category_id,
                    'name' => $menu->name,
                    'description' => $menu->description,
                    'price' => (float) $menu->price,
                    'image_url' => $menu->image_url,
                    'is_available' => (bool) $menu->is_available,
                    'stock' => $menu->stock,
                    'option_group_ids' => $menu->optionGroups->pluck('id')->all(),
                    'badges' => $badges,
                    'created_at' => $menu->created_at->toISOString(),
                ];
            });

        $optionGroups = OptionGroup::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('sort_order')
            ->get()
            ->map(function (OptionGroup $group) {
                return [
                    'id' => $group->id,
                    'tenant_id' => $group->tenant_id,
                    'name' => $group->name,
                    'type' => $group->type,
                    'is_required' => (bool) $group->is_required,
                    'min_select' => $group->min_select,
                    'max_select' => $group->max_select,
                    'sort_order' => $group->sort_order,
                ];
            });

        $optionItems = OptionItem::query()
            ->whereIn('option_group_id', $optionGroups->pluck('id'))
            ->orderBy('sort_order')
            ->get()
            ->map(function (OptionItem $item) {
                return [
                    'id' => $item->id,
                    'option_group_id' => $item->option_group_id,
                    'label' => $item->label,
                    'extra_price' => (float) $item->extra_price,
                    'is_active' => (bool) $item->is_active,
                ];
            });

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url,
                'tax_percentage' => (float) $tenant->tax_percentage,
            ],
            'table' => [
                'id' => $table->id,
                'number' => $table->table_number,
                'qr_token' => $table->qr_token,
            ],
            'categories' => $categories,
            'menus' => $menus,
            'option_groups' => $optionGroups,
            'option_items' => $optionItems,
        ]);
    }
}

