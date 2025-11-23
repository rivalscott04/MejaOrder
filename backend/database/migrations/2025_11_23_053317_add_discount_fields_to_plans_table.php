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
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('discount_percentage', 5, 2)->nullable()->after('price_yearly');
            $table->decimal('discount_amount', 12, 2)->nullable()->after('discount_percentage');
            $table->date('discount_start_date')->nullable()->after('discount_amount');
            $table->date('discount_end_date')->nullable()->after('discount_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'discount_percentage',
                'discount_amount',
                'discount_start_date',
                'discount_end_date',
            ]);
        });
    }
};
