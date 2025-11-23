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
PORT=3000
```

**Catatan:** Variable `PORT` opsional, default adalah 3000. Jika ingin menggunakan port lain, tambahkan `PORT=<port_number>`.

### 3. Pastikan Backend Berjalan

Pastikan backend Laravel sudah berjalan di `http://localhost:8000`. Jika backend menggunakan port lain, sesuaikan `NEXT_PUBLIC_BACKEND_URL` di `.env.local`.

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000 (atau port yang di-set di `PORT` environment variable)

## Setup Production

### 1. Konfigurasi Environment Variables

Buat file `.env.production` atau set environment variables di platform deployment Anda:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NODE_ENV=production
PORT=3000
```

**Penting:**
- Variable `NEXT_PUBLIC_BACKEND_URL` wajib diisi dengan URL backend production
- Variable `PORT` opsional, default adalah 3000. Set sesuai kebutuhan di production
- Gunakan HTTPS untuk production
- Pastikan backend sudah dikonfigurasi CORS untuk menerima request dari domain frontend

### 2. Build Aplikasi

```bash
npm run build:prod
```

### 3. Deploy

**Platform Managed (Vercel/Netlify):**
- Tidak perlu start manual, platform akan handle secara otomatis
- Set environment variables di dashboard platform
- Deploy menggunakan CLI atau connect repository

**Server Sendiri (VPS/Dedicated Server):**
- **Perlu di-start** dengan `npm run start` setelah build
- Set environment variables di file `.env.production` atau export manual
- Disarankan menggunakan process manager seperti PM2 untuk keep alive

**Cara Deploy di Server Sendiri:**

1. Build aplikasi:
```bash
npm run build:prod
```

2. Start aplikasi:
```bash
# Menggunakan file .env.production
npm run start

# Atau set environment variables manual
export NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
export NODE_ENV=production
export PORT=3000
npm run start
```

3. Menggunakan PM2 (recommended untuk production):
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start npm --name "mejaorder-frontend" -- start

# Atau dengan environment variables
pm2 start npm --name "mejaorder-frontend" -- start --env production

# PM2 akan otomatis membaca .env.production jika menggunakan --env production
```

**Catatan:**
- Next.js perlu di-start di server sendiri karena aplikasi ini menggunakan Server-Side Rendering (SSR)
- Untuk platform seperti Vercel, tidak perlu start karena mereka handle sebagai serverless functions
- Pastikan Node.js terinstall di server dan versi sesuai dengan requirement

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

### Mengubah Port Aplikasi

Untuk mengubah port aplikasi, set environment variable `PORT`:

**Development:**
Tambahkan di `.env.local`:
```env
PORT=3001
```

**Production:**
Tambahkan di `.env.production` atau set di platform deployment:
```env
PORT=3001
```

Next.js akan otomatis membaca `PORT` dari environment variable. Jika tidak di-set, default port adalah 3000.
