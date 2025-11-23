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
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('table_number', 50);
            $table->string('qr_token', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'qr_token']);
            $table->index(['tenant_id', 'table_number']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 100);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('image_url', 255)->nullable();
            $table->boolean('is_available')->default(true);
            $table->integer('stock')->nullable();
            $table->string('sku', 50)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_available']);
            $table->index(['tenant_id', 'category_id']);
        });

        Schema::create('option_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 100);
            $table->enum('type', ['single_choice', 'multi_choice'])->default('single_choice');
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('min_select')->nullable();
            $table->unsignedInteger('max_select')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('option_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('option_group_id')->constrained('option_groups')->cascadeOnDelete();
            $table->string('label', 100);
            $table->decimal('extra_price', 12, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_option_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->foreignId('option_group_id')->constrained('option_groups')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['menu_id', 'option_group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_option_groups');
        Schema::dropIfExists('option_items');
        Schema::dropIfExists('option_groups');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('tables');
    }
};
