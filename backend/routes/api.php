<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Cashier\OrderController as CashierOrderController;
use App\Http\Controllers\Customer\MenuController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Customer\PaymentController as CustomerPaymentController;
use App\Http\Controllers\Payment\PaymentCallbackController;
use App\Http\Controllers\Payment\PaymentProofController;
use App\Http\Controllers\SuperAdmin\PlanController as SuperAdminPlanController;
use App\Http\Controllers\SuperAdmin\TenantController as SuperAdminTenantController;
use App\Http\Controllers\Tenant\CategoryController;
use App\Http\Controllers\Tenant\ImageUploadController;
use App\Http\Controllers\Tenant\MenuController as TenantMenuController;
use App\Http\Controllers\Tenant\OptionGroupController;
use App\Http\Controllers\Tenant\TableController;
use App\Http\Controllers\Tenant\TenantController as TenantTenantController;
use App\Http\Controllers\Tenant\UserController as TenantUserController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

/**
 * Authentication APIs (public).
 * Note: These routes need session middleware for Auth::attempt() to work.
 */
Route::prefix('auth')
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,
    ])
    ->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:5,1'); // 5 attempts per minute
        Route::post('register', [AuthController::class, 'register'])
            ->middleware('throttle:3,1'); // 3 attempts per minute
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth');
    });

/**
 * Payment gateway callback (no authentication required, but signature verified).
 */
Route::post('payment/callback', [PaymentCallbackController::class, 'handle']);

/**
 * Public customer APIs (QR flow).
 */
Route::prefix('public/{tenant_slug}')
    ->middleware('tenant.context')
    ->group(function () {
        Route::get('tables/{qr_token}/menus', MenuController::class);
        Route::get('payment-settings', [CustomerPaymentController::class, 'getPaymentSettings']);
        Route::post('orders', [CustomerOrderController::class, 'store']);
        Route::get('orders/{order_code}', [CustomerOrderController::class, 'show']);
        Route::post('orders/{order_code}/upload-proof', [CustomerPaymentController::class, 'uploadProof']);
    });

/**
 * Tenant admin APIs.
 */
Route::prefix('tenant')
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,
        'auth',
        'role:tenant_admin',
        'tenant.context',
        'subscription.active',
    ])
    ->group(function () {
        Route::apiResource('menus', TenantMenuController::class);
        Route::post('menus/{menu}/toggle-availability', [TenantMenuController::class, 'toggleAvailability']);
        Route::post('upload-image', [ImageUploadController::class, 'upload']);

        Route::apiResource('tables', TableController::class)->except(['show']);
        Route::post('tables/{table}/regenerate-qr', [TableController::class, 'regenerateQr']);
        Route::get('tables/{table}/print-qr', [TableController::class, 'printQr']);
        Route::get('tables/{table}/download-qr', [TableController::class, 'downloadQr']);

        Route::get('option-groups', [OptionGroupController::class, 'index']);
        Route::post('option-groups', [OptionGroupController::class, 'store']);
        Route::put('option-groups/{optionGroup}', [OptionGroupController::class, 'update']);
        Route::delete('option-groups/{optionGroup}', [OptionGroupController::class, 'destroy']);
        Route::post('option-groups/{optionGroup}/items', [OptionGroupController::class, 'storeItem']);
        Route::put('option-items/{optionItem}', [OptionGroupController::class, 'updateItem']);
        Route::delete('option-items/{optionItem}', [OptionGroupController::class, 'destroyItem']);

        Route::get('users', [TenantUserController::class, 'index']);
        Route::post('users', [TenantUserController::class, 'store']);
        Route::put('users/{user}', [TenantUserController::class, 'update']);
        Route::post('users/{user}/toggle-status', [TenantUserController::class, 'toggleStatus']);

        Route::get('settings', [TenantTenantController::class, 'show']);
        Route::put('settings', [TenantTenantController::class, 'update']);

        Route::get('categories', [CategoryController::class, 'index']);
    });

/**
 * Cashier APIs.
 */
Route::prefix('cashier')
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,
        'auth',
        'role:cashier|tenant_admin',
        'tenant.context',
        'subscription.active',
    ])
    ->group(function () {
        Route::get('orders', [CashierOrderController::class, 'index']);
        Route::get('orders/completed', [CashierOrderController::class, 'completed']);
        Route::get('orders/{order}', [CashierOrderController::class, 'show']);
        Route::patch('orders/{order}/status', [CashierOrderController::class, 'updateStatus']);
        Route::patch('orders/{order}/payment-status', [CashierOrderController::class, 'updatePaymentStatus']);
        Route::post('orders/{order}/mark-invoice-printed', [CashierOrderController::class, 'markInvoicePrinted']);
        Route::get('payments/{payment}/proof', [PaymentProofController::class, 'show']);
        Route::get('settings', [TenantTenantController::class, 'show']);
    });

/**
 * Super admin APIs.
 */
Route::prefix('admin')
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,
        'auth',
        'role:super_admin',
    ])
    ->group(function () {
        Route::apiResource('tenants', SuperAdminTenantController::class);
        Route::post('tenants/{tenant}/toggle-status', [SuperAdminTenantController::class, 'toggleStatus']);
        Route::apiResource('plans', SuperAdminPlanController::class);
    });

