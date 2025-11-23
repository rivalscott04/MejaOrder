import * as XLSX from "xlsx";

export type ExportData = {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
};

/**
 * Export data ke Excel dengan multiple sheets
 */
export function exportToExcel(data: ExportData[], filename: string = "laporan.xlsx") {
  const workbook = XLSX.utils.book_new();

  data.forEach((sheet) => {
    // Buat worksheet dari data
    const worksheetData = [sheet.headers, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Styling header (optional - bisa ditambahkan jika perlu)
    // Set column widths
    const colWidths = sheet.headers.map((_, idx) => {
      const maxLength = Math.max(
        sheet.headers[idx].length,
        ...sheet.rows.map((row) => String(row[idx] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
  });

  // Download file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export single sheet Excel
 */
export function exportSingleSheetExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string = "laporan.xlsx",
  sheetName: string = "Sheet1"
) {
  exportToExcel([{ sheetName, headers, rows }], filename);
}

/**
 * Format tanggal untuk nama file
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Format currency untuk Excel (tanpa simbol, hanya angka)
 */
export function formatCurrencyForExcel(amount: number): number {
  return amount;
}

