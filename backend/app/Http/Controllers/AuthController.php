<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user()->load('tenant');

            // Check if user is active
            if (!$user->is_active) {
                Auth::logout();
                return response()->json([
                    'message' => 'Akun Anda tidak aktif. Silakan hubungi administrator.',
                ], 403);
            }

            // Update last login
            $user->update(['last_login_at' => now()]);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'tenant_id' => $user->tenant_id,
                ],
                'tenant' => [
                    'id' => $user->tenant->id,
                    'name' => $user->tenant->name,
                    'slug' => $user->tenant->slug,
                ],
            ]);
        }

        return response()->json([
            'message' => 'Email atau password salah.',
        ], 401);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Create tenant
        $tenant = Tenant::create([
            'name' => $data['tenant_name'],
            'slug' => $data['tenant_slug'],
            'logo_url' => null,
            'address' => null,
            'phone' => null,
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0,
            'is_active' => true,
        ]);

        // Create admin user
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $data['admin_name'],
            'email' => $data['admin_email'],
            'password' => Hash::make($data['password']),
            'role' => 'tenant_admin',
            'is_active' => true,
        ]);

        // Auto login after registration
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registrasi berhasil!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ],
        ], 201);
    }

    public function me(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user->load('tenant');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
                'slug' => $user->tenant->slug,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }
}

