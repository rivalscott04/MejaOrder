import { clsx } from "clsx";

type ClassValue = Parameters<typeof clsx>;

export function cn(...inputs: ClassValue) {
  return clsx(inputs);
}

export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format harga untuk input field dengan format Rp dan separator titik
 * @param price - Harga dalam bentuk number
 * @returns String dengan format "Rp. 1.000.000" atau "0" jika harga 0
 */
export function formatPriceInput(price: number): string {
  if (price === 0) return "0";
  return `Rp. ${price.toLocaleString("id-ID").replace(/,/g, ".")}`;
}

/**
 * Parse string harga dari input field menjadi number
 * Menghapus semua karakter non-digit (Rp, titik, dll)
 * @param value - String dari input field
 * @returns Number, atau 0 jika string kosong
 */
export function parsePriceInput(value: string): number {
  const numericValue = value.replace(/\D/g, "");
  return numericValue === "" ? 0 : Number(numericValue);
}

/**
 * Format harga untuk display dengan format Rp dan separator titik
 * @param price - Harga dalam bentuk number
 * @returns String dengan format "Rp. 1.000.000"
 */
export function formatPriceDisplay(price: number): string {
  return `Rp. ${price.toLocaleString("id-ID").replace(/,/g, ".")}`;
}

/**
 * Menghitung badge untuk menu berdasarkan created_at
 * @param created_at - Tanggal pembuatan menu (ISO string)
 * @returns Array of badge strings
 */
export function calculateMenuBadges(created_at: string): string[] {
  const badges: string[] = [];
  const createdDate = new Date(created_at);
  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  // Menu baru jika dibuat dalam 30 hari terakhir
  if (daysSinceCreated <= 30) {
    badges.push("Baru");
  }

  // Untuk "Terlaris" dan "Layak Dicoba", kita akan menggunakan logika sederhana
  // Di production, ini bisa dihitung dari data order atau rating
  // Untuk sekarang, kita akan menggunakan hash sederhana dari ID untuk konsistensi
  return badges;
}

/**
 * Menentukan apakah menu layak dicoba berdasarkan beberapa faktor
 * @param menuId - ID menu
 * @param created_at - Tanggal pembuatan
 * @returns boolean
 */
export function isRecommendedMenu(menuId: number, created_at: string): boolean {
  // Logika sederhana: menu dengan ID ganjil atau dibuat dalam 60 hari terakhir
  const createdDate = new Date(created_at);
  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return menuId % 3 === 0 || daysSinceCreated <= 60;
}

/**
 * Menentukan apakah menu terlaris (fallback function jika backend tidak menyediakan badges)
 * @param menuId - ID menu
 * @returns boolean
 * @deprecated Gunakan badges dari backend untuk hasil yang akurat
 */
export function isBestSellerMenu(menuId: number): boolean {
  // Fallback: logika sederhana jika backend tidak menyediakan badges
  // Seharusnya backend sudah menghitung dari data order_items
  return menuId % 2 === 0;
}

/**
 * Transform feature text dari format teknis ke user-friendly
 * @param feature - Feature text (bisa format teknis seperti "demo_mode" atau sudah user-friendly)
 * @returns User-friendly feature text
 */
export function formatFeatureText(feature: string): string {
  if (!feature) return feature;

  // Mapping untuk istilah teknis umum ke bahasa Indonesia yang user-friendly
  const featureMapping: Record<string, string> = {
    // Demo & Testing
    'demo_mode': 'Mode Demo',
    'demo': 'Mode Demo',
    
    // Limits
    'unlimited_menu': 'Menu Tidak Terbatas',
    'unlimited_users': 'User Tidak Terbatas',
    'unlimited_tables': 'Meja Tidak Terbatas',
    'unlimited_categories': 'Kategori Tidak Terbatas',
    'unlimited_orders': 'Order Tidak Terbatas',
    'limited_to_30_days': 'Terbatas 30 Hari',
    'limited_to_90_days': 'Terbatas 90 Hari',
    
    // User limits
    'up_to_5_users': 'Hingga 5 User',
    'up_to_10_users': 'Hingga 10 User',
    'up_to_20_users': 'Hingga 20 User',
    'up_to_50_users': 'Hingga 50 User',
    
    // Menu limits
    'up_to_10_menus': 'Hingga 10 Menu',
    'up_to_50_menus': 'Hingga 50 Menu',
    'up_to_100_menus': 'Hingga 100 Menu',
    
    // Features
    'kasir_dashboard': 'Dashboard Kasir',
    'tenant_dashboard': 'Dashboard Admin',
    'subscription_reporting': 'Laporan Subscription',
    'sales_reporting': 'Laporan Penjualan',
    'order_reporting': 'Laporan Order',
    'export_excel': 'Export ke Excel',
    'export_pdf': 'Export ke PDF',
    'qr_code_generation': 'Generate QR Code',
    'table_management': 'Manajemen Meja',
    'menu_management': 'Manajemen Menu',
    'category_management': 'Manajemen Kategori',
    'user_management': 'Manajemen User',
    'payment_integration': 'Integrasi Pembayaran',
    'qris_support': 'Support QRIS',
    'bank_transfer': 'Transfer Bank',
    'custom_domain': 'Custom Domain',
    'api_access': 'Akses API',
    'priority_support': 'Priority Support',
    'email_support': 'Email Support',
    'phone_support': 'Phone Support',
    'multi_outlet': 'Multi Outlet',
    'inventory_management': 'Manajemen Stok',
    'stock_tracking': 'Tracking Stok',
    'low_stock_alerts': 'Notifikasi Stok Menipis',
    'order_analytics': 'Analitik Order',
    'customer_analytics': 'Analitik Pelanggan',
    'revenue_analytics': 'Analitik Pendapatan',
    'daily_reports': 'Laporan Harian',
    'monthly_reports': 'Laporan Bulanan',
    'yearly_reports': 'Laporan Tahunan',
    'custom_reports': 'Laporan Custom',
    'data_export': 'Export Data',
    'backup_data': 'Backup Data',
    'restore_data': 'Restore Data',
  };

  // Cek apakah ada mapping langsung
  const lowerFeature = feature.toLowerCase().trim();
  if (featureMapping[lowerFeature]) {
    return featureMapping[lowerFeature];
  }

  // Cek apakah ada mapping dengan underscore (case-insensitive)
  const normalizedFeature = feature.toLowerCase().replace(/\s+/g, '_');
  if (featureMapping[normalizedFeature]) {
    return featureMapping[normalizedFeature];
  }

  // Jika tidak ada mapping, transform dari format teknis ke user-friendly
  // Contoh: "demo_mode" -> "Demo Mode", "unlimited_menu" -> "Unlimited Menu"
  if (feature.includes('_')) {
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Jika sudah dalam format yang baik, return as-is
  return feature;
}

/**
 * Format order code untuk display, maksimal 8-10 karakter
 * @param orderCode - Kode pesanan
 * @param maxLength - Panjang maksimal (default: 10)
 * @returns String dengan panjang maksimal yang ditentukan
 */
export function formatOrderCode(orderCode: string, maxLength: number = 10): string {
  if (!orderCode) return "";
  if (orderCode.length <= maxLength) return orderCode;
  return orderCode.substring(0, maxLength);
}

/**
 * Format error message menjadi pesan yang lebih ramah untuk user awam
 * @param error - Error object atau string
 * @param defaultMessage - Pesan default jika error tidak dapat diidentifikasi
 * @returns String dengan pesan error yang user-friendly
 */
export function formatUserFriendlyError(error: unknown, defaultMessage: string = "Terjadi kesalahan. Silakan coba lagi."): string {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Check for specific error messages first (these are already user-friendly)
    if (error.message.includes('Silakan login ulang') || error.message.includes('tidak memiliki izin')) {
      return error.message;
    }
    
    // 401/403 errors - prioritize these before CORS checks
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return "Sesi Anda telah berakhir. Silakan login ulang untuk melanjutkan.";
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return "Anda tidak memiliki izin untuk mengakses data ini.";
    }
    
    // Network errors (check before CORS to avoid false positives)
    if (errorMessage.includes('network error') || errorMessage.includes('gagal terhubung')) {
      return error.message; // Already user-friendly
    }
    
    if (errorMessage.includes('failed to fetch') || errorMessage.includes('err_failed')) {
      return "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.";
    }
    
    // CORS errors - only if explicitly mentioned (not from 401 responses)
    if (errorMessage.includes('cors') && !errorMessage.includes('401') && !errorMessage.includes('403')) {
      return "Terjadi masalah koneksi dengan server. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.";
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return "Waktu koneksi habis. Server mungkin sedang sibuk. Silakan coba lagi dalam beberapa saat.";
    }
    
    // 404 errors
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return "Data yang diminta tidak ditemukan. Silakan refresh halaman.";
    }
    
    // 500 errors
    if (errorMessage.includes('500') || errorMessage.includes('internal server')) {
      return "Terjadi kesalahan di server. Silakan coba lagi nanti atau hubungi administrator.";
    }
    
    // Return the error message if it's already user-friendly (in Indonesian)
    if (error.message && !error.message.includes('http') && !error.message.includes('api') && !error.message.includes('fetch')) {
      return error.message;
    }
  }
  
  // Handle TypeError (network/fetch errors)
  if (error instanceof TypeError) {
    return "Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil dan coba lagi.";
  }
  
  return defaultMessage;
}

