<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UploadPaymentProofRequest;
use App\Models\Order;
use App\Models\Tenant;
use App\Services\Order\PaymentService;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
    ) {
    }

    public function getPaymentSettings(string $tenant_slug): JsonResponse
    {
        $tenant = $this->currentTenant();

        $paymentSettings = $tenant->payment_settings ?? [
            'banks' => [],
            'qris_image' => null,
        ];

        return response()->json([
            'banks' => $paymentSettings['banks'] ?? [],
            'qris_image' => $paymentSettings['qris_image'] ?? null,
        ]);
    }

    public function uploadProof(UploadPaymentProofRequest $request, string $tenant_slug, string $order_code): JsonResponse
    {
        $tenant = $this->currentTenant();

        /** @var Order $order */
        $order = Order::query()
            ->where('tenant_id', $tenant->id)
            ->where('order_code', $order_code)
            ->firstOrFail();

        $data = $request->validated();

        $payment = $this->paymentService->submit(
            $order,
            [
                'amount' => $data['amount'] ?? $order->total_amount,
                'method' => $data['method'] ?? $order->payment_method,
                'bank_name' => $data['bank_name'] ?? null,
                'account_number' => $data['account_number'] ?? null,
                'note' => $data['note'] ?? null,
            ],
            $request->file('proof')
        );

        return response()->json([
            'message' => 'Payment proof uploaded.',
            'payment_id' => $payment->id,
            'proof_url' => $payment->proof_url,
        ]);
    }

    protected function currentTenant(): Tenant
    {
        $tenant = tenant();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        return $tenant;
    }
}

