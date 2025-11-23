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

class DemoAccountSeeder extends Seeder
{
    public function run(): void
    {
        // Create or get demo plan
        $demoPlan = Plan::updateOrCreate(
            ['name' => 'Demo Plan'],
            [
                'description' => 'Plan khusus untuk demo dan testing sebelum membeli.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'features_json' => json_encode([
                    'demo_mode',
                    'unlimited_menu',
                    'kasir_dashboard',
                    'subscription_reporting',
                    'limited_to_30_days',
                ]),
                'is_active' => true,
            ]
        );

        // Create demo tenant
        $demoTenant = Tenant::updateOrCreate(
            ['slug' => 'demo-cafe'],
            [
                'name' => 'Demo Cafe',
                'logo_url' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=200&q=80',
                'address' => 'Jl. Demo No. 123, Jakarta',
                'phone' => '+62 812-0000-0000',
                'timezone' => 'Asia/Jakarta',
                'tax_percentage' => 11,
                'is_active' => true,
            ]
        );

        // Create demo subscription (30 days trial)
        TenantSubscription::updateOrCreate(
            [
                'tenant_id' => $demoTenant->id,
                'plan_id' => $demoPlan->id,
            ],
            [
                'status' => 'trial',
                'start_date' => Carbon::now()->toDateString(),
                'end_date' => Carbon::now()->addDays(30)->toDateString(),
                'is_auto_renew' => false,
            ]
        );

        // Create demo admin user
        User::updateOrCreate(
            ['email' => 'demo@orderapp.test'],
            [
                'tenant_id' => $demoTenant->id,
                'name' => 'Demo Admin',
                'password' => Hash::make('demo123'),
                'role' => 'tenant_admin',
                'is_active' => true,
            ]
        );

        // Create demo cashier user
        User::updateOrCreate(
            ['email' => 'kasir@demo.test'],
            [
                'tenant_id' => $demoTenant->id,
                'name' => 'Demo Kasir',
                'password' => Hash::make('demo123'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );

        // Create demo tables
        $tableDefinitions = [
            ['table_number' => '01', 'qr_token' => 'demo-tbl-01'],
            ['table_number' => '02', 'qr_token' => 'demo-tbl-02'],
            ['table_number' => '03', 'qr_token' => 'demo-tbl-03'],
            ['table_number' => 'VIP-1', 'qr_token' => 'demo-vip-1'],
        ];

        foreach ($tableDefinitions as $tableData) {
            Table::updateOrCreate(
                [
                    'tenant_id' => $demoTenant->id,
                    'table_number' => $tableData['table_number'],
                ],
                [
                    'qr_token' => $tableData['qr_token'] ?? Str::random(16),
                    'is_active' => true,
                ]
            );
        }

        // Create demo categories
        $categoryMap = [];
        $categoryNames = ['Coffee', 'Non Coffee', 'Food', 'Snacks'];
        foreach ($categoryNames as $index => $categoryName) {
            $category = Category::updateOrCreate(
                ['tenant_id' => $demoTenant->id, 'name' => $categoryName],
                ['sort_order' => $index]
            );
            $categoryMap[$categoryName] = $category->id;
        }

        // Create demo option groups
        $optionGroupsData = [
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
                'name' => 'Temperature',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'Hot', 'extra_price' => 0],
                    ['label' => 'Cold', 'extra_price' => 0],
                    ['label' => 'Ice', 'extra_price' => 0],
                ],
            ],
            [
                'name' => 'Topping',
                'type' => 'multi_choice',
                'is_required' => false,
                'items' => [
                    ['label' => 'Extra Shot (+7k)', 'extra_price' => 7000],
                    ['label' => 'Whipped Cream (+5k)', 'extra_price' => 5000],
                    ['label' => 'Caramel Drizzle (+6k)', 'extra_price' => 6000],
                ],
            ],
        ];

        $optionGroupMap = [];
        foreach ($optionGroupsData as $groupData) {
            $group = OptionGroup::updateOrCreate(
                ['tenant_id' => $demoTenant->id, 'name' => $groupData['name']],
                [
                    'type' => $groupData['type'],
                    'is_required' => $groupData['is_required'],
                    'sort_order' => array_search($groupData['name'], array_column($optionGroupsData, 'name'), true),
                ]
            );

            foreach ($groupData['items'] as $itemIndex => $itemData) {
                OptionItem::updateOrCreate(
                    [
                        'option_group_id' => $group->id,
                        'label' => $itemData['label'],
                    ],
                    [
                        'extra_price' => $itemData['extra_price'],
                        'sort_order' => $itemIndex,
                        'is_active' => true,
                    ]
                );
            }

            $optionGroupMap[$groupData['name']] = $group->id;
        }

        // Create demo menus
        $menus = [
            [
                'name' => 'Espresso',
                'category' => 'Coffee',
                'price' => 25000,
                'description' => 'Kopi espresso murni dengan rasa yang kuat.',
                'image_url' => 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Temperature'],
            ],
            [
                'name' => 'Cappuccino',
                'category' => 'Coffee',
                'price' => 30000,
                'description' => 'Espresso dengan susu steamed dan foam yang creamy.',
                'image_url' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Temperature', 'Topping'],
            ],
            [
                'name' => 'Latte',
                'category' => 'Coffee',
                'price' => 32000,
                'description' => 'Espresso dengan susu steamed yang lembut.',
                'image_url' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Temperature', 'Topping'],
            ],
            [
                'name' => 'Green Tea Latte',
                'category' => 'Non Coffee',
                'price' => 28000,
                'description' => 'Matcha latte dengan susu yang creamy.',
                'image_url' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Temperature'],
            ],
            [
                'name' => 'Chocolate Milkshake',
                'category' => 'Non Coffee',
                'price' => 25000,
                'description' => 'Milkshake coklat yang segar dan manis.',
                'image_url' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size'],
            ],
            [
                'name' => 'Nasi Goreng Spesial',
                'category' => 'Food',
                'price' => 35000,
                'description' => 'Nasi goreng dengan telur, ayam, dan kerupuk.',
                'image_url' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'French Fries',
                'category' => 'Snacks',
                'price' => 20000,
                'description' => 'Kentang goreng crispy dengan saus.',
                'image_url' => 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Chicken Wings',
                'category' => 'Snacks',
                'price' => 45000,
                'description' => 'Sayap ayam crispy dengan saus pilihan.',
                'image_url' => 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
        ];

        foreach ($menus as $menuData) {
            $menu = Menu::updateOrCreate(
                [
                    'tenant_id' => $demoTenant->id,
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

        $this->command->info('Demo account created successfully!');
        $this->command->info('Demo Admin: demo@orderapp.test / demo123');
        $this->command->info('Demo Cashier: kasir@demo.test / demo123');
        $this->command->info('Tenant Slug: demo-cafe');
    }
}

