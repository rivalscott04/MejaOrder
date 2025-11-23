"use client";

import { useState, useEffect } from "react";
import { X, Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import type { PrintQrResponse } from "@/lib/api-client";

// @ts-ignore - qrcode types might not be perfect
const QRCodeLib = QRCode.default || QRCode;

type QrPrintModalProps = {
  isOpen: boolean;
  onClose: () => void;
  qrData: PrintQrResponse | null;
  onDownload?: () => void;
};

export function QrPrintModal({ isOpen, onClose, qrData, onDownload }: QrPrintModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && qrData) {
      generateQrCode();
    }
  }, [isOpen, qrData]);

  const generateQrCode = async () => {
    if (!qrData) return;
    setIsGenerating(true);
    try {
      const dataUrl = await QRCodeLib.toDataURL(qrData.qr_url, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.href = qrCodeDataUrl;
      link.download = `qr-table-${qrData?.table_number || "qr"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen || !qrData) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">QR Code Meja {qrData.table_number}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
              {isGenerating ? (
                <div className="py-8 text-center text-slate-500">Generating QR code...</div>
              ) : qrCodeDataUrl ? (
                <>
                  <img src={qrCodeDataUrl} alt="QR Code" className="mb-4 h-64 w-64" />
                  <p className="text-sm font-semibold text-slate-900">
                    Meja {qrData.table_number}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{qrData.tenant_name}</p>
                </>
              ) : (
                <div className="py-8 text-center text-slate-500">Failed to generate QR code</div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print View */}
      <div className="hidden print:block print:fixed print:inset-0 print:flex print:items-center print:justify-center print:bg-white">
        <div className="flex flex-col items-center justify-center p-8">
          {qrCodeDataUrl && (
            <>
              <img src={qrCodeDataUrl} alt="QR Code" className="mb-4 h-96 w-96" />
              <p className="text-2xl font-bold text-slate-900">Meja {qrData.table_number}</p>
              <p className="mt-2 text-lg text-slate-600">{qrData.tenant_name}</p>
              <p className="mt-4 text-sm text-slate-500">Scan QR code untuk memesan</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

