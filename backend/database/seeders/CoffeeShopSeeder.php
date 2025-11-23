<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Menu;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Plan;
use App\Models\Table;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CoffeeShopSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::updateOrCreate(
            ['name' => 'Growth Cafe'],
            [
                'description' => 'Plan untuk cafe independen dengan kebutuhan multi user.',
                'price_monthly' => 250000,
                'price_yearly' => 2500000,
                'features_json' => json_encode([
                    'up_to_20_users',
                    'unlimited_menu',
                    'kasir_dashboard',
                    'subscription_reporting',
                ]),
                'is_active' => true,
            ]
        );

        $tenant = Tenant::updateOrCreate(
            ['slug' => 'kopi-bumi-senja'],
            [
                'name' => 'Kopi Bumi Senja',
                'logo_url' => 'https://images.unsplash.com/photo-1432107294467-7b5c4c34528b?auto=format&fit=crop&w=200&q=80',
                'address' => 'Jl. Cendana No. 21, Bandung',
                'phone' => '+62 812-5555-9911',
                'timezone' => 'Asia/Jakarta',
                'is_active' => true,
            ]
        );

        TenantSubscription::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
            ],
            [
                'status' => 'active',
                'start_date' => Carbon::now()->subMonth()->toDateString(),
                'end_date' => Carbon::now()->addMonths(5)->toDateString(),
                'is_auto_renew' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'super@orderapp.test'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('orderapp123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@senja.id'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Alya Pradana',
                'password' => Hash::make('senjaadmin123'),
                'role' => 'tenant_admin',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'kasir@senja.id'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Raka Putra',
                'password' => Hash::make('kasirsenja123'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );

        $tableDefinitions = [
            ['table_number' => '01', 'qr_token' => 'tbl-01-senja'],
            ['table_number' => '02', 'qr_token' => 'tbl-02-senja'],
            ['table_number' => 'Garden-1', 'qr_token' => 'tbl-garden-1'],
            ['table_number' => 'Bar', 'qr_token' => 'tbl-bar-senja'],
        ];

        foreach ($tableDefinitions as $tableData) {
            Table::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'table_number' => $tableData['table_number'],
                ],
                [
                    'qr_token' => $tableData['qr_token'] ?? Str::random(16),
                    'is_active' => true,
                ]
            );
        }

        $categoryMap = [];
        foreach (['Signature Coffee', 'Non Coffee', 'Comfort Food'] as $categoryName) {
            $category = Category::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $categoryName],
                ['sort_order' => count($categoryMap)]
            );

            $categoryMap[$categoryName] = $category->id;
        }

        $optionGroupsData = [
            [
                'name' => 'Temperature',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'Hot', 'extra_price' => 0],
                    ['label' => 'Cold', 'extra_price' => 0],
                ],
            ],
            [
                'name' => 'Sugar Level',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'Less Sugar', 'extra_price' => 0],
                    ['label' => 'Normal', 'extra_price' => 0],
                    ['label' => 'Extra Sweet', 'extra_price' => 0],
                ],
            ],
            [
                'name' => 'Size',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'Regular', 'extra_price' => 0],
                    ['label' => 'Large (+5k)', 'extra_price' => 5000],
                ],
            ],
            [
                'name' => 'Topping',
                'type' => 'multi_choice',
                'is_required' => false,
                'items' => [
                    ['label' => 'Extra Shot (+7k)', 'extra_price' => 7000],
                    ['label' => 'Brown Sugar Jelly (+6k)', 'extra_price' => 6000],
                    ['label' => 'Regal Crumbs (+5k)', 'extra_price' => 5000],
                ],
            ],
        ];

        $optionGroupMap = [];
        foreach ($optionGroupsData as $groupData) {
            $group = OptionGroup::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $groupData['name']],
                [
                    'type' => $groupData['type'],
                    'is_required' => $groupData['is_required'],
                    'sort_order' => array_search($groupData['name'], array_column($optionGroupsData, 'name'), true),
                ]
            );

            foreach ($groupData['items'] as $index => $itemData) {
                OptionItem::updateOrCreate(
                    [
                        'option_group_id' => $group->id,
                        'label' => $itemData['label'],
                    ],
                    [
                        'extra_price' => $itemData['extra_price'],
                        'sort_order' => $index,
                        'is_active' => true,
                    ]
                );
            }

            $optionGroupMap[$groupData['name']] = $group->id;
        }

        $menus = [
            [
                'name' => 'Es Kopi Susu Bumi',
                'category' => 'Signature Coffee',
                'price' => 28000,
                'description' => 'Espresso blend + susu segar + gula aren homemade.',
                'image_url' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size'],
            ],
            [
                'name' => 'Kopi Senja Caramel',
                'category' => 'Signature Coffee',
                'price' => 32000,
                'description' => 'Creamy latte dengan sirup caramel roasted.',
                'image_url' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Berry Yogurt Sparkling',
                'category' => 'Non Coffee',
                'price' => 30000,
                'description' => 'Minuman segar perpaduan yogurt dan berry compote.',
                'image_url' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size'],
            ],
            [
                'name' => 'Truffle Fries',
                'category' => 'Comfort Food',
                'price' => 36000,
                'description' => 'Kentang goreng dengan minyak truffle dan parmesan.',
                'image_url' => 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Croissant Smoked Beef',
                'category' => 'Comfort Food',
                'price' => 42000,
                'description' => 'Croissant butter isi smoked beef, keju cheddar, telur orak-arik.',
                'image_url' => 'https://images.unsplash.com/photo-1542838686-ad50d06dd1af?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
        ];

        foreach ($menus as $menuData) {
            $menu = Menu::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => $menuData['name'],
                ],
                [
                    'category_id' => $categoryMap[$menuData['category']],
                    'description' => $menuData['description'],
                    'price' => $menuData['price'],
                    'image_url' => $menuData['image_url'],
                    'is_available' => true,
                ]
            );

            $menu->optionGroups()->sync(
                collect($menuData['option_groups'])
                    ->map(fn ($groupName) => $optionGroupMap[$groupName] ?? null)
                    ->filter()
                    ->values()
            );
        }
    }
}

