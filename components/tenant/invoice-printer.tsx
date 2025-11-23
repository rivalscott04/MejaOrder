"use client";

import { useRef, useEffect } from "react";
import { currencyFormatter, formatTime, formatOrderCode } from "@/lib/utils";
import { markInvoicePrinted } from "@/lib/api-client";

type OrderItem = {
  name: string;
  qty: number;
  subtotal: number;
  options?: string[];
  note?: string;
};

type InvoiceData = {
  orderCode: string;
  tableNumber: string;
  tableDescription?: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  totalAmount: number;
  tenantName: string;
  tenantLogoUrl?: string;
  tenantAddress?: string;
  tenantPhone?: string;
  cashierName?: string;
  wifiName?: string;
  wifiPassword?: string;
};

type InvoicePrinterProps = {
  data: InvoiceData;
  orderId?: number;
  onPrintComplete?: () => void;
};

export function InvoicePrinter({ data, orderId, onPrintComplete }: InvoicePrinterProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto print when component mounts
    const timer = setTimeout(() => {
      if (printRef.current) {
        window.print();
        
        // Mark invoice as printed if orderId is provided
        if (orderId) {
          markInvoicePrinted(orderId).catch((error) => {
            console.error("Failed to mark invoice as printed:", error);
            // Don't block the print flow if API call fails
          });
        }
        
        if (onPrintComplete) {
          setTimeout(() => {
            onPrintComplete();
          }, 500);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onPrintComplete, orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Debug: Log data to console
  useEffect(() => {
    console.log("InvoicePrinter data:", data);
    console.log("Items count:", data.items?.length);
    console.log("Tenant name:", data.tenantName);
  }, [data]);

  return (
    <>
      {/* Hidden in screen, visible in print */}
      <div 
        ref={printRef} 
        className="invoice-thermal"
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
      >
        <style jsx global>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden;
            }

            .invoice-thermal,
            .invoice-thermal * {
              visibility: visible !important;
            }

            .invoice-thermal {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              padding: 8mm 5mm !important;
              font-family: "Courier New", monospace !important;
              font-size: 12px !important;
              line-height: 1.4 !important;
              color: #000 !important;
              background: white !important;
              display: block !important;
              opacity: 1 !important;
              visibility: visible !important;
            }

            .no-print {
              display: none !important;
            }
          }
          
          @media screen {
            .invoice-thermal {
              position: absolute;
              left: -9999px;
              top: -9999px;
              visibility: hidden;
            }
          }

          .invoice-thermal {
            width: 80mm;
            max-width: 80mm;
            padding: 8mm 5mm;
            font-family: "Courier New", monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            margin: 0 auto;
          }

          .invoice-thermal .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }

          .invoice-thermal .header-logo {
            display: block;
            margin: 0 auto 8px auto;
            max-width: 60px;
            max-height: 60px;
            filter: grayscale(100%) contrast(1.2);
            -webkit-filter: grayscale(100%) contrast(1.2);
          }

          @media print {
            .invoice-thermal .header-logo {
              filter: grayscale(100%) contrast(1.2) !important;
              -webkit-filter: grayscale(100%) contrast(1.2) !important;
            }
          }

          .invoice-thermal .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 4px 0;
            text-transform: uppercase;
          }

          .invoice-thermal .header p {
            font-size: 10px;
            margin: 2px 0;
          }

          .invoice-thermal .cashier-info {
            text-align: left;
            margin-bottom: 8px;
            font-size: 10px;
          }

          .invoice-thermal .cashier-label {
            font-weight: bold;
          }

          .invoice-thermal .info {
            margin-bottom: 12px;
            font-size: 11px;
          }

          .invoice-thermal .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .invoice-thermal .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }

          .invoice-thermal .items {
            margin-bottom: 12px;
          }

          .invoice-thermal .item {
            margin-bottom: 8px;
          }

          .invoice-thermal .item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }

          .invoice-thermal .item-options {
            font-size: 10px;
            color: #333;
            margin-left: 8px;
            margin-top: 2px;
          }

          .invoice-thermal .item-note {
            font-size: 10px;
            font-style: italic;
            color: #666;
            margin-left: 8px;
            margin-top: 2px;
          }

          .invoice-thermal .item-qty-price {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
          }

          .invoice-thermal .total {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 8px 0;
            margin: 12px 0;
            font-weight: bold;
            font-size: 14px;
          }

          .invoice-thermal .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .invoice-thermal .wifi-info {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            text-align: center;
            font-size: 11px;
          }

          .invoice-thermal .wifi-info-title {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .invoice-thermal .footer {
            text-align: center;
            margin-top: 16px;
            font-size: 10px;
            color: #666;
          }
        `}</style>

        {/* Cashier Name - Top Left */}
        {data.cashierName && (
          <div className="cashier-info">
            <span className="cashier-label">Kasir: </span>
            <span>{data.cashierName}</span>
          </div>
        )}

        {/* Header with Logo, Name, and Address */}
        <div className="header">
          {data.tenantLogoUrl && (
            <img src={data.tenantLogoUrl} alt={data.tenantName} className="header-logo" />
          )}
          <h1>{data.tenantName}</h1>
          {data.tenantAddress && <p>{data.tenantAddress}</p>}
          {data.tenantPhone && <p>Telp: {data.tenantPhone}</p>}
        </div>

        <div className="info">
          <div className="info-row">
            <span>Kode:</span>
            <span>{formatOrderCode(data.orderCode)}</span>
          </div>
          <div className="info-row">
            <span>Meja:</span>
            <span>
              {data.tableNumber && data.tableNumber.trim() !== "" && data.tableNumber !== "N/A"
                ? `Meja ${data.tableNumber}${data.tableDescription ? ` - ${data.tableDescription}` : ""}`
                : data.tableDescription 
                  ? `Meja ${data.tableDescription}`
                  : "N/A"}
            </span>
          </div>
          <div className="info-row">
            <span>Tanggal:</span>
            <span>{formatDate(data.createdAt)}</span>
          </div>
          <div className="info-row">
            <span>Waktu:</span>
            <span>{formatTimeOnly(data.createdAt)}</span>
          </div>
          <div className="info-row">
            <span>Pembayaran:</span>
            <span>{data.paymentMethod.toUpperCase()}</span>
          </div>
        </div>

        <div className="divider"></div>

        <div className="items">
          {data.items && data.items.length > 0 ? (
            data.items.map((item, idx) => (
              <div key={idx} className="item">
                <div className="item-name">
                  {item.name} × {item.qty}
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="item-options">
                    {item.options.map((opt, optIdx) => (
                      <div key={optIdx}>- {opt}</div>
                    ))}
                  </div>
                )}
                {item.note && <div className="item-note">Note: {item.note}</div>}
                <div className="item-qty-price">
                  <span>
                    {item.qty} × {currencyFormatter.format(Math.round(item.subtotal / item.qty))}
                  </span>
                  <span>{currencyFormatter.format(item.subtotal)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="item">
              <div className="item-name">Tidak ada item</div>
            </div>
          )}
        </div>

        <div className="divider"></div>

        <div className="total">
          <div className="total-row">
            <span>TOTAL</span>
            <span>{currencyFormatter.format(data.totalAmount)}</span>
          </div>
        </div>

        {(data.wifiName || data.wifiPassword) && (
          <div className="wifi-info">
            <div className="wifi-info-title">WiFi Gratis</div>
            {data.wifiName && <div>Nama: {data.wifiName}</div>}
            {data.wifiPassword && <div>Password: {data.wifiPassword}</div>}
          </div>
        )}

        <div className="footer">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
        </div>
      </div>
    </>
  );
}

