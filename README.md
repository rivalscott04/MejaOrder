# MejaOrder - Frontend Application

Aplikasi frontend untuk sistem pemesanan makanan berbasis Next.js 16 dengan TypeScript dan Tailwind CSS. Aplikasi ini terhubung dengan backend Laravel untuk mengelola pemesanan, menu, dan transaksi.

## Persyaratan

- Node.js 18 atau lebih baru
- npm, yarn, pnpm, atau bun
- Backend Laravel yang sudah berjalan (lihat `backend/README.md`)

## Setup Local

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Environment Variables

Buat file `.env.local` di root direktori dengan isi berikut:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NODE_ENV=development
```

### 3. Pastikan Backend Berjalan

Pastikan backend Laravel sudah berjalan di `http://localhost:8000`. Jika backend menggunakan port lain, sesuaikan `NEXT_PUBLIC_BACKEND_URL` di `.env.local`.

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## Setup Production

### 1. Konfigurasi Environment Variables

Buat file `.env.production` atau set environment variables di platform deployment Anda:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Penting:**
- Variable `NEXT_PUBLIC_BACKEND_URL` wajib diisi dengan URL backend production
- Gunakan HTTPS untuk production
- Pastikan backend sudah dikonfigurasi CORS untuk menerima request dari domain frontend

### 2. Build Aplikasi

```bash
npm run build:prod
```

### 3. Deploy

**Vercel:**
- Set environment variables di Vercel Dashboard (Settings > Environment Variables)
- Deploy menggunakan Vercel CLI atau connect repository ke Vercel

**Server Manual:**
```bash
export NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
export NODE_ENV=production
npm run start
```

## Scripts

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run build:prod` - Build dengan NODE_ENV=production (recommended)
- `npm run start` - Menjalankan production server
- `npm run lint` - Menjalankan ESLint

## Troubleshooting

### Backend Tidak Terhubung

Jika muncul error "Backend URL not configured" atau "Failed to fetch":

1. Pastikan backend Laravel berjalan di `http://localhost:8000`
2. Cek nilai `NEXT_PUBLIC_BACKEND_URL` di file `.env.local`
3. Restart development server setelah mengubah `.env.local`
4. Pastikan CORS di backend sudah dikonfigurasi untuk menerima request dari frontend

### Environment Variables Tidak Terdeteksi

Jika environment variables tidak terbaca:

1. Pastikan file `.env.local` ada di root direktori (sama level dengan `package.json`)
2. Restart development server setelah mengubah `.env.local`
3. Untuk production, pastikan environment variables di-set di platform deployment
4. Variable harus diawali dengan `NEXT_PUBLIC_` untuk bisa diakses di browser
