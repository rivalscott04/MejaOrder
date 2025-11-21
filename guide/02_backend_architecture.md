# 02_backend_architecture.md

Sistem: Aplikasi Pemesanan Makanan & Minuman Multi-Tenant Berbasis QR  
Fokus: Arsitektur Backend (Laravel) + Subscription SaaS + Keamanan Harga

---

## 1. Tujuan Arsitektur

- Mendukung **multi-tenant** dengan 1 database (`tenant_id` di tiap record).
- Mendukung **role-based access**:
  - `super_admin`, `tenant_admin`, `cashier`.
- Menyediakan API & web routes untuk:
  - Customer (scan QR, order, lihat status).
  - Kasir (lihat pesanan, verifikasi pembayaran).
  - Admin tenant (kelola menu, meja, kasir, laporan, konfigurasi pembayaran).
  - Super admin (kelola tenant, plan, subscription).
- **Keamanan:**  
  - Frontend **hanya mengirim ID & qty** → `menu_id`, `option_item_id`, dll.  
  - Harga (`price`, `extra_price`) dan `total_amount` **selalu dihitung di backend** berdasarkan data database.
- **SaaS:**  
  - Tenant hanya bisa mengakses dashboard jika punya subscription aktif (`tenant_subscriptions`).

---

## 2. Struktur Modular

Contoh struktur folder (Laravel):

```text
app/
  Http/
    Controllers/
      SuperAdmin/
      Tenant/        # untuk admin tenant
      Cashier/
      Public/        # untuk customer QR
    Middleware/
      TenantContext.php
      RoleMiddleware.php
      CheckSubscription.php

  Models/
    Tenant.php
    User.php
    Table.php
    Category.php
    Menu.php
    OptionGroup.php
    OptionItem.php
    MenuOptionGroup.php
    Order.php
    OrderItem.php
    OrderItemOption.php
    Payment.php
    OrderLog.php
    Plan.php
    TenantSubscription.php
    SubscriptionInvoice.php (opsional)

  Services/
    Order/
      OrderService.php
      PaymentService.php
      OrderStatusService.php
    Tenant/
      TenantService.php
      SubscriptionService.php
    Menu/
      MenuService.php
    QR/
      QRService.php

routes/
  web.php
  api.php
```

---

## 3. Middleware

### 3.1. `TenantContext`

Tugas:
- Resolve `tenant` berdasarkan:
  - `tenant_slug` di URL untuk sisi public (customer).
  - `tenant_id` dari user login untuk dashboard tenant & kasir.
- Set helper global `tenant()` / `app('currentTenant')`.

Pseudo:

```php
public function handle($request, Closure $next)
{
    if ($request->route('tenant_slug')) {
        $tenant = Tenant::where('slug', $request->route('tenant_slug'))
            ->where('is_active', true)
            ->firstOrFail();
    } elseif (auth()->check() && auth()->user()->tenant_id) {
        $tenant = auth()->user()->tenant;
    } else {
        $tenant = null; // untuk super_admin atau public tertentu
    }

    app()->instance('currentTenant', $tenant);

    return $next($request);
}
```

---

### 3.2. `RoleMiddleware`

Tugas:
- Batasi akses berdasarkan role user.

Contoh penggunaan di route:

```php
Route::middleware(['auth', 'role:tenant_admin'])->group(function () {
    // route admin tenant
});
```

---

### 3.3. `CheckSubscription`

Tugas:
- Memastikan tenant punya subscription aktif sebelum boleh akses dashboard tenant/kasir.

Logika:

- Ambil `tenant` dari `TenantContext`.
- Cek di `tenant_subscriptions`:
  - `status = active`
  - `end_date >= today`
- Jika tidak memenuhi:
  - Redirect ke halaman “Subscription Expired”
  - atau return 403/402 JSON dengan pesan “Subscription inactive or expired”.

Pseudo:

```php
public function handle($request, Closure $next)
{
    $tenant = app('currentTenant');

    if (!$tenant) {
        abort(403, 'No tenant context');
    }

    $activeSub = TenantSubscription::where('tenant_id', $tenant->id)
        ->where('status', 'active')
        ->where('end_date', '>=', now()->toDateString())
        ->first();

    if (!$activeSub) {
        abort(402, 'Subscription inactive or expired');
    }

    return $next($request);
}
```

Middleware ini diaplikasikan untuk:

- Route `/tenant/...`
- Route `/cashier/...`

---

## 4. Modul & Endpoint Utama

### 4.1. Public (Customer) – via QR

**Prefix route:**  
- Web view: `/o/{tenant_slug}/t/{qr_token}`  
- API: `/api/public/{tenant_slug}/...`

> **Catatan:** Sisi customer cukup cek `tenant.is_active`.  
> Akses ini boleh tetap dibuka meskipun subscription expired (opsional, tergantung bisnis).  
> Atau juga bisa ikut dicek subscription kalau mau “lock” pemesanan saat tenant tidak bayar.

#### 4.1.1. GET `/o/{tenant_slug}/t/{qr_token}`

- Resolve:
  - `tenant` via `tenant_slug`
  - `table` via `tenant_id` + `qr_token` + `is_active = true`
- Render halaman frontend (Blade/SPA) untuk ordering.

#### 4.1.2. GET `/api/public/{tenant_slug}/tables/{qr_token}/menus`

- **Input:**
  - `tenant_slug`
  - `qr_token`
  - optional: `category_id`, `search`
- **Output:**
  - Info meja
  - List kategori
  - List menu + options **tanpa harga manipulatif dari client** (hanya display).

Digunakan frontend hanya untuk tampilan, bukan untuk menentukan harga di client.  
Perhitungan harga final tetap di backend saat order dibuat.

---

#### 4.1.3. POST `/api/public/{tenant_slug}/orders`

Endpoint utama untuk membuat pesanan.

> **VERY IMPORTANT (sesuai requirement):**  
> Payload dari frontend **TIDAK BOLEH** mengandung field harga (`price`, `extra_price`, `subtotal`, `total_amount`).  
> Hanya ID & qty yang boleh dikirim.

**Contoh Payload:**

```json
{
  "qr_token": "abc123token",
  "items": [
    {
      "menu_id": 10,
      "qty": 2,
      "item_note": "Tanpa sedotan plastik",
      "option_item_ids": [1, 5, 9]
    },
    {
      "menu_id": 12,
      "qty": 1,
      "option_item_ids": [2]
    }
  ],
  "payment_method": "transfer",
  "bank_choice": "BCA"
}
```

**Tidak ada** field harga dari frontend.

**Proses Backend (`OrderService::createOrder`)**:

1. Validasi `tenant` dan `table` dari `qr_token`.
2. Loop `items`:
   - Ambil `Menu` dari DB berdasarkan `menu_id` & `tenant_id`:
     - Jika tidak ditemukan / tidak available → error.
   - Ambil `OptionItem` berdasarkan `option_item_ids`:
     - Pastikan option_items masih aktif & milik tenant yang sama.
   - Hitung harga item:
     - `item_base_price = menu.price`
     - `options_extra = sum(option_item.extra_price)`
     - `subtotal = (item_base_price + options_extra) * qty`
3. Simpan:
   - `orders`: `total_amount` = sum semua subtotal.
   - `order_items`: `price_snapshot`, `subtotal`.
   - `order_item_options`: snapshot nama group, label, extra_price.
4. Set `payment_status`:
   - `cash` → `unpaid`
   - `transfer`, `qris` → `waiting_verification`.
5. Tulis `order_logs` (status `pending`).

**Output:**

- `order_code`
- Ringkasan pesanan yang sudah dihitung backend.

---

#### 4.1.4. POST `/api/public/{tenant_slug}/orders/{order_code}/upload-proof`

Untuk pembayaran `transfer` (upload bukti).

- **Input:**
  - File bukti (`multipart/form-data`)
- **Proses:**
  - Simpan file di storage.
  - Buat/update record di `payments`.
- **Output:**
  - Status sukses.

---

#### 4.1.5. GET `/api/public/{tenant_slug}/orders/{order_code}`

- Return status terkini:

```json
{
  "order_code": "A12-20251121-001",
  "payment_status": "waiting_verification",
  "order_status": "pending",
  "items": [
    {
      "name": "Latte",
      "qty": 1,
      "options": [
        "Iced",
        "Less Sugar",
        "Less Ice",
        "Size: Large (+5.000)",
        "Topping: Extra Shot (+5.000)"
      ],
      "subtotal": 35000
    }
  ],
  "total_amount": 35000
}
```

> `subtotal` & `total_amount` di sini berasal dari DB, bukan dari client.

Digunakan untuk polling status di UI customer.

---

## 5. Tenant Admin – Backend Panel

**Prefix route:**  
- Web: `/tenant`  
- API: `/api/tenant`  
Middleware: `auth`, `role:tenant_admin`, `TenantContext`, `CheckSubscription`

### 5.1. Manajemen Menu

- `GET /api/tenant/menus`
- `POST /api/tenant/menus`
- `PUT /api/tenant/menus/{id}`
- `DELETE /api/tenant/menus/{id}` (soft delete)
- `PATCH /api/tenant/menus/{id}/toggle-availability`

Field harga (`price`) hanya di-edit oleh admin tenant via panel ini, tidak oleh kasir/customer.

---

### 5.2. Manajemen Option Groups & Items

- `GET /api/tenant/options/groups`
- `POST /api/tenant/options/groups`
- `PUT /api/tenant/options/groups/{id}`
- `DELETE /api/tenant/options/groups/{id}`

- `GET /api/tenant/options/groups/{id}/items`
- `POST /api/tenant/options/groups/{id}/items`
- `PUT /api/tenant/options/items/{id}`
- `DELETE /api/tenant/options/items/{id}`

Relasi dengan menu:

- `POST /api/tenant/menus/{menu_id}/option-groups/attach`
  - Body: `option_group_ids: [1,2,3]`
- `POST /api/tenant/menus/{menu_id}/option-groups/detach`

> Harga extra variation (`extra_price`) juga dikonfigurasi di sini dan hanya digunakan backend saat hitung total.

---

### 5.3. Manajemen Meja & QR

- `GET /api/tenant/tables`
- `POST /api/tenant/tables`
  - Input: `table_number`
  - Sistem generate `qr_token` random.
- `PUT /api/tenant/tables/{id}`
- `DELETE /api/tenant/tables/{id}` (soft delete / set inactive)

- `GET /tenant/tables/{id}/qr` (web)
  - Render QR code untuk print.

`QRService`:

- Generate QR berisi URL:
  - `https://app.com/o/{tenant_slug}/t/{qr_token}`

---

### 5.4. Manajemen User Kasir

- `GET /api/tenant/users?role=cashier`
- `POST /api/tenant/users`
- `PUT /api/tenant/users/{id}`
- `PATCH /api/tenant/users/{id}/toggle-status`

Admin tenant tidak bisa mengubah role ke `super_admin`, hanya `cashier` atau `tenant_admin` di bawah tenant-nya.

---

### 5.5. Laporan & Statistik (Opsional)

- Ringkasan penjualan per hari/bulan.
- Omzet per metode pembayaran.
- Top selling menu.

Semua query harus di-scope ke `tenant_id` dari context.

---

## 6. Kasir – Dashboard Order

**Prefix route:**  
- Web: `/cashier`  
- API: `/api/cashier`  
Middleware: `auth`, `role:cashier|tenant_admin`, `TenantContext`, `CheckSubscription`

### 6.1. GET `/api/cashier/orders`

- Parameter filter:
  - `date`
  - `order_status`
  - `payment_status`
  - `table_number`
- Data dikembalikan dengan pagination.

### 6.2. GET `/api/cashier/orders/{order_id}`

- Detail order lengkap:
  - Meja, waktu, item, variasi, total.
  - Info pembayaran & bukti jika ada.

### 6.3. PATCH `/api/cashier/orders/{order_id}/status`

- Body: `{ "order_status": "preparing" }`
- Validasi transisi status menggunakan `OrderStatusService`.
- Simpan ke `order_logs`.

### 6.4. PATCH `/api/cashier/orders/{order_id}/payment-status`

- Untuk menandai:
  - `cash` → `paid`
  - `transfer`/`qris` → `paid` setelah verifikasi.

- Update:
  - `orders.payment_status`
  - `payments.verified_at`, `verified_by`

> Kasir **tidak bisa** mengubah `total_amount`. Mereka hanya verifikasi status.

---

## 7. Super Admin – Subscription & Tenant Management

**Prefix route:**  
- Web: `/admin`  
- API: `/api/admin`  
Middleware: `auth`, `role:super_admin`

### 7.1. Manajemen Tenant

- CRUD `tenants`:
  - Set `is_active` (opsional, untuk disable manual).
- Lihat ringkasan:
  - Jumlah order, omzet, status subscription.

### 7.2. Manajemen Plan

- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `PUT /api/admin/plans/{id}`
- `PATCH /api/admin/plans/{id}/toggle-active`

### 7.3. Manajemen Subscription Tenant

- `GET /api/admin/tenant-subscriptions`
- `POST /api/admin/tenant-subscriptions`
  - Input: `tenant_id`, `plan_id`, `start_date`, `end_date`, `status`
- `PUT /api/admin/tenant-subscriptions/{id}`

Opsional: integrasi payment gateway untuk otomasi billing.

---

## 8. Service Layer

### 8.1. `OrderService`

Tanggung jawab:

- Validasi menu & ketersediaan.
- Ambil harga & extra_price dari DB.
- Hitung total & simpan snapshot.
- Buat `orders`, `order_items`, `order_item_options`.

Signature contoh:

```php
class OrderService
{
    public function createOrder(Tenant $tenant, Table $table, array $payload): Order
    {
        // hanya konsumsi menu_id, qty, option_item_ids
    }
}
```

### 8.2. `PaymentService`

- Simpan pembayaran.
- Upload bukti (kalau transfer).
- Verifikasi pembayaran (update status & log).

### 8.3. `OrderStatusService`

- Menangani perubahan status order:
  - Validasi transisi (misal: tidak boleh lompat dari `pending` → `ready` langsung).
  - Log ke `order_logs`.

### 8.4. `SubscriptionService`

- Cek subscription aktif untuk tenant.
- Extend / renew subscription.
- Generate invoice (opsional).

---

## 9. Security & Best Practice

- Semua endpoint tenant/kasir:
  - Filter query by `tenant_id` dari user login.
- Semua endpoint customer (public):
  - Validasi `tenant_slug`, `qr_token`.
- **Anti manipulasi harga:**
  - Ignore semua field harga yang datang dari client (kalau ada).
  - Perhitungan selalu pakai tabel `menus` & `option_items`.
- Upload bukti pembayaran:
  - Validasi mime (`jpeg,png,webp,pdf`).
  - Limit size (misal 2MB).
- QR link:
  - `qr_token` random, tidak berurutan.

---

## 10. Alur Teknis End-to-End (Ringkas)

1. **Super Admin**:
   - Buat plan.
   - Buat tenant + assign plan + subscription active.

2. **Tenant Admin**:
   - Login → dicek subscription via middleware.
   - Setup kategori, menu, opsi variasi.
   - Setup meja + QR.
   - Tambah kasir.

3. **Customer**:
   - Scan QR → lihat menu.
   - Pilih menu + variasi → kirim `menu_id`, `option_item_ids`, `qty` saja.
   - Backend hitung total & simpan order.

4. **Kasir**:
   - Lihat daftar order.
   - Verifikasi pembayaran.
   - Update status pesanan sampai selesai.

5. **Tenant Admin / Super Admin**:
   - Melihat laporan & statistik berdasarkan data yang tersimpan di DB.
