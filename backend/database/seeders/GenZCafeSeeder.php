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
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GenZCafeSeeder extends Seeder
{
    public function run(): void
    {
        // Get or create plan
        $plan = Plan::firstOrCreate(
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

        // Create GenZCafe tenant
        $tenantData = [
            'name' => 'GenZCafe',
            'logo_url' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80',
            'address' => 'Jl. Sudirman No. 123, Jakarta Pusat',
            'phone' => '+62 812-3456-7890',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 10.00,
            'is_active' => true,
        ];

        // Add payment_settings if column exists
        if (\Schema::hasColumn('tenants', 'payment_settings')) {
            $tenantData['payment_settings'] = [
                'banks' => [
                    [
                        'bank' => 'BCA',
                        'account_number' => '1234567890',
                        'account_name' => 'GenZCafe',
                    ],
                    [
                        'bank' => 'Mandiri',
                        'account_number' => '9876543210',
                        'account_name' => 'GenZCafe',
                    ],
                ],
                'qris_image' => null, // QRIS image can be uploaded via settings page
            ];
        }

        $tenant = Tenant::updateOrCreate(
            ['slug' => 'genzcafe'],
            $tenantData
        );

        // Create subscription
        TenantSubscription::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
            ],
            [
                'status' => 'active',
                'start_date' => Carbon::now()->subMonth()->toDateString(),
                'end_date' => Carbon::now()->addMonths(11)->toDateString(),
                'is_auto_renew' => true,
            ]
        );

        // Create Admin Tenant
        User::updateOrCreate(
            ['email' => 'admin@genzcafe.id'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Admin GenZCafe',
                'password' => Hash::make('admin123'),
                'role' => 'tenant_admin',
                'is_active' => true,
            ]
        );

        // Create Kasir
        User::updateOrCreate(
            ['email' => 'kasir@genzcafe.id'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Kasir GenZCafe',
                'password' => Hash::make('kasir123'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );

        // Create Tables with QR tokens
        $tableDefinitions = [
            ['table_number' => '01', 'qr_token' => 'genz-tbl-01', 'description' => null],
            ['table_number' => '02', 'qr_token' => 'genz-tbl-02', 'description' => null],
            ['table_number' => '03', 'qr_token' => 'genz-tbl-03', 'description' => null],
            ['table_number' => '04', 'qr_token' => 'genz-tbl-04', 'description' => null],
            ['table_number' => '05', 'qr_token' => 'genz-tbl-05', 'description' => null],
            ['table_number' => '11', 'qr_token' => 'genz-tbl-11', 'description' => 'vip deket kolam'],
            ['table_number' => 'VIP-1', 'qr_token' => 'genz-vip-1', 'description' => 'VIP area - dekat jendela'],
            ['table_number' => 'VIP-2', 'qr_token' => 'genz-vip-2', 'description' => 'VIP area - corner seat'],
        ];

        foreach ($tableDefinitions as $tableData) {
            Table::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'table_number' => $tableData['table_number'],
                ],
                [
                    'qr_token' => $tableData['qr_token'],
                    'description' => $tableData['description'],
                    'is_active' => true,
                ]
            );
        }

        // Create Categories
        $categoryMap = [];
        $categories = [
            // Minuman
            ['name' => 'Kopi', 'sort_order' => 0],
            ['name' => 'Non Kopi', 'sort_order' => 1],
            ['name' => 'Juice', 'sort_order' => 2],
            // Makanan
            ['name' => 'Roti-rotian', 'sort_order' => 3],
            ['name' => 'Salad', 'sort_order' => 4],
            ['name' => 'Makanan Berat', 'sort_order' => 5],
        ];

        foreach ($categories as $catData) {
            $category = Category::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $catData['name']],
                ['sort_order' => $catData['sort_order']]
            );
            $categoryMap[$catData['name']] = $category->id;
        }

        // Create Option Groups
        $optionGroupsData = [
            [
                'name' => 'Temperature',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'Hot', 'extra_price' => 0],
                    ['label' => 'Cold', 'extra_price' => 0],
                    ['label' => 'Iced', 'extra_price' => 0],
                ],
            ],
            [
                'name' => 'Sugar Level',
                'type' => 'single_choice',
                'is_required' => true,
                'items' => [
                    ['label' => 'No Sugar', 'extra_price' => 0],
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
                    ['label' => 'Extra Large (+8k)', 'extra_price' => 8000],
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
                    ['label' => 'Whipped Cream (+4k)', 'extra_price' => 4000],
                ],
            ],
            [
                'name' => 'Ice Level',
                'type' => 'single_choice',
                'is_required' => false,
                'items' => [
                    ['label' => 'No Ice', 'extra_price' => 0],
                    ['label' => 'Less Ice', 'extra_price' => 0],
                    ['label' => 'Normal Ice', 'extra_price' => 0],
                    ['label' => 'Extra Ice', 'extra_price' => 0],
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

        // Create Menus
        $menus = [
            // Kategori Kopi
            [
                'name' => 'Espresso',
                'category' => 'Kopi',
                'price' => 25000,
                'description' => 'Espresso shot yang kuat dan pekat, perfect untuk coffee lovers.',
                'image_url' => 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level'],
            ],
            [
                'name' => 'Cappuccino',
                'category' => 'Kopi',
                'price' => 32000,
                'description' => 'Espresso dengan steamed milk dan foam yang creamy.',
                'image_url' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Latte',
                'category' => 'Kopi',
                'price' => 30000,
                'description' => 'Espresso dengan susu steamed yang smooth dan creamy.',
                'image_url' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Americano',
                'category' => 'Kopi',
                'price' => 28000,
                'description' => 'Espresso dengan air panas, ringan dan menyegarkan.',
                'image_url' => 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size'],
            ],
            [
                'name' => 'Mocha',
                'category' => 'Kopi',
                'price' => 35000,
                'description' => 'Espresso dengan coklat dan susu, perpaduan manis yang sempurna.',
                'image_url' => 'https://images.unsplash.com/photo-1570968914863-396c44e5a47a?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Kopi Susu',
                'category' => 'Kopi',
                'price' => 27000,
                'description' => 'Kopi hitam dengan susu segar, klasik dan nikmat.',
                'image_url' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size'],
            ],

            // Kategori Non Kopi
            [
                'name' => 'Matcha Latte',
                'category' => 'Non Kopi',
                'price' => 33000,
                'description' => 'Matcha premium dengan susu steamed, creamy dan sehat.',
                'image_url' => 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Chocolate Latte',
                'category' => 'Non Kopi',
                'price' => 31000,
                'description' => 'Coklat premium dengan susu steamed, manis dan hangat.',
                'image_url' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Red Velvet Latte',
                'category' => 'Non Kopi',
                'price' => 34000,
                'description' => 'Red velvet dengan susu steamed, unik dan lezat.',
                'image_url' => 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],
            [
                'name' => 'Taro Latte',
                'category' => 'Non Kopi',
                'price' => 32000,
                'description' => 'Taro dengan susu steamed, creamy dan unik.',
                'image_url' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Temperature', 'Sugar Level', 'Size', 'Topping'],
            ],

            // Kategori Juice
            [
                'name' => 'Orange Juice',
                'category' => 'Juice',
                'price' => 25000,
                'description' => 'Jus jeruk segar, vitamin C untuk hari yang cerah.',
                'image_url' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Ice Level'],
            ],
            [
                'name' => 'Watermelon Juice',
                'category' => 'Juice',
                'price' => 23000,
                'description' => 'Jus semangka segar, menyegarkan dan manis.',
                'image_url' => 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Ice Level'],
            ],
            [
                'name' => 'Avocado Juice',
                'category' => 'Juice',
                'price' => 28000,
                'description' => 'Jus alpukat dengan susu, creamy dan sehat.',
                'image_url' => 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Ice Level'],
            ],
            [
                'name' => 'Strawberry Juice',
                'category' => 'Juice',
                'price' => 27000,
                'description' => 'Jus strawberry segar, manis dan asam yang seimbang.',
                'image_url' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Ice Level'],
            ],
            [
                'name' => 'Mixed Fruit Juice',
                'category' => 'Juice',
                'price' => 30000,
                'description' => 'Campuran berbagai buah segar, penuh vitamin.',
                'image_url' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
                'option_groups' => ['Size', 'Ice Level'],
            ],

            // Kategori Roti-rotian
            [
                'name' => 'Croissant Original',
                'category' => 'Roti-rotian',
                'price' => 25000,
                'description' => 'Croissant buttery yang renyah dan gurih.',
                'image_url' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Croissant Chocolate',
                'category' => 'Roti-rotian',
                'price' => 30000,
                'description' => 'Croissant dengan isian coklat yang melimpah.',
                'image_url' => 'https://images.unsplash.com/photo-1542838686-ad50d06dd1af?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Croissant Almond',
                'category' => 'Roti-rotian',
                'price' => 32000,
                'description' => 'Croissant dengan topping almond dan gula.',
                'image_url' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Danish Pastry',
                'category' => 'Roti-rotian',
                'price' => 28000,
                'description' => 'Pastry dengan berbagai topping pilihan.',
                'image_url' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Bagel with Cream Cheese',
                'category' => 'Roti-rotian',
                'price' => 35000,
                'description' => 'Bagel fresh dengan cream cheese yang creamy.',
                'image_url' => 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],

            // Kategori Salad
            [
                'name' => 'Caesar Salad',
                'category' => 'Salad',
                'price' => 45000,
                'description' => 'Salad dengan romaine lettuce, crouton, dan caesar dressing.',
                'image_url' => 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Garden Salad',
                'category' => 'Salad',
                'price' => 40000,
                'description' => 'Campuran sayuran segar dengan dressing pilihan.',
                'image_url' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Chicken Salad',
                'category' => 'Salad',
                'price' => 50000,
                'description' => 'Salad dengan grilled chicken, sayuran segar, dan dressing.',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Fruit Salad',
                'category' => 'Salad',
                'price' => 35000,
                'description' => 'Campuran buah-buahan segar dengan yogurt dressing.',
                'image_url' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],

            // Kategori Makanan Berat
            [
                'name' => 'Nasi Goreng Spesial',
                'category' => 'Makanan Berat',
                'price' => 45000,
                'description' => 'Nasi goreng dengan telur, ayam, dan kerupuk.',
                'image_url' => 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Mie Goreng',
                'category' => 'Makanan Berat',
                'price' => 42000,
                'description' => 'Mie goreng dengan telur, ayam, dan sayuran.',
                'image_url' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Chicken Teriyaki Bowl',
                'category' => 'Makanan Berat',
                'price' => 55000,
                'description' => 'Nasi dengan chicken teriyaki, sayuran, dan telur.',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Beef Rendang',
                'category' => 'Makanan Berat',
                'price' => 65000,
                'description' => 'Rendang daging sapi dengan nasi putih dan sayuran.',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Spaghetti Carbonara',
                'category' => 'Makanan Berat',
                'price' => 58000,
                'description' => 'Spaghetti dengan carbonara sauce, bacon, dan parmesan.',
                'image_url' => 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
                'option_groups' => [],
            ],
            [
                'name' => 'Grilled Chicken Steak',
                'category' => 'Makanan Berat',
                'price' => 75000,
                'description' => 'Steak ayam dengan mashed potato dan sayuran.',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
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
                    'stock' => null, // Unlimited stock
                ]
            );

            // Sync option groups
            $menu->optionGroups()->sync(
                collect($menuData['option_groups'])
                    ->map(fn ($groupName) => $optionGroupMap[$groupName] ?? null)
                    ->filter()
                    ->values()
            );
        }

        $this->command->info('GenZCafe seeder completed successfully!');
        $this->command->info('Tenant: GenZCafe');
        $this->command->info('Admin: admin@genzcafe.id / admin123');
        $this->command->info('Kasir: kasir@genzcafe.id / kasir123');
    }
}

