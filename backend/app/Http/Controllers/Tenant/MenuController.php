<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreMenuRequest;
use App\Http\Requests\Tenant\UpdateMenuRequest;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index(): JsonResponse
    {
        $tenant = tenant();

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
            ->latest()
            ->paginate(20);

        // Add badges to each menu
        $menus->getCollection()->transform(function (Menu $menu) use ($menuSales, $bestSellerThreshold, $thirtyDaysAgo) {
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

            $menu->setAttribute('badges', $badges);
            $menu->setAttribute('sales_count', $totalSold);
            return $menu;
        });

        return response()->json($menus);
    }

    public function store(StoreMenuRequest $request): JsonResponse
    {
        $tenant = tenant();

        /** @var Menu $menu */
        $menu = Menu::query()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $request->validated('category_id'),
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'price' => $request->validated('price'),
            'image_url' => $request->validated('image_url'),
            'is_available' => $request->validated('is_available', true),
            'stock' => $request->validated('stock'),
            'sku' => $request->validated('sku'),
        ]);

        $menu->optionGroups()->sync($request->validated('option_group_ids', []));

        return response()->json($menu->load('optionGroups'), 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        $this->authorizeMenu($menu);
        return response()->json($menu->load('optionGroups'));
    }

    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $this->authorizeMenu($menu);

        $menu->fill($request->validated());
        $menu->save();
        $menu->optionGroups()->sync($request->validated('option_group_ids', []));

        return response()->json($menu->load('optionGroups'));
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $this->authorizeMenu($menu);
        $menu->delete();

        return response()->json(['message' => 'Menu deleted.']);
    }

    public function toggleAvailability(Menu $menu): JsonResponse
    {
        $this->authorizeMenu($menu);
        $menu->is_available = ! $menu->is_available;
        $menu->save();

        return response()->json(['is_available' => $menu->is_available]);
    }

    protected function authorizeMenu(Menu $menu): void
    {
        if ($menu->tenant_id !== tenant()->id) {
            abort(403);
        }
    }
}

