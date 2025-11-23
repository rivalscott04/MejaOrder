<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Order\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentCallbackController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
    ) {
    }

    /**
     * Handle payment callback from Tripay or other payment gateways.
     * 
     * This endpoint should be configured as the callback URL in your payment gateway settings.
     * Example: https://yourdomain.com/api/payment/callback
     */
    public function handle(Request $request): JsonResponse
    {
        // Log incoming callback for debugging (without sensitive data)
        Log::info('Payment callback received', [
            'ip' => $request->ip(),
            'reference' => $request->input('reference'),
            'status' => $request->input('status'),
            'method' => $request->input('method'),
            // Jangan log: amount, signature, headers lengkap, atau data sensitif
        ]);

        // Validate callback signature (Tripay uses signature verification)
        $signature = $request->header('X-Callback-Signature') ?? $request->input('signature');
        $isValid = $this->verifySignature($request, $signature);

        if (! $isValid) {
            Log::warning('Invalid payment callback signature', [
                'ip' => $request->ip(),
                'data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid signature',
            ], 401);
        }

        // Extract payment data from callback
        $reference = $request->input('reference'); // Order reference/merchant_ref
        $status = $request->input('status'); // PAID, UNPAID, EXPIRED, etc.
        $amount = $request->input('amount');
        $paymentMethod = $request->input('method'); // e.g., 'QRIS', 'OVO', etc.

        // Hanya lookup dengan order_code untuk keamanan
        $order = Order::where('order_code', $reference)->first();

        if (! $order) {
            Log::warning('Order not found for payment callback', [
                'reference' => $reference,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        try {
            // Handle payment status
            if ($status === 'PAID' || $status === 'paid') {
                $this->handlePaidPayment($order, $request);
            } elseif ($status === 'EXPIRED' || $status === 'expired') {
                $this->handleExpiredPayment($order);
            } elseif ($status === 'FAILED' || $status === 'failed') {
                $this->handleFailedPayment($order);
            }

            return response()->json([
                'success' => true,
                'message' => 'Callback processed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing payment callback', [
                'reference' => $reference,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing callback',
            ], 500);
        }
    }

    /**
     * Verify payment gateway signature.
     * 
     * For Tripay, signature is calculated as:
     * hash_hmac('sha256', $merchantCode . $merchantRef . $amount, $privateKey)
     */
    protected function verifySignature(Request $request, ?string $signature): bool
    {
        // Get Tripay configuration from config or env
        $privateKey = config('services.tripay.private_key', env('TRIPAY_PRIVATE_KEY'));
        
        if (! $privateKey || ! $signature) {
            Log::error('Payment callback verification failed: missing credentials', [
                'has_private_key' => !empty($privateKey),
                'has_signature' => !empty($signature),
                'environment' => app()->environment(),
            ]);
            return false; // Always verify, even in development
        }

        // Extract required fields for signature calculation
        $merchantCode = $request->input('merchant_code');
        $merchantRef = $request->input('merchant_ref') ?? $request->input('reference');
        $amount = $request->input('amount');

        if (!$merchantCode || !$merchantRef || !$amount) {
            Log::warning('Payment callback missing required fields', [
                'has_merchant_code' => !empty($merchantCode),
                'has_merchant_ref' => !empty($merchantRef),
                'has_amount' => !empty($amount),
            ]);
            return false;
        }

        // Calculate expected signature
        $expectedSignature = hash_hmac('sha256', $merchantCode . $merchantRef . $amount, $privateKey);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Handle successful payment.
     */
    protected function handlePaidPayment(Order $order, Request $request): void
    {
        // Check if payment already exists
        $existingPayment = $order->payments()
            ->where('method', 'qris')
            ->whereNotNull('verified_at')
            ->first();

        if ($existingPayment) {
            Log::info('Payment already verified', [
                'order_id' => $order->id,
                'payment_id' => $existingPayment->id,
            ]);
            return;
        }

        // Create or update payment record
        $payment = $order->payments()->firstOrCreate(
            [
                'method' => 'qris',
            ],
            [
                'amount' => $request->input('amount', $order->total_amount),
                'bank_name' => $request->input('payment_method') ?? 'QRIS',
                'note' => 'Payment via payment gateway callback',
            ]
        );

        // Mark payment as verified automatically (since it's from payment gateway)
        $payment->forceFill([
            'verified_at' => now(),
            'verified_by' => null, // System verified
        ])->save();

        // Update order payment status
        $order->forceFill([
            'payment_status' => 'paid',
        ])->save();

        // Create order log
        $order->logs()->create([
            'user_id' => null,
            'from_status' => $order->order_status,
            'to_status' => $order->order_status,
            'note' => 'Payment verified via payment gateway callback',
        ]);

        Log::info('Payment verified successfully', [
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
        ]);
    }

    /**
     * Handle expired payment.
     */
    protected function handleExpiredPayment(Order $order): void
    {
        $order->forceFill([
            'payment_status' => 'expired',
        ])->save();

        $order->logs()->create([
            'user_id' => null,
            'from_status' => $order->order_status,
            'to_status' => $order->order_status,
            'note' => 'Payment expired',
        ]);

        Log::info('Payment expired', [
            'order_id' => $order->id,
        ]);
    }

    /**
     * Handle failed payment.
     */
    protected function handleFailedPayment(Order $order): void
    {
        $order->forceFill([
            'payment_status' => 'failed',
        ])->save();

        $order->logs()->create([
            'user_id' => null,
            'from_status' => $order->order_status,
            'to_status' => $order->order_status,
            'note' => 'Payment failed',
        ]);

        Log::info('Payment failed', [
            'order_id' => $order->id,
        ]);
    }
}

