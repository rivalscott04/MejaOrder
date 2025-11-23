"use client";

import { useState, useEffect } from "react";
import { X, Printer } from "lucide-react";
import QRCode from "qrcode";
import type { Table, PrintQrResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// @ts-ignore - qrcode types might not be perfect
const QRCodeLib = QRCode.default || QRCode;

type QrPrintAllModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  tenantName: string;
  tenantSlug: string;
  onGetQrData?: (tableId: number) => Promise<PrintQrResponse>;
};

type QrItem = {
  table: Table;
  qrDataUrl: string | null;
  qrUrl: string;
  tableNumber: string;
};

type LayoutOption = 1 | 4 | 8;

export function QrPrintAllModal({
  isOpen,
  onClose,
  tables,
  tenantName,
  tenantSlug,
  onGetQrData,
}: QrPrintAllModalProps) {
  const [layout, setLayout] = useState<LayoutOption>(4);
  const [qrItems, setQrItems] = useState<QrItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  useEffect(() => {
    if (isOpen && tables.length > 0) {
      generateAllQrCodes();
    } else if (!isOpen) {
      // Reset when modal closes
      setQrItems([]);
      setGeneratedCount(0);
      setIsGenerating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generateAllQrCodes = async () => {
    if (tables.length === 0) return;
    
    setIsGenerating(true);
    setGeneratedCount(0);
    setQrItems([]);
    
    const items: QrItem[] = [];
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      let qrUrl = "";
      let tableNumber = table.table_number;

      try {
        if (onGetQrData) {
          const qrData = await onGetQrData(table.id);
          qrUrl = qrData.qr_url;
          tableNumber = qrData.table_number;
        } else {
          qrUrl = `${baseUrl}/o/${tenantSlug}/t/${table.qr_token}`;
        }

        const dataUrl = await QRCodeLib.toDataURL(qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        items.push({
          table,
          qrDataUrl: dataUrl,
          qrUrl,
          tableNumber,
        });

        setGeneratedCount(i + 1);
      } catch (err) {
        console.error(`Failed to generate QR code for table ${table.table_number}:`, err);
        items.push({
          table,
          qrDataUrl: null,
          qrUrl: qrUrl || `${baseUrl}/o/${tenantSlug}/t/${table.qr_token}`,
          tableNumber,
        });
        setGeneratedCount(i + 1);
      }
    }

    setQrItems(items);
    setIsGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getGridClass = (layout: LayoutOption): string => {
    switch (layout) {
      case 1:
        return "grid-cols-1";
      case 4:
        return "grid-cols-2";
      case 8:
        return "grid-cols-4";
      default:
        return "grid-cols-2";
    }
  };

  const getQrSizeClass = (layout: LayoutOption): string => {
    switch (layout) {
      case 1:
        return "h-96 w-96";
      case 4:
        return "h-48 w-48";
      case 8:
        return "h-32 w-32";
      default:
        return "h-48 w-48";
    }
  };

  const getTextSizeClass = (layout: LayoutOption): string => {
    switch (layout) {
      case 1:
        return "text-2xl";
      case 4:
        return "text-lg";
      case 8:
        return "text-sm";
      default:
        return "text-lg";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6 z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Print Semua QR Code</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isGenerating
                  ? `Generating ${generatedCount}/${tables.length} QR codes...`
                  : `${tables.length} QR codes ready to print`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Layout Selection */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Layout per Halaman
              </label>
              <div className="flex gap-3">
                {([1, 4, 8] as LayoutOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setLayout(option)}
                    className={cn(
                      "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition",
                      layout === option
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {option} QR per Halaman
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
                  <p className="text-sm text-slate-600">
                    Generating QR codes... {generatedCount}/{tables.length}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-600">Preview Layout:</p>
                <div className={cn("grid gap-4", getGridClass(layout))}>
                  {qrItems.slice(0, layout).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4"
                    >
                      {item.qrDataUrl ? (
                        <>
                          <img
                            src={item.qrDataUrl}
                            alt={`QR Code ${item.tableNumber}`}
                            className={cn("mb-2", getQrSizeClass(layout))}
                          />
                          <p className={cn("font-semibold text-slate-900", getTextSizeClass(layout))}>
                            Meja {item.tableNumber}
                          </p>
                          <p className={cn("mt-1 text-slate-500", layout === 8 ? "text-xs" : "text-sm")}>
                            {tenantName}
                          </p>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          Failed to generate
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {qrItems.length > layout && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    + {qrItems.length - layout} more QR codes will be printed
                  </p>
                )}
              </div>
            )}

            {/* Print Button */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handlePrint}
                disabled={isGenerating || qrItems.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-4 w-4" />
                Print Semua ({tables.length} QR)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print View */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white">
        <style jsx global>{`
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-page {
              page-break-after: always;
            }
            .print-page:last-child {
              page-break-after: auto;
            }
          }
        `}</style>
        {qrItems.length > 0 &&
          Array.from({ length: Math.ceil(qrItems.length / layout) }).map((_, pageIdx) => {
            const startIdx = pageIdx * layout;
            const endIdx = Math.min(startIdx + layout, qrItems.length);
            const pageItems = qrItems.slice(startIdx, endIdx);

            return (
              <div key={pageIdx} className="print-page min-h-screen p-8">
                <div className={cn("grid gap-6 h-full", getGridClass(layout))}>
                  {pageItems.map((item, idx) => (
                    <div
                      key={startIdx + idx}
                      className="flex flex-col items-center justify-center rounded-lg border border-slate-300 p-4"
                    >
                      {item.qrDataUrl ? (
                        <>
                          <img
                            src={item.qrDataUrl}
                            alt={`QR Code ${item.tableNumber}`}
                            className={cn("mb-3", getQrSizeClass(layout))}
                          />
                          <p className={cn("font-bold text-slate-900", getTextSizeClass(layout))}>
                            Meja {item.tableNumber}
                          </p>
                          <p className={cn("mt-1 text-slate-600", layout === 8 ? "text-xs" : "text-sm")}>
                            {tenantName}
                          </p>
                          <p className={cn("mt-2 text-slate-500", layout === 8 ? "text-[10px]" : "text-xs")}>
                            Scan QR code untuk memesan
                          </p>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          Failed to generate QR code
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

