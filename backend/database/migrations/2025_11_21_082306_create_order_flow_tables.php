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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('table_id')->constrained('tables')->cascadeOnDelete();
            $table->string('order_code', 50)->unique();
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['cash', 'transfer', 'qris']);
            $table->enum('payment_status', ['unpaid', 'waiting_verification', 'paid', 'failed', 'refunded'])->default('unpaid');
            $table->enum('order_status', ['pending', 'accepted', 'preparing', 'ready', 'completed', 'canceled'])->default('pending');
            $table->text('customer_note')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'order_status']);
            $table->index(['tenant_id', 'payment_status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->string('menu_name_snapshot', 150);
            $table->decimal('price_snapshot', 12, 2);
            $table->unsignedInteger('qty');
            $table->decimal('subtotal', 12, 2);
            $table->text('item_note')->nullable();
            $table->timestamps();
        });

        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->string('option_group_name_snapshot', 100);
            $table->string('option_item_label_snapshot', 100);
            $table->decimal('extra_price_snapshot', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_options');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
