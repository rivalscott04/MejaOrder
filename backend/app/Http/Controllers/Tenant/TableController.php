<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreTableRequest;
use App\Http\Requests\Tenant\UpdateTableRequest;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TableController extends Controller
{
    public function index(): JsonResponse
    {
        $tables = Table::query()
            ->where('tenant_id', tenant()->id)
            ->latest()
            ->paginate(20);

        return response()->json($tables);
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $tenant = tenant();

        $table = Table::query()->create([
            'tenant_id' => $tenant->id,
            'table_number' => $request->validated('table_number'),
            'description' => $request->validated('description'),
            'qr_token' => Str::random(24),
            'is_active' => true,
        ]);

        return response()->json($table, 201);
    }

    public function update(UpdateTableRequest $request, Table $table): JsonResponse
    {
        $this->authorizeTable($table);
        $table->update($request->validated());

        return response()->json($table);
    }

    public function destroy(Table $table): JsonResponse
    {
        $this->authorizeTable($table);

        $table->is_active = false;
        $table->save();

        return response()->json(['message' => 'Table deactivated.']);
    }

    public function regenerateQr(Table $table): JsonResponse
    {
        $this->authorizeTable($table);

        $table->qr_token = Str::random(24);
        $table->save();

        return response()->json(['qr_token' => $table->qr_token]);
    }

    public function printQr(Request $request, Table $table)
    {
        $this->authorizeTable($table);

        $tenant = tenant();
        $frontendUrl = $this->getFrontendUrl($request);
        $qrUrl = $frontendUrl . "/o/{$tenant->slug}/t/{$table->qr_token}";

        // Generate QR code using SimpleSoftwareIO/simple-qrcode or similar
        // For now, return JSON with QR URL and data for frontend to generate
        return response()->json([
            'table_number' => $table->table_number,
            'qr_token' => $table->qr_token,
            'qr_url' => $qrUrl,
            'tenant_name' => $tenant->name,
        ]);
    }

    public function downloadQr(Request $request, Table $table)
    {
        $this->authorizeTable($table);

        $tenant = tenant();
        $frontendUrl = $this->getFrontendUrl($request);
        $qrUrl = $frontendUrl . "/o/{$tenant->slug}/t/{$table->qr_token}";

        // Generate QR code image
        try {
            $qrCode = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')
                ->size(400)
                ->generate($qrUrl);

            return response($qrCode, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', "attachment; filename=\"qr-table-{$table->table_number}.png\"");
        } catch (\Exception $e) {
            // Fallback: return JSON if QR library not available
            return response()->json([
                'table_number' => $table->table_number,
                'qr_token' => $table->qr_token,
                'qr_url' => $qrUrl,
                'tenant_name' => $tenant->name,
                'error' => 'QR code library not available. Please install simple-qrcode package.',
            ], 200);
        }
    }

    /**
     * Get frontend URL dynamically from request or environment
     */
    protected function getFrontendUrl(Request $request): string
    {
        // Priority 1: Check config (from FRONTEND_URL env variable)
        if ($frontendUrl = config('app.frontend_url')) {
            return rtrim($frontendUrl, '/');
        }

        // Priority 2: Get from Origin header (for CORS requests)
        if ($origin = $request->header('Origin')) {
            return rtrim($origin, '/');
        }

        // Priority 3: Get from Referer header
        if ($referer = $request->header('Referer')) {
            $parsedUrl = parse_url($referer);
            if (isset($parsedUrl['scheme']) && isset($parsedUrl['host'])) {
                $port = isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '';
                return $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . $port;
            }
        }

        // Priority 4: Use APP_URL as fallback
        return rtrim(config('app.url'), '/');
    }

    protected function authorizeTable(Table $table): void
    {
        if ($table->tenant_id !== tenant()->id) {
            abort(403);
        }
    }
}

