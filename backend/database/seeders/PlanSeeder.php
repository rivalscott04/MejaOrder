<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // Plan Demo - untuk demo account dengan full akses
        Plan::updateOrCreate(
            ['name' => 'Demo'],
            [
                'description' => 'Plan khusus untuk demo dan testing sebelum membeli. Full akses tanpa batasan.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_tenants' => null, // unlimited
                'max_users' => null, // unlimited
                'max_menus' => null, // unlimited
                'features_json' => [
                    'demo_mode',
                    'unlimited_menu',
                    'unlimited_report_tabs',
                    'kasir_dashboard',
                    'subscription_reporting',
                    'limited_to_30_days',
                ],
                'allowed_report_tabs' => null, // unlimited - semua tab tersedia
                'is_active' => true,
            ]
        );

        // Plan Berkembang - untuk tenant yang baru berkembang
        Plan::updateOrCreate(
            ['name' => 'Berkembang'],
            [
                'description' => 'Plan untuk bisnis yang sedang berkembang dengan fitur terbatas.',
                'price_monthly' => 150000,
                'price_yearly' => 1500000,
                'max_tenants' => 1,
                'max_users' => 2,
                'max_menus' => 20,
                'features_json' => [
                    'limited_menu',
                    'limited_report_tabs',
                    'kasir_dashboard',
                    'subscription_reporting',
                ],
                'allowed_report_tabs' => ['financial', 'sales', 'operational'], // hanya 3 tab yang diizinkan
                'is_active' => true,
            ]
        );

        $this->command->info('Plans seeded successfully!');
        $this->command->info('- Plan Demo: Full akses untuk demo');
        $this->command->info('- Plan Berkembang: Max 20 menu, 3 report tabs, 1 tenant, 2 users');
    }
}

