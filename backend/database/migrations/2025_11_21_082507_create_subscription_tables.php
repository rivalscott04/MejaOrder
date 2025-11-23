<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 12, 2);
            $table->decimal('price_yearly', 12, 2)->nullable();
            $table->unsignedInteger('max_tenants')->nullable();
            $table->unsignedInteger('max_users')->nullable();
            $table->unsignedInteger('max_menus')->nullable();
            $table->json('features_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->enum('status', ['active', 'expired', 'canceled', 'trial']);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_auto_renew')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'end_date']);
            $table->index('end_date');
        });

        Schema::create('subscription_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('period_start');
            $table->date('period_end');
            $table->enum('status', ['unpaid', 'paid', 'canceled'])->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_invoices');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('plans');
    }
};
