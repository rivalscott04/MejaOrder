<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreOptionGroupRequest;
use App\Http\Requests\Tenant\StoreOptionItemRequest;
use App\Http\Requests\Tenant\UpdateOptionGroupRequest;
use App\Http\Requests\Tenant\UpdateOptionItemRequest;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use Illuminate\Http\JsonResponse;

class OptionGroupController extends Controller
{
    public function index(): JsonResponse
    {
        $groups = OptionGroup::query()
            ->with('optionItems')
            ->where('tenant_id', tenant()->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json($groups);
    }

    public function store(StoreOptionGroupRequest $request): JsonResponse
    {
        $group = OptionGroup::query()->create(array_merge(
            $request->validated(),
            ['tenant_id' => tenant()->id]
        ));

        return response()->json($group, 201);
    }

    public function update(UpdateOptionGroupRequest $request, OptionGroup $optionGroup): JsonResponse
    {
        $this->authorizeGroup($optionGroup);
        $optionGroup->update($request->validated());

        return response()->json($optionGroup);
    }

    public function destroy(OptionGroup $optionGroup): JsonResponse
    {
        $this->authorizeGroup($optionGroup);
        $optionGroup->delete();

        return response()->json(['message' => 'Option group deleted.']);
    }

    public function storeItem(StoreOptionItemRequest $request, OptionGroup $optionGroup): JsonResponse
    {
        $this->authorizeGroup($optionGroup);

        $item = $optionGroup->optionItems()->create($request->validated());

        return response()->json($item, 201);
    }

    public function updateItem(UpdateOptionItemRequest $request, OptionItem $optionItem): JsonResponse
    {
        $this->authorizeItem($optionItem);

        $optionItem->update($request->validated());

        return response()->json($optionItem);
    }

    public function destroyItem(OptionItem $optionItem): JsonResponse
    {
        $this->authorizeItem($optionItem);
        $optionItem->delete();

        return response()->json(['message' => 'Option item deleted.']);
    }

    protected function authorizeGroup(OptionGroup $optionGroup): void
    {
        if ($optionGroup->tenant_id !== tenant()->id) {
            abort(403);
        }
    }

    protected function authorizeItem(OptionItem $optionItem): void
    {
        $optionItem->loadMissing('group');

        if ($optionItem->group->tenant_id !== tenant()->id) {
            abort(403);
        }
    }
}

