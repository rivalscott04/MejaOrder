<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    /**
     * Create a payment record (optional proof) scoped to an order.
     *
     * @param  array{
     *     amount?:float,
     *     method?:string,
     *     bank_name?:string,
     *     account_number?:string,
     *     note?:string
     * }  $data
     */
    public function submit(Order $order, array $data, ?UploadedFile $proof = null): Payment
    {
        $method = Arr::get($data, 'method', $order->payment_method);

        if (! in_array($method, ['cash', 'transfer', 'qris'], true)) {
            throw ValidationException::withMessages([
                'method' => 'Unsupported payment method.',
            ]);
        }

        $amount = (float) Arr::get($data, 'amount', $order->total_amount);

        $payment = $order->payments()->create([
            'amount' => $amount,
            'method' => $method,
            'bank_name' => Arr::get($data, 'bank_name'),
            'account_number' => Arr::get($data, 'account_number'),
            'note' => Arr::get($data, 'note'),
        ]);

        if ($proof) {
            $this->storeProof($payment, $proof);
        }

        return $payment;
    }

    /**
     * Upload and attach payment proof to the payment record.
     */
    public function storeProof(Payment $payment, UploadedFile $proof): Payment
    {
        if (! in_array($proof->extension(), ['png', 'jpg', 'jpeg', 'webp', 'pdf'], true)) {
            throw ValidationException::withMessages([
                'proof' => 'Invalid proof file format.',
            ]);
        }

        if ($proof->getSize() > 2 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'proof' => 'Proof file exceeds 2MB limit.',
            ]);
        }

        $storagePath = $proof->store('payments/proofs', ['disk' => 'public']);
        // Store both the relative path and full URL for flexibility
        // The relative path allows us to reconstruct the file location regardless of APP_URL changes
        $payment->forceFill([
            'proof_url' => Storage::disk('public')->url($storagePath),
        ])->save();
        
        // Also store the storage path in a separate field if needed (for now we'll extract from URL)

        return $payment;
    }

    /**
     * Mark an order and related payment as verified by cashier/admin.
     */
    public function markAsPaid(Order $order, Payment $payment, User $verifiedBy): void
    {
        $payment->forceFill([
            'verified_at' => now(),
            'verified_by' => $verifiedBy->id,
        ])->save();

        $order->forceFill([
            'payment_status' => 'paid',
        ])->save();

        $order->logs()->create([
            'user_id' => $verifiedBy->id,
            'from_status' => $order->order_status,
            'to_status' => $order->order_status,
            'note' => 'Payment verified.',
        ]);
    }
}

