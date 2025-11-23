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

