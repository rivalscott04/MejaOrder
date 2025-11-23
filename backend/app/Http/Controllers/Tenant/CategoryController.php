<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $tenant = tenant();

        $categories = Category::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $tenant = tenant();

        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $tenant = tenant();

        // Ensure category belongs to tenant
        if ($category->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $category->update([
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? $category->sort_order,
        ]);

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $tenant = tenant();

        // Ensure category belongs to tenant
        if ($category->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        // Check if category has menus
        if ($category->menus()->count() > 0) {
            return response()->json([
                'message' => 'Tidak dapat menghapus kategori yang masih memiliki menu. Silakan hapus atau pindahkan menu terlebih dahulu.'
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}

