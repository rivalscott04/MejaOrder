<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class PaymentProofController extends Controller
{
    /**
     * Serve payment proof image/file.
     * Accessible by cashier and tenant admin for their tenant's orders.
     */
    public function show(Payment $payment): Response|JsonResponse
    {
        // Load order relationship
        $payment->load('order');
        
        // Check if payment has proof
        if (!$payment->proof_url) {
            abort(404, 'Payment proof not found.');
        }

        // Authorize: ensure user has access to this payment's order
        $tenant = tenant();
        if ($payment->order->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized access to payment proof.');
        }

        // Extract the storage path from the URL
        // URL format from Storage::disk('public')->url(): {APP_URL}/storage/payments/proofs/...
        // We need to extract: payments/proofs/...
        $url = $payment->proof_url;
        $storagePath = null;
        
        // Method 1: Try to extract from /storage/ pattern
        if (str_contains($url, '/storage/')) {
            $parts = explode('/storage/', $url);
            if (isset($parts[1])) {
                $storagePath = $parts[1];
            }
        }
        
        // Method 2: Try using Storage URL helper to reverse-engineer
        if (!$storagePath) {
            $baseUrl = Storage::disk('public')->url('');
            if (str_starts_with($url, $baseUrl)) {
                $storagePath = substr($url, strlen($baseUrl));
                $storagePath = ltrim($storagePath, '/');
            }
        }
        
        // Method 3: If URL is just a path, use it directly
        if (!$storagePath && !str_contains($url, '://')) {
            $storagePath = ltrim($url, '/');
            // Remove /storage prefix if present
            if (str_starts_with($storagePath, 'storage/')) {
                $storagePath = substr($storagePath, 8);
            }
        }
        
        // If still no path found, try to extract filename and reconstruct
        if (!$storagePath) {
            // Last resort: try to find payments/proofs in the URL
            if (preg_match('/payments\/proofs\/[^\/\?]+/', $url, $matches)) {
                $storagePath = $matches[0];
            }
        }
        
        if (!$storagePath) {
            abort(404, 'Could not determine storage path from payment proof URL.');
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($storagePath)) {
            abort(404, 'Payment proof file not found.');
        }

        // Get file content and mime type
        $fileContent = Storage::disk('public')->get($storagePath);
        $mimeType = Storage::disk('public')->mimeType($storagePath);

        // Return file response
        return response($fileContent, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . basename($storagePath) . '"')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}

