<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'table_id',
        'order_code',
        'total_amount',
        'payment_method',
        'payment_status',
        'order_status',
        'customer_note',
        'customer_name',
        'invoice_printed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'invoice_printed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(OrderLog::class);
    }
}

