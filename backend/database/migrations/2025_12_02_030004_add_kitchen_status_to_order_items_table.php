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
        Schema::table('order_items', function (Blueprint $table) {
            $table->enum('kitchen_status', ['pending', 'preparing', 'ready', 'served'])->default('pending')->after('item_note');
            $table->timestamp('kitchen_started_at')->nullable()->after('kitchen_status');
            $table->timestamp('kitchen_ready_at')->nullable()->after('kitchen_started_at');
            $table->unsignedBigInteger('kitchen_station_id')->nullable()->after('kitchen_ready_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['kitchen_status', 'kitchen_started_at', 'kitchen_ready_at', 'kitchen_station_id']);
        });
    }
};
