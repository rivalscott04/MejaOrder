# 01_db_tables_schema.md

Sistem: Aplikasi Pemesanan Makanan & Minuman Multi-Tenant Berbasis QR  
Fokus: Skema Database & Relasi Tabel (dengan variasi & subscription SaaS)

---

## 1. Konsep Umum

- **Multi-tenant:** 1 platform, banyak tenant (cafe).
- **Role utama:**
  - `super_admin` → kelola tenant & platform
  - `tenant_admin` → kelola menu, meja, user kasir, laporan.
  - `cashier` → kelola pesanan & verifikasi pembayaran.
- **Customer:** tidak login, akses melalui QR per meja.
- **Variasi menu:** menggunakan konsep **Option Group & Option Item**:
  - Contoh group: Temperature, Sugar Level, Ice Level, Size, Topping.
- **Pembayaran:**
  - `cash`, `transfer`, `qris`
  - `transfer` & `qris` bisa ada upload bukti bayar.
- **SaaS / Subscription:** setiap tenant terikat ke plan berlangganan (bulanan/tahunan) dengan status aktif/tidak aktif.
- **Keamanan harga:** frontend **hanya mengirim** `id` (menu, option_item, qty, dsb).  
  Semua **harga & perhitungan** 100% dilakukan di backend berdasarkan data di database, sehingga tidak bisa dimanipulasi dari sisi client.

---

## 2. Daftar Tabel Utama (Tenant, User, Meja, Menu)

### 2.1. Tabel `tenants`

Informasi utama tiap cafe.

| Kolom        | Tipe         | Keterangan                                  |
|--------------|--------------|---------------------------------------------|
| id           | BIGINT PK    | Auto increment                              |
| name         | VARCHAR(150) | Nama cafe/tenant                            |
| slug         | VARCHAR(150) | Slug unik untuk URL                         |
| logo_url     | VARCHAR(255) | URL logo                                    |
| address      | TEXT         | Alamat cafe                                 |
| phone        | VARCHAR(50)  | Nomor kontak                                |
| timezone     | VARCHAR(50)  | Optional, default "Asia/Jakarta"            |
| is_active    | BOOLEAN      | Status aktif/nonaktif tenant (admin)        |
| created_at   | TIMESTAMP    |                                             |
| updated_at   | TIMESTAMP    |                                             |

Index:
- UNIQUE(`slug`)
- INDEX(`is_active`)

> **Catatan:** Akses tenant juga akan dicek ke tabel subscription, bukan hanya `is_active`.

---

### 2.2. Tabel `users`

User untuk semua role (super admin, tenant admin, kasir).

| Kolom        | Tipe         | Keterangan                                               |
|--------------|--------------|----------------------------------------------------------|
| id           | BIGINT PK    |                                                          |
| tenant_id    | BIGINT FK    | Nullable untuk `super_admin`                             |
| name         | VARCHAR(150) | Nama user                                                |
| email        | VARCHAR(150) | Unique                                                   |
| password     | VARCHAR(255) | Hash password                                            |
| role         | ENUM         | `super_admin`, `tenant_admin`, `cashier`                |
| is_active    | BOOLEAN      |                                                          |
| last_login_at| TIMESTAMP    | Nullable                                                 |
| created_at   | TIMESTAMP    |                                                          |
| updated_at   | TIMESTAMP    |                                                          |

Relasi:
- FK(`tenant_id`) → `tenants.id` (nullable)

Index:
- UNIQUE(`email`)

---

### 2.3. Tabel `tables` (Meja)

Daftar meja per tenant dan token QR.

| Kolom       | Tipe         | Keterangan                                         |
|-------------|--------------|----------------------------------------------------|
| id          | BIGINT PK    |                                                    |
| tenant_id   | BIGINT FK    |                                                    |
| table_number| VARCHAR(50)  | Bisa "1", "2", "A1", "VIP-1"                       |
| qr_token    | VARCHAR(100) | Token unik yang dipakai di URL QR                  |
| is_active   | BOOLEAN      |                                                    |
| created_at  | TIMESTAMP    |                                                    |
| updated_at  | TIMESTAMP    |                                                    |

Relasi:
- FK(`tenant_id`) → `tenants.id`

Index:
- UNIQUE(`tenant_id`, `qr_token`)
- INDEX(`tenant_id`, `table_number`)

---

### 2.4. Tabel `categories`

Kategori menu per tenant.

| Kolom       | Tipe         | Keterangan                          |
|-------------|--------------|-------------------------------------|
| id          | BIGINT PK    |                                     |
| tenant_id   | BIGINT FK    |                                     |
| name        | VARCHAR(100) | Contoh: Makanan, Minuman, Dessert   |
| sort_order  | INT          | Urutan tampil                       |
| created_at  | TIMESTAMP    |                                     |
| updated_at  | TIMESTAMP    |                                     |

Relasi:
- FK(`tenant_id`) → `tenants.id`

---

### 2.5. Tabel `menus`

Menu makanan/minuman/dessert.

| Kolom        | Tipe           | Keterangan                                  |
|--------------|----------------|---------------------------------------------|
| id           | BIGINT PK      |                                             |
| tenant_id    | BIGINT FK      |                                             |
| category_id  | BIGINT FK      |                                             |
| name         | VARCHAR(150)   | Nama menu                                   |
| description  | TEXT           | Deskripsi menu                              |
| price        | DECIMAL(12,2)  | Harga dasar (disimpan & dihitung di backend)|
| image_url    | VARCHAR(255)   | Gambar menu                                 |
| is_available | BOOLEAN        | Aktif/tidak                                 |
| stock        | INT NULL       | Boleh null kalau tidak kelola stok          |
| sku          | VARCHAR(50)    | Optional, kode menu                         |
| created_at   | TIMESTAMP      |                                             |
| updated_at   | TIMESTAMP      |                                             |

Relasi:
- FK(`tenant_id`) → `tenants.id`
- FK(`category_id`) → `categories.id`

Index:
- INDEX(`tenant_id`, `is_available`)
- INDEX(`tenant_id`, `category_id`)

> **Keamanan:** `price` **tidak pernah** dikirim dari frontend saat membuat order. Frontend hanya kirim `menu_id`. Backend akan ambil `price` dari tabel ini.

---

## 3. Skema Variasi (Options)

### 3.1. Tabel `option_groups`

Group variasi (Temperature, Sugar Level, Ice Level, Size, Topping).

| Kolom       | Tipe           | Keterangan                                                |
|-------------|----------------|-----------------------------------------------------------|
| id          | BIGINT PK      |                                                           |
| tenant_id   | BIGINT FK      |                                                           |
| name        | VARCHAR(100)   | Misal: "Temperature", "Sugar Level"                       |
| type        | ENUM           | `single_choice`, `multi_choice`                          |
| is_required | BOOLEAN        | True jika wajib dipilih (misal mesti pilih panas/dingin) |
| min_select  | INT NULL       | Minimal pilihan (untuk multi_choice)                      |
| max_select  | INT NULL       | Maksimal pilihan                                           |
| sort_order  | INT            | Urutan tampil                                             |
| created_at  | TIMESTAMP      |                                                           |
| updated_at  | TIMESTAMP      |                                                           |

Relasi:
- FK(`tenant_id`) → `tenants.id`

---

### 3.2. Tabel `option_items`

Pilihan di dalam group.

| Kolom           | Tipe           | Keterangan                                     |
|-----------------|----------------|-----------------------------------------------|
| id              | BIGINT PK      |                                               |
| option_group_id | BIGINT FK      |                                               |
| label           | VARCHAR(100)   | Contoh: "Hot", "Iced", "Less Sugar"           |
| extra_price     | DECIMAL(12,2)  | Tambahan harga (bisa 0.00)                    |
| sort_order      | INT            |                                               |
| is_active       | BOOLEAN        |                                               |
| created_at      | TIMESTAMP      |                                               |
| updated_at      | TIMESTAMP      |                                               |

Relasi:
- FK(`option_group_id`) → `option_groups.id`

> **Keamanan:** frontend hanya kirim `option_item_id` yang dipilih. Backend akan ambil `extra_price` dari tabel ini.

---

### 3.3. Tabel `menu_option_groups`

Relasi menu ↔ option_group (karena tidak semua menu pakai semua group).

| Kolom           | Tipe        | Keterangan                       |
|-----------------|-------------|----------------------------------|
| id              | BIGINT PK   |                                  |
| menu_id         | BIGINT FK   |                                  |
| option_group_id | BIGINT FK   |                                  |

Relasi:
- FK(`menu_id`) → `menus.id`
- FK(`option_group_id`) → `option_groups.id`

Index:
- UNIQUE(`menu_id`, `option_group_id`)

---

## 4. Skema Pesanan & Pembayaran

### 4.1. Tabel `orders`

Header pesanan per meja.

| Kolom           | Tipe           | Keterangan                                                   |
|-----------------|----------------|--------------------------------------------------------------|
| id              | BIGINT PK      |                                                              |
| tenant_id       | BIGINT FK      |                                                              |
| table_id        | BIGINT FK      |                                                              |
| order_code      | VARCHAR(50)    | Kode unik, misal: CAFE12-20251121-001                       |
| total_amount    | DECIMAL(12,2)  | Total harga (termasuk variasi & topping)                    |
| payment_method  | ENUM           | `cash`, `transfer`, `qris`                                   |
| payment_status  | ENUM           | `unpaid`, `waiting_verification`, `paid`, `failed`, `refunded` |
| order_status    | ENUM           | `pending`, `accepted`, `preparing`, `ready`, `completed`, `canceled` |
| customer_note   | TEXT NULL      | Catatan umum pesanan                                        |
| created_at      | TIMESTAMP      |                                                              |
| updated_at      | TIMESTAMP      |                                                              |

Relasi:
- FK(`tenant_id`) → `tenants.id`
- FK(`table_id`) → `tables.id`

Index:
- INDEX(`tenant_id`, `created_at`)
- INDEX(`order_code`)

---

### 4.2. Tabel `order_items`

Detail item di dalam pesanan.

| Kolom                 | Tipe           | Keterangan                                         |
|-----------------------|----------------|----------------------------------------------------|
| id                    | BIGINT PK      |                                                    |
| order_id              | BIGINT FK      |                                                    |
| menu_id               | BIGINT FK      |                                                    |
| menu_name_snapshot    | VARCHAR(150)   | Nama menu saat transaksi                           |
| price_snapshot        | DECIMAL(12,2)  | Harga dasar saat transaksi (diambil dari `menus`)  |
| qty                   | INT            | Jumlah                                             |
| subtotal              | DECIMAL(12,2)  | Harga total item termasuk variasi                  |
| item_note             | TEXT NULL      | Catatan khusus item                                |
| created_at            | TIMESTAMP      |                                                    |
| updated_at            | TIMESTAMP      |                                                    |

Relasi:
- FK(`order_id`) → `orders.id`
- FK(`menu_id`) → `menus.id`

> **Catatan:** `price_snapshot` selalu dihitung di backend pada saat order dibuat. Frontend tidak pernah mengirim nilai ini.

---

### 4.3. Tabel `order_item_options`

Pilihan variasi actual per item.

| Kolom                      | Tipe           | Keterangan                                                |
|----------------------------|----------------|-----------------------------------------------------------|
| id                         | BIGINT PK      |                                                           |
| order_item_id              | BIGINT FK      |                                                           |
| option_group_name_snapshot | VARCHAR(100)   | Contoh: "Sugar Level"                                    |
| option_item_label_snapshot | VARCHAR(100)   | Contoh: "Less Sugar"                                     |
| extra_price_snapshot       | DECIMAL(12,2)  | Tambahan harga saat transaksi                             |
| created_at                 | TIMESTAMP      |                                                           |
| updated_at                 | TIMESTAMP      |                                                           |

Relasi:
- FK(`order_item_id`) → `order_items.id`

> Snapshot diambil dari `option_groups` dan `option_items` pada saat order dibuat.

---

### 4.4. Tabel `payments`

Detail pembayaran per order (bisa 1:1, disiapkan untuk multi pembayaran).

| Kolom        | Tipe           | Keterangan                                             |
|--------------|----------------|--------------------------------------------------------|
| id           | BIGINT PK      |                                                        |
| order_id     | BIGINT FK      |                                                        |
| amount       | DECIMAL(12,2)  | Jumlah yang dibayar                                   |
| method       | ENUM           | `cash`, `transfer`, `qris`                            |
| bank_name    | VARCHAR(100)   | Bank tujuan (kalau transfer)                          |
| account_number | VARCHAR(100) | Rekening tujuan (opsional)                            |
| proof_url    | VARCHAR(255)   | URL bukti transfer/foto                                |
| note         | TEXT NULL      | Catatan verifikasi                                     |
| created_at   | TIMESTAMP      | Waktu submit pembayaran                                |
| verified_at  | TIMESTAMP NULL | Waktu diverifikasi kasir                               |
| verified_by  | BIGINT FK NULL | ID user (kasir/admin tenant) yang verifikasi          |

Relasi:
- FK(`order_id`) → `orders.id`
- FK(`verified_by`) → `users.id`

---

## 5. Logging & Audit

### 5.1. Tabel `order_logs`

Log perubahan status order.

| Kolom       | Tipe          | Keterangan                                        |
|-------------|---------------|---------------------------------------------------|
| id          | BIGINT PK     |                                                   |
| order_id    | BIGINT FK     |                                                   |
| user_id     | BIGINT FK     | Nullable, bisa null jika di-trigger oleh customer |
| from_status | VARCHAR(50)   | Status awal                                       |
| to_status   | VARCHAR(50)   | Status akhir                                      |
| note        | TEXT NULL     | Catatan (misal alasan cancel)                     |
| created_at  | TIMESTAMP     |                                                   |

Relasi:
- FK(`order_id`) → `orders.id`
- FK(`user_id`) → `users.id`

---

## 6. Skema Subscription (SaaS)

### 6.1. Tabel `plans` (Paket Berlangganan)

| Kolom            | Tipe           | Keterangan                                       |
|------------------|----------------|--------------------------------------------------|
| id               | BIGINT PK      |                                                  |
| name             | VARCHAR(100)   | Nama plan, misal: Basic, Pro, Enterprise        |
| description      | TEXT           | Deskripsi singkat                                |
| price_monthly    | DECIMAL(12,2)  | Harga per bulan                                  |
| price_yearly     | DECIMAL(12,2)  | Harga per tahun (opsional)                       |
| max_tenants      | INT NULL       | Kalau dipakai multi-org, optional                |
| max_users        | INT NULL       | Batas user per tenant (opsional)                 |
| max_menus        | INT NULL       | Batas menu per tenant (opsional)                 |
| features_json    | JSON NULL      | List fitur yang di-enable                        |
| is_active        | BOOLEAN        | Plan aktif/tidak                                 |
| created_at       | TIMESTAMP      |                                                  |
| updated_at       | TIMESTAMP      |                                                  |

---

### 6.2. Tabel `tenant_subscriptions`

Status langganan per tenant.

| Kolom            | Tipe           | Keterangan                                         |
|------------------|----------------|----------------------------------------------------|
| id               | BIGINT PK      |                                                    |
| tenant_id        | BIGINT FK      |                                                    |
| plan_id          | BIGINT FK      |                                                    |
| status           | ENUM           | `active`, `expired`, `canceled`, `trial`          |
| start_date       | DATE           |                                                    |
| end_date         | DATE           | Tanggal berakhir (harus lebih besar/ = hari ini   |
| is_auto_renew    | BOOLEAN        | Apakah auto perpanjang                             |
| created_at       | TIMESTAMP      |                                                    |
| updated_at       | TIMESTAMP      |                                                    |

Relasi:
- FK(`tenant_id`) → `tenants.id`
- FK(`plan_id`) → `plans.id`

Index:
- INDEX(`tenant_id`, `status`)
- INDEX(`end_date`)

> **Catatan:** Akses dashboard tenant & kasir **wajib** cek bahwa ada subscription dengan `status = active` dan `end_date >= today`.

---

### 6.3. Tabel `subscription_invoices` (Opsional)

Jika ingin tracking pembayaran langganan:

| Kolom            | Tipe           | Keterangan                                 |
|------------------|----------------|--------------------------------------------|
| id               | BIGINT PK      |                                            |
| tenant_id        | BIGINT FK      |                                            |
| plan_id          | BIGINT FK      |                                            |
| amount           | DECIMAL(12,2)  | Jumlah tagihan                             |
| period_start     | DATE           |                                            |
| period_end       | DATE           |                                            |
| status           | ENUM           | `unpaid`, `paid`, `canceled`               |
| paid_at          | TIMESTAMP NULL |                                            |
| created_at       | TIMESTAMP      |                                            |
| updated_at       | TIMESTAMP      |                                            |

---

## 7. Index & Performance

- Semua tabel yang punya `tenant_id`:
  - `INDEX(tenant_id, created_at)` untuk laporan.
- `orders`:
  - `INDEX(tenant_id, order_status)`
  - `INDEX(tenant_id, payment_status)`
- `tables`:
  - `INDEX(tenant_id, table_number)`
- `tenant_subscriptions`:
  - `INDEX(tenant_id, status, end_date)`

---

## 8. Ringkasan Relasi

- `tenants` 1 - N `users`
- `tenants` 1 - N `tables`
- `tenants` 1 - N `categories`
- `tenants` 1 - N `menus`
- `tenants` 1 - N `option_groups`
- `option_groups` 1 - N `option_items`
- `menus` N - N `option_groups` via `menu_option_groups`
- `tables` 1 - N `orders`
- `orders` 1 - N `order_items`
- `order_items` 1 - N `order_item_options`
- `orders` 1 - N `payments`
- `orders` 1 - N `order_logs`
- `plans` 1 - N `tenant_subscriptions`
- `tenants` 1 - N `tenant_subscriptions`
- `tenants` 1 - N `subscription_invoices` (opsional)
