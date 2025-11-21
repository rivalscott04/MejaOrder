# 03_frontend_ui_ux.md

Sistem: Aplikasi Pemesanan Makanan & Minuman Multi-Tenant Berbasis QR  
Fokus: Desain Frontend & UI/UX (Customer, Kasir, Admin)  
Catatan penting: **Frontend hanya kirim ID & qty ke backend, bukan harga.**

---

## 1. Prinsip Umum UI/UX

### 1.1. Warna & Tema

- **Background utama:** bukan putih murni (`#ffffff`), gunakan warna lembut:
  - `#f5f5f5` atau `#f4f4f5` (abu sangat muda, nyaman di mata).
- **Card & container:** putih (`#ffffff`) di atas background lembut.
- **Primary button (aksi utama):** hijau:
  - Normal: `#22c55e`
  - Hover: `#16a34a`
- **Secondary button:** border hijau, background abu muda / transparan.
- **Text:**
  - Utama: `#111827`
  - Sekunder: `#6b7280`
- **Border lembut:** `#e5e7eb`

> Implementasi gampang kalau pakai Tailwind: gunakan base seperti `bg-slate-50`, `bg-white`, `text-slate-900`, `text-slate-500`, `border-slate-200`, `bg-green-500` untuk button.

### 1.2. Layout & Spacing

- Customer view: mobile-first, max width container 640–768px.
- Dashboard: layout dua kolom (sidebar + content).
- Jaga whitespace:
  - Padding komponen: `1rem–1.5rem`.
  - Gap antar elemen: `0.75rem–1.25rem`.

### 1.3. Keamanan Data di Frontend

- Frontend **boleh menampilkan harga** (hasil hitungan dari backend).
- Tapi saat submit order:
  - **JANGAN** kirim harga apapun.
  - Hanya kirim:
    - `qr_token`
    - `menu_id`
    - `qty`
    - `option_item_ids`
    - catatan (opsional)
    - `payment_method`, `bank_choice` (opsional).

> Semua perhitungan harga di backend. Frontend hanya tampilan & input.

---

## 2. Halaman Customer (Setelah Scan QR)

### 2.1. Struktur Halaman

**URL:** `/o/{tenant_slug}/t/{qr_token}`

Bagian:

1. Header cafe & nomor meja.
2. Informasi singkat cara pesan.
3. Kategori menu (tab/pill).
4. List menu (card).
5. Bottom bar keranjang (sticky).
6. Halaman checkout + pilihan pembayaran.
7. Halaman status pesanan.

---

### 2.2. Header

Elemen:

- Logo kecil di kiri.
- Nama cafe.
- Badge/label: “Meja 12”.
- Subtext: “Pesan langsung dari meja ini, kasir akan memproses pesanannya.”

Style:

- Background bisa gradient halus dari abu ke hijau lembut.
- Text kontras, gunakan `text-slate-900`.

---

### 2.3. Kategori Menu

Komponen tab/pill horizontal:

- Scrollable jika banyak kategori.
- Tab aktif:
  - Background hijau muda (misal `bg-green-100`).
  - Text hijau tua (`text-green-700`).
- Tab tidak aktif:
  - Background abu muda (`bg-slate-100`).
  - Text abu (`text-slate-600`).

Interaksi:

- Klik tab → panggil API filter by `category_id` atau filter lokal di frontend.

---

### 2.4. Card Menu

Isi card:

- Gambar menu (ratio 4:3, rounded).
- Nama & harga.
- Deskripsi singkat (2 baris max dengan ellipsis).
- Badge:
  - “Best Seller” (opsional).
  - “Habis” (jika `is_available = false`).

Action:

- Jika tersedia → tombol hijau `Tambah`.
- Jika tidak → teks abu “Tidak tersedia” (disabled).

> Tombol `Tambah` membuka modal variasi jika menu punya optional group, atau langsung nambah ke keranjang (default config).

---

### 2.5. Modal Variasi Menu

Dibuka saat user klik `Tambah` pada menu yang punya options.

Isi modal:

1. Nama menu + harga base (hasil fetch dari backend).
2. Gambar (opsional).
3. List Option Group secara berurutan.

Contoh layout:

#### Temperature (wajib)
- ( ) Hot  
- (●) Iced  

#### Sugar Level
- ( ) No Sugar  
- (●) Less Sugar  
- ( ) Normal  
- ( ) Extra Sweet  

#### Ice Level
- ( ) No Ice  
- ( ) Less Ice  
- (●) Normal Ice  

#### Size
- ( ) Small  
- ( ) Medium (+3.000)  
- (●) Large (+5.000)  

#### Topping (multi)
- [x] Extra Shot (+5.000)  
- [ ] Whipped Cream (+4.000)  

#### Catatan
- Textarea: “Catatan untuk barista...”

Di bawah:

- Selector jumlah `[-] 1 [+]`  
- Ringkasan harga (informasi):
  - Boleh dihitung juga di frontend untuk user experience, **tapi** tetap hanya untuk tampilannya.
- Tombol:
  - Primary hijau: **“Tambah ke Keranjang”**
  - Secondary: “Batal” / icon close.

**Payload internal (keranjang):**

- Disimpan di state frontend sebagai:
  - `menu_id`
  - `qty`
  - `selected_option_item_ids` (array)
  - `item_note`
  - `display_price_estimation` (opsional, hanya untuk tampilan).

---

### 2.6. Bottom Bar Keranjang (Sticky)

Tampil jika keranjang tidak kosong.

Isi:

- Ikon keranjang + jumlah item.
- Estimasi total (boleh dihitung di frontend).
- Tombol hijau: **“Lanjut ke Pembayaran”**.

Contoh:

> 🧺 3 item · Rp 85.000  
> [ Lanjut ke Pembayaran ]

Behaviour:

- Sticky di bawah layar (`position: sticky` / `fixed bottom-0`).
- Responsive di mobile.

---

### 2.7. Halaman Checkout

Setelah klik `Lanjut ke Pembayaran`:

Bagian:

1. Ringkasan pesanan:
   - Meja, list item + variasi.
2. Pilih metode pembayaran.
3. Instruksi sesuai metode.
4. Tombol konfirmasi pesanan.

#### 2.7.1. Ringkasan Pesanan

- Tampilkan item:
  - Nama menu.
  - List variasi/opsi.
  - Qty.
- Tampilkan estimasi total (frontend) untuk informasi.

> Saat user klik “Konfirmasi Pesanan”, frontend **tidak** kirim field harga apa pun, hanya ID & qty.

#### 2.7.2. Pilih Metode Pembayaran

Tiga card besar:

- Cash
- Transfer
- QRIS

Masing-masing dengan ikon & deskripsi singkat.

Saat card dipilih:

- Border hijau (`border-green-500`).
- Background sedikit berbeda (`bg-slate-50`).

#### 2.7.3. Detail Per Metode

- **Cash:**
  - Info teks → bayar ke kasir.
- **Transfer:**
  - Dropdown bank (nama & last 4 no rek).
  - Tampilkan nomor rekening + tombol copy.
  - Input upload bukti (`type=file`).
- **QRIS:**
  - Tampilkan QR image (URL dari backend).
  - Checkbox: “Saya sudah melakukan pembayaran” → enable tombol konfirmasi.

---

### 2.8. Submit Order ke Backend

Saat user klik tombol **“Buat Pesanan”**:

- Payload ke backend:

```json
{
  "qr_token": "abc123token",
  "items": [
    {
      "menu_id": 10,
      "qty": 2,
      "item_note": "Tanpa sedotan plastik",
      "option_item_ids": [1, 5, 9]
    }
  ],
  "payment_method": "cash"
}
```

Tidak ada field harga di payload.

Jika perlu, dua langkah:

1. `POST /orders` tanpa upload bukti.
2. Jika `transfer` → `POST /orders/{order_code}/upload-proof` dengan file.

---

### 2.9. Halaman Status Pesanan

Setelah order sukses, backend kirim:

- `order_code`
- `order_status`
- `payment_status`
- `items`
- `total_amount`

Frontend:

- Tampilkan kode pesanan besar.
- Tampilkan status dengan badge & timeline.
- Lakukan polling GET `/orders/{order_code}` setiap 5–8 detik.

Timeline status:

1. Pesanan dibuat.
2. Pesanan diterima kasir.
3. Sedang disiapkan.
4. Siap diantar.
5. Selesai.

Badge:

- `pending` → abu.
- `accepted`, `preparing` → amber/kuning.
- `ready` → hijau muda.
- `completed` → hijau.
- `canceled` → merah.

---

## 3. Dashboard Kasir

### 3.1. Layout

- Sidebar kiri:
  - Logo tenant.
  - Menu: Dashboard, Pesanan, Riwayat.
- Konten:
  - Header (nama kasir, jam/shift).
  - Tabel daftar pesanan.

Background konten: `#f5f5f5` dengan card putih.

### 3.2. Daftar Pesanan

Tabel dengan kolom:

- Waktu (jam).
- No meja.
- Kode order.
- Total (display dari backend).
- Metode bayar (ikon).
- Status bayar (badge).
- Status order (badge).
- Aksi (button `Detail`).

Filter di atas:

- Dropdown status order.
- Dropdown status pembayaran.
- Search by kode / meja.

Auto refresh via polling atau WebSocket.

### 3.3. Detail Pesanan (Kasir)

Elemen:

- Header:
  - Kode order, meja, waktu.
- pembayaran:
  - Metode.
  - Status pembayaran.
  - Bukti bayar (jika ada).

- List item:
  - Nama.
  - Qty.
  - Variasi.
  - Subtotal (dari backend).

Action button:

- “Tandai Sudah Bayar” (untuk cash/transfer/QRIS).
- “Terima Pesanan”, “Sedang Disiapkan”, “Siap Diantar”, “Selesai”.

> Kasir hanya triggering API status, tidak pernah modifikasi angka harga.

---

## 4. Dashboard Admin Tenant

### 4.1. Halaman Menu

- Grid / tabel menu:
  - Gambar kecil.
  - Nama.
  - Kategori.
  - Harga.
  - Status available.
  - Aksi edit/hapus.

Form tambah/edit:

- Nama, deskripsi, kategori, harga.
- Upload gambar.
- Status tampil / tidak.

### 4.2. Halaman Variasi (Option Groups & Items)

UI sederhana:

- List Option Group:
  - Nama, tipe (single/multi), required.
  - Tombol “Edit” & “Hapus”.
- Dalam detail group:
  - List Option Item:
    - Label, extra price, status aktif.

Attach ke menu:

- Di halaman edit menu → Tab “Variasi/Opsi”.
- Checklist group yang akan diaktifkan untuk menu tersebut.

---

### 4.3. Halaman Meja & QR

- Tabel:
  - Nomor meja.
  - Status aktif.
  - Aksi: “Lihat QR”, “Nonaktifkan”.

Halaman “Lihat QR”:

- Tampilkan QR code dengan background putih & border lembut.
- Tombol:
  - Download PNG.
  - Print.

---

### 4.4. Halaman Subscription (Opsional di Tenant Panel)

- Card ringkasan subscription:
  - Plan name.
  - Status: Active/Expired.
  - Expiry date.
- Tombol:
  - “Perpanjang” (kalau integrasi payment).
  - “Hubungi Admin” (jika manual).

---

## 5. Dashboard Super Admin

- Halaman list tenant:
  - Nama, slug, status, plan, expiry.
- Halaman detail tenant:
  - Info kontak.
  - Ringkasan omzet (opsional).
  - Tombol set plan & ubah status subscription.

---

## 6. Responsiveness & Interaksi Kecil

- Customer:
  - Mobile first, tombol besar, minim teks panjang.
- Kasir & Admin:
  - Optimasi desktop, tapi tetap usable di tablet.

Interaksi:

- Loading state:
  - Skeleton untuk card menu.
  - Spinner pada tombol saat submit.
- Error:
  - Pesan di toast notification (top/right).

---

## 7. Ringkasan Aliran Data Frontend → Backend

### Customer Order

1. Load menu:
   - GET `/menus` → backend kirim list menu + harga + opsi.
2. User pilih menu & variasi → disimpan di state keranjang.
3. Checkout → frontend kirim:
   - `qr_token`
   - `items` berisi:
     - `menu_id`
     - `qty`
     - `option_item_ids`
     - `item_note`
   - `payment_method`, `bank_choice` (jika perlu).
4. Backend balas:
   - `order_code`
   - `total_amount` (hasil hitung backend).

### Frontend tidak pernah menjadi sumber kebenaran harga.  
Frontend hanya **display** angka yang dihitung backend.

## 8. Frontend rule
  - Semua menu harus responsive dan mengutamakan mobile first design
  - target pengguna adalah user mobile dan tablet
  - jangan pernah gunakan emoticon
  - gunakan lucide react icon versi 5
  - pastikan mobile first design

