/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  ChevronRight,
  ClipboardList,
  QrCode,
  ShoppingBasket,
  Store,
  Upload,
  Wallet,
  X,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";
import { SectionTitle } from "@/components/shared/section-title";
import { AlertModal } from "@/components/shared/alert-modal";
import { Toast } from "@/components/shared/toast";
import type {
  CartItemPayload,
  Category,
  CheckoutPayload,
  MenuItem,
  MenuOptionGroup,
  MenuOptionItem,
  PaymentMethod,
  TableInfo,
  Tenant,
} from "@/lib/types";
import { cn, currencyFormatter, calculateMenuBadges, isBestSellerMenu, isRecommendedMenu } from "@/lib/utils";
import { CustomerMenuGridSkeleton } from "@/components/shared/menu-skeleton";

// Helper function to get bank logo path based on bank name
function getBankLogoPath(bankName: string): string | null {
  const normalizedName = bankName.toLowerCase().trim();
  
  // Map bank names to logo files
  const bankLogoMap: Record<string, string> = {
    'bca': 'bca.svg',
    'bni': 'bni.svg',
    'bri': 'bri.svg',
    'bsi': 'bsi.svg',
    'mandiri': 'mandiri.svg',
    'ntbs': 'ntbs.svg',
    'ntb syariah': 'ntbs.svg',
    'seabank': 'seabank.svg',
  };
  
  const logoFile = bankLogoMap[normalizedName];
  return logoFile ? `/bank_logos/${logoFile}` : null;
}


type CartItemState = CartItemPayload & {
  clientItemId: string;
  menuName: string;
  displayPrice: number;
  optionLabels: string[];
};

type OrderSummary = {
  order_code: string;
  payment_method: PaymentMethod;
  payment_status: "unpaid" | "waiting_verification" | "paid" | "failed" | "refunded";
  order_status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "canceled";
  total_amount: number;
  customer_note?: string | null;
  items: Array<{
    menu_id: number;
    menu_name: string;
    qty: number;
    subtotal: number;
    note?: string | null;
    options: Array<{
      group: string;
      label: string;
      extra_price: number;
    }>;
  }>;
};

type CustomerExperienceProps = {
  tenant: Tenant;
  table: TableInfo;
  categories: Category[];
  menus: MenuItem[];
  optionGroups: MenuOptionGroup[];
  optionItems: MenuOptionItem[];
  initialCart?: CartItemPayload[];
  apiBaseUrl?: string;
};

export function CustomerExperience({
  tenant,
  table,
  categories,
  menus,
  optionGroups,
  optionItems,
  initialCart = [],
  apiBaseUrl,
}: CustomerExperienceProps) {
  const router = useRouter();
  const optionItemMap = useMemo(
    () => new Map(optionItems.map((item) => [item.id, item])),
    [optionItems]
  );
  const menuMap = useMemo(() => new Map(menus.map((item) => [item.id, item])), [menus]);
  const optionGroupMap = useMemo(
    () => new Map(optionGroups.map((group) => [group.id, group])),
    [optionGroups]
  );

  const isMockMode = !apiBaseUrl;
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "terlaris" | "baru" | "layak-dicoba">("all");
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItemState[]>(() =>
    initialCart
      .map((seed) => enrichCartItem(seed, menuMap, optionItemMap))
      .filter(Boolean) as CartItemState[]
  );
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofMessage, setProofMessage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(menus.length === 0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [paymentSettings, setPaymentSettings] = useState<{
    banks: Array<{ bank: string; account_number: string; account_name: string }>;
    qris_image: string | null;
  }>({ banks: [], qris_image: null });
  
  // Update selected bank when payment settings change
  useEffect(() => {
    if (paymentSettings.banks.length > 0 && !selectedBank) {
      setSelectedBank(paymentSettings.banks[0].bank);
    }
  }, [paymentSettings.banks, selectedBank]);

  // Set loading to false when menus are loaded
  useEffect(() => {
    if (menus.length > 0) {
      setIsInitialLoading(false);
    }
  }, [menus.length]);

  // Fetch payment settings
  useEffect(() => {
    if (!apiBaseUrl || isMockMode) {
      // Use default mock data for mock mode
      setPaymentSettings({
        banks: [
          { bank: "BCA", account_number: "7611 8822 12", account_name: tenant.name },
        ],
        qris_image: null,
      });
      return;
    }

    const fetchPaymentSettings = async () => {
      try {
        // Fetch from public API endpoint (we'll need to create this)
        const response = await fetch(`${apiBaseUrl}/api/public/${tenant.slug}/payment-settings`);
        if (response.ok) {
          const data = await response.json();
          setPaymentSettings({
            banks: data.banks || [],
            qris_image: data.qris_image || null,
          });
        }
      } catch (error) {
        console.warn("Gagal mengambil pengaturan pembayaran:", error);
        // Use empty settings on error
      }
    };

    fetchPaymentSettings();
  }, [apiBaseUrl, tenant.slug, tenant.name, isMockMode]);

  // Enrich menus with badges if not present
  // Backend should already provide badges, but we keep this as fallback
  const enrichedMenus = useMemo(() => {
    return menus.map((menu) => {
      // If menu already has badges from backend, use them
      if (menu.badges && menu.badges.length > 0) {
        return menu;
      }

      // Fallback: calculate badges if backend doesn't provide them
      // This should rarely happen if backend is properly configured
      const badges: string[] = [];
      
      if (isBestSellerMenu(menu.id)) {
        badges.push("Terlaris");
      }
      
      if (menu.id % 5 === 0 || menu.id % 7 === 0) {
        badges.push("Baru");
      }
      
      if (isRecommendedMenu(menu.id, new Date().toISOString())) {
        badges.push("Layak Dicoba");
      }

      return {
        ...menu,
        badges: badges.length > 0 ? badges : undefined,
      };
    });
  }, [menus]);

  const filteredMenus = useMemo(() => {
    let filtered = enrichedMenus;

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((menu) => menu.categoryId === categoryFilter);
    }

    // Filter by badge
    if (badgeFilter !== "all") {
      filtered = filtered.filter((menu) => {
        const badges = menu.badges || [];
        if (badgeFilter === "terlaris") {
          return badges.includes("Terlaris") || badges.includes("Best Seller");
        } else if (badgeFilter === "baru") {
          return badges.includes("Baru") || badges.includes("New");
        } else if (badgeFilter === "layak-dicoba") {
          return badges.includes("Layak Dicoba") || badges.includes("Recommended");
        }
        return true;
      });
    }

    return filtered;
  }, [enrichedMenus, categoryFilter, badgeFilter]);

  const cartSummary = useMemo(() => {
    const items = cart.length;
    const total = cart.reduce((sum, item) => sum + item.displayPrice, 0);
    return { items, total };
  }, [cart]);

  const checkoutPayload: CheckoutPayload = {
    qr_token: table.qrToken,
    customer_name: customerName.trim(),
    items: cart.map(({ menu_id, qty, option_item_ids, item_note }) => ({
      menu_id,
      qty,
      option_item_ids,
      item_note,
    })),
    payment_method: paymentMethod,
    bank_choice: paymentMethod === "transfer" ? selectedBank : undefined,
  };

  function handleAddToCart(payload: CartItemPayload) {
    const nextItem = enrichCartItem(payload, menuMap, optionItemMap);
    setCart((prev) => [...prev, nextItem]);
    setSelectedMenu(null); // Close the menu option sheet after adding to cart
  }

  function handleRemoveFromCart(clientItemId: string) {
    setCart((prev) => prev.filter((item) => item.clientItemId !== clientItemId));
  }

  async function handleCheckoutConfirm() {
    // Validasi: nama customer wajib diisi
    if (!customerName.trim()) {
      setApiError("Mohon masukkan nama customer terlebih dahulu.");
      return;
    }

    // Validasi: bukti wajib untuk transfer
    if (paymentMethod === "transfer" && !selectedProof) {
      setApiError("Mohon unggah bukti pembayaran terlebih dahulu.");
      return;
    }

    if (isMockMode) {
      // Generate mock order code dengan format: [digit pertama tanggal][3 digit random][tanggal][bulan][tahun 2 digit]
      // Contoh: 1234221125 (1 = digit pertama tanggal 22, 234 = random, 221125 = 22 Nov 2025)
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0'); // Format: 01-31
      const dayFirstDigit = day.charAt(0); // Ambil digit pertama tanggal (1 untuk 10-19, 2 untuk 20-29, dll)
      const random3Digits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const mockOrderCode = `${dayFirstDigit}${random3Digits}${day}${month}${year}`;
      
      // Set mock order data
      const mockOrderData: OrderSummary = {
        order_code: mockOrderCode,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" ? "unpaid" : "waiting_verification",
        order_status: "pending",
        total_amount: cartSummary.total + (cartSummary.total * (tenant.taxPercentage || 0) / 100),
        items: cart.map((item) => ({
          menu_id: item.menu_id,
          menu_name: item.menuName,
          qty: item.qty,
          subtotal: item.displayPrice,
          note: item.item_note || null,
          options: item.optionLabels.map((label) => ({
            group: "",
            label,
            extra_price: 0,
          })),
        })),
      };
      
      // Store mock order data in localStorage for order tracking page
      if (typeof window !== "undefined") {
        localStorage.setItem(`mock_order_${mockOrderCode}`, JSON.stringify(mockOrderData));
      }
      
      // Kosongkan cart setelah checkout berhasil
      setCart([]);
      setCheckoutOpen(false);
      
      // Tampilkan toast success
      setSuccessMessage("Pesanan berhasil dibuat! Mengarahkan ke halaman pesanan...");
      setShowSuccessToast(true);
      
      // Redirect ke halaman order tracking setelah toast muncul
      setTimeout(() => {
        router.push(`/o/${tenant.slug}/t/${table.qrToken}/order/${mockOrderCode}`);
      }, 2000);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setProofMessage(null);

    try {
      // Step 1: Create order
      const response = await fetch(`${apiBaseUrl}/api/public/${tenant.slug}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal membuat pesanan. Pastikan stok/opsi masih tersedia.");
      }

      const data: OrderSummary = await response.json();

      // Step 2: Upload proof wajib untuk transfer
      if (paymentMethod === "transfer" && selectedProof) {
        try {
          const formData = new FormData();
          formData.append("proof", selectedProof);
          formData.append("method", paymentMethod);
          formData.append("amount", String(data.total_amount));
          formData.append("bank_name", selectedBank);

          const proofResponse = await fetch(
            `${apiBaseUrl}/api/public/${tenant.slug}/orders/${data.order_code}/upload-proof`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (proofResponse.ok) {
            setProofMessage("Pesanan berhasil dibuat dan bukti pembayaran telah dikirim.");
            setSelectedProof(null);
          } else {
            const errorText = await proofResponse.text();
            throw new Error(errorText || "Gagal mengunggah bukti pembayaran.");
          }
        } catch (proofError) {
          // Order sudah dibuat, tapi upload proof gagal
          console.error("Gagal mengunggah bukti pembayaran:", proofError);
          setApiError(
            "Pesanan berhasil dibuat, namun gagal mengunggah bukti pembayaran. Silakan hubungi kasir."
          );
        }
      }

      // Kosongkan cart setelah checkout berhasil
      setCart([]);
      setCheckoutOpen(false);

      // Tampilkan toast success
      setSuccessMessage("Pesanan berhasil dibuat! Mengarahkan ke halaman pesanan...");
      setShowSuccessToast(true);

      // Redirect ke halaman order tracking setelah toast muncul
      setTimeout(() => {
        router.push(`/o/${tenant.slug}/t/${table.qrToken}/order/${data.order_code}`);
      }, 2000);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Gagal membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleProofFileChange = useCallback((file: File | null) => {
    setSelectedProof(file);
    setProofMessage(null);
    
    // Clean up previous preview URL using functional update
    setProofPreview((prevPreview) => {
      if (prevPreview) {
        URL.revokeObjectURL(prevPreview);
      }
      return null;
    });
    
    // Create preview URL for image files
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setProofPreview(previewUrl);
    }
  }, []);
  
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, [proofPreview]);

  return (
    <section className="relative space-y-6">
      <header className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Store className="h-4 w-4 text-emerald-600" />
            <span>{tenant.name}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span>Meja {table.number}</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Pesan langsung dari meja ini
          </h2>
          <p className="text-sm text-slate-500">
            Selamat datang! Jelajahi menu kami, pilih hidangan favorit Anda, dan sesuaikan sesuai selera. Pesanan Anda akan segera diproses oleh tim kami.
          </p>
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <InfoChip label="Instruksi" value="Pilih menu → Keranjang → Bayar" />
            {table.note && <InfoChip label="Catatan Zona" value={table.note} />}
          </div>
        </div>
      </header>

      {/* Filters - Redesigned for better mobile/tablet experience */}
      <div className="space-y-3 sm:space-y-4">
        {/* Category Filter - Improved Layout */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500 sm:text-sm">Kategori</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-x-visible">
            <CategoryPill 
              label="Semua" 
              active={categoryFilter === "all"} 
              onClick={() => setCategoryFilter("all")} 
            />
            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                active={categoryFilter === category.id}
                onClick={() => setCategoryFilter(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Badge Filter - Improved Layout */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500 sm:text-sm">Filter</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-x-visible">
            {(["all", "terlaris", "baru", "layak-dicoba"] as const).map((filter) => (
              <CategoryPill
                key={filter}
                label={
                  filter === "all"
                    ? "Semua"
                    : filter === "terlaris"
                      ? "Terlaris"
                      : filter === "baru"
                        ? "Baru"
                        : "Layak Dicoba"
                }
                active={badgeFilter === filter}
                onClick={() => setBadgeFilter(filter)}
              />
            ))}
          </div>
        </div>
      </div>

      {isInitialLoading && menus.length === 0 ? (
        <CustomerMenuGridSkeleton count={6} />
      ) : filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <ShoppingBasket className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Tidak ada menu yang ditemukan
          </h3>
          <p className="text-sm text-slate-500">
            {categoryFilter !== "all" || badgeFilter !== "all"
              ? "Coba ubah filter atau kategori untuk melihat menu lainnya."
              : "Belum ada menu yang tersedia saat ini."}
          </p>
          {(categoryFilter !== "all" || badgeFilter !== "all") && (
            <button
              onClick={() => {
                setCategoryFilter("all");
                setBadgeFilter("all");
              }}
              className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Tampilkan Semua Menu
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMenus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onSelect={() => setSelectedMenu(menu)} />
          ))}
        </div>
      )}

      {selectedMenu && (
        <MenuOptionSheet
          tenantName={tenant.name}
          menu={selectedMenu}
          optionGroupMap={optionGroupMap}
          optionItemMap={optionItemMap}
          onClose={() => setSelectedMenu(null)}
          onSubmit={handleAddToCart}
        />
      )}

      {cart.length > 0 && (
        <CartBar 
          summary={cartSummary} 
          onCheckout={() => {
            // Reset payment method to cash when opening checkout
            setPaymentMethod("cash");
            setCheckoutOpen(true);
          }} 
          cart={cart}
          taxPercentage={tenant.taxPercentage || 0}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutDrawer
          cart={cart}
          paymentMethod={paymentMethod}
          onPaymentChange={setPaymentMethod}
          selectedBank={selectedBank}
          onSelectBank={setSelectedBank}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          payload={checkoutPayload}
          onClose={() => setCheckoutOpen(false)}
          onConfirm={handleCheckoutConfirm}
          apiError={apiError}
          isSubmitting={isSubmitting}
          isMockMode={isMockMode}
          selectedProofName={selectedProof?.name ?? null}
          proofPreview={proofPreview}
          onProofChange={handleProofFileChange}
          proofMessage={proofMessage}
          tenantName={tenant.name}
          taxPercentage={tenant.taxPercentage || 0}
          paymentSettings={paymentSettings}
          onRemoveItem={handleRemoveFromCart}
        />
      )}

      {/* Success Toast */}
      <Toast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={successMessage}
        variant="success"
        duration={2000}
      />
    </section>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition active:scale-95",
        active 
          ? "bg-emerald-500 text-white shadow-sm" 
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function MenuCard({ menu, onSelect }: { menu: MenuItem; onSelect: () => void }) {
  return (
    <article className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-card overflow-hidden">
      <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-2xl">
        <img src={menu.imageUrl} alt={menu.name} className="h-full w-full object-cover" />
        {!menu.isAvailable && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold uppercase text-white">
            Habis
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 mb-1">
          <h3 className="text-lg font-semibold text-slate-900 truncate min-w-0 flex-1">{menu.name}</h3>
          {menu.badges?.map((badge) => (
            <span key={badge} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 shrink-0 whitespace-nowrap">
              {badge}
            </span>
          ))}
        </div>
        <p className="line-clamp-2 text-xs text-slate-500 min-w-0">{menu.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 min-w-0">
          <p className="font-semibold text-slate-900 shrink-0 whitespace-nowrap text-sm">{currencyFormatter.format(menu.price)}</p>
          <button
            disabled={!menu.isAvailable}
            onClick={onSelect}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition flex-shrink-0 whitespace-nowrap",
              menu.isAvailable ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-400"
            )}
          >
            Tambah
          </button>
        </div>
      </div>
    </article>
  );
}

type MenuOptionSheetProps = {
  tenantName: string;
  menu: MenuItem;
  optionGroupMap: Map<number, MenuOptionGroup>;
  optionItemMap: Map<number, MenuOptionItem>;
  onClose: () => void;
  onSubmit: (payload: CartItemPayload) => void;
};

function MenuOptionSheet({ tenantName, menu, optionGroupMap, optionItemMap, onClose, onSubmit }: MenuOptionSheetProps) {
  const groups = menu.optionGroupIds
    .map((id) => optionGroupMap.get(id))
    .filter((group): group is MenuOptionGroup => Boolean(group));

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Record<number, number[]>>(() => {
    const defaults: Record<number, number[]> = {};
    groups.forEach((group) => {
      const defaultItem = group.required ? [group.optionItemIds[0]] : [];
      defaults[group.id] = defaultItem;
    });
    return defaults;
  });

  const selectedOptionIds = Object.values(selected).flat();

  const optionCost = selectedOptionIds.reduce((total, id) => {
    const option = optionItemMap.get(id);
    return option ? total + option.extraPrice : total;
  }, 0);
  const displayPrice = (menu.price + optionCost) * qty;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  function toggleOption(groupId: number, optionId: number, selectionType: "single" | "multiple") {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (selectionType === "single") {
        return { ...prev, [groupId]: [optionId] };
      }
      const exists = current.includes(optionId);
      const next = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: next };
    });
  }

  const allRequiredSelected = groups.every((group) =>
    group.required ? (selected[group.id]?.length ?? 0) > 0 : true
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{tenantName}</p>
            <h3 className="text-2xl font-semibold text-slate-900">{menu.name}</h3>
            <p className="text-sm text-slate-500">{currencyFormatter.format(menu.price)}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-semibold text-slate-900">{group.name}</p>
                <span className="text-xs text-slate-500">
                  {group.selectionType === "single" ? "Pilih 1" : "Pilih beberapa"}
                  {group.required && " • Wajib"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.optionItemIds.map((optionId) => {
                  const option = optionItemMap.get(optionId);
                  if (!option || !option.isActive) return null;
                  const isSelected = selected[group.id]?.includes(optionId);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(group.id, option.id, group.selectionType)}
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-sm transition",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-900">
          Catatan
          <textarea
            placeholder="Catatan untuk barista..."
            className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
          />
        </label>

        <div className="mt-4 flex items-center justify-between">
          <QuantitySelector value={qty} onChange={setQty} />
          <div className="text-right">
            <p className="text-xs text-slate-500">Estimasi total</p>
            <p className="text-xl font-semibold text-slate-900">{currencyFormatter.format(displayPrice)}</p>
          </div>
        </div>

        <button
          disabled={!allRequiredSelected}
          onClick={() =>
            onSubmit({
              menu_id: menu.id,
              qty,
              option_item_ids: selectedOptionIds,
              item_note: note || undefined,
            })
          }
          className={cn(
            "mt-4 w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold transition",
            allRequiredSelected ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-400"
          )}
        >
          Tambah ke Keranjang
        </button>
      </div>
    </div>
  );
}

function QuantitySelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [inputValue, setInputValue] = useState<string>(String(value));
  const [isEditing, setIsEditing] = useState(false);

  // Sync input value when prop value changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty string for editing, or numbers only
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setInputValue(newValue);
    }
  };

  const commitValue = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      // Reset to current value if invalid
      setInputValue(String(value));
      onChange(1);
    } else {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    commitValue();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      commitValue();
    } else if (e.key === "Escape") {
      setInputValue(String(value));
      setIsEditing(false);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold">
      <button 
        onClick={() => onChange(Math.max(1, value - 1))} 
        className="text-slate-400 hover:text-emerald-600 disabled:text-slate-300 transition-colors" 
        disabled={value <= 1}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 text-center bg-transparent border-none outline-none text-slate-900 font-semibold focus:ring-0 p-0"
        style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
      />
      <button 
        onClick={() => onChange(value + 1)} 
        className="text-emerald-600 hover:text-emerald-700 transition-colors"
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartBar({
  summary,
  onCheckout,
  cart,
  taxPercentage,
}: {
  summary: { items: number; total: number };
  onCheckout: () => void;
  cart: CartItemState[];
  taxPercentage: number;
}) {
  const taxAmount = summary.total * (taxPercentage / 100);
  const totalWithTax = summary.total + taxAmount;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-lg items-center justify-between rounded-3xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
        <div>
          <p className="text-sm text-slate-200">
            {summary.items} item · {currencyFormatter.format(totalWithTax)}
          </p>
          <p className="text-xs text-slate-400">
            {taxPercentage > 0 ? `Sudah termasuk pajak ${taxPercentage}%` : "Keranjang berisi " + cart.length + " item"}
          </p>
        </div>
        <button
          onClick={onCheckout}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold transition hover:bg-emerald-600"
        >
          <ShoppingBasket className="h-4 w-4" />
          Lanjut ke Pembayaran
        </button>
      </div>
    </div>
  );
}

function CheckoutDrawer({
  cart,
  paymentMethod,
  onPaymentChange,
  selectedBank,
  onSelectBank,
  customerName,
  onCustomerNameChange,
  payload,
  tenantName,
  onClose,
  onConfirm,
  apiError,
  isSubmitting,
  isMockMode,
  selectedProofName,
  proofPreview,
  onProofChange,
  proofMessage,
  taxPercentage,
  paymentSettings,
  onRemoveItem,
}: {
  cart: CartItemState[];
  paymentMethod: PaymentMethod;
  onPaymentChange: (method: PaymentMethod) => void;
  selectedBank: string;
  onSelectBank: (bank: string) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  payload: CheckoutPayload;
  tenantName: string;
  onClose: () => void;
  onConfirm: () => void;
  apiError: string | null;
  isSubmitting: boolean;
  isMockMode: boolean;
  selectedProofName: string | null;
  proofPreview: string | null;
  onProofChange: (file: File | null) => void;
  proofMessage: string | null;
  taxPercentage: number;
  paymentSettings: {
    banks: Array<{ bank: string; account_number: string; account_name: string }>;
    qris_image: string | null;
  };
  onRemoveItem: (clientItemId: string) => void;
}) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCopySuccessModal, setShowCopySuccessModal] = useState(false);
  const subtotal = cart.reduce((sum, item) => sum + item.displayPrice, 0);
  const confirmLabel = isMockMode
    ? "Buat Pesanan Uji"
    : isSubmitting
      ? "Membuat Pesanan..."
      : "Konfirmasi Pesanan";

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle copy account number with success modal
  const handleCopyAccountNumber = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setShowCopySuccessModal(true);
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowCopySuccessModal(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 md:items-center md:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="flex h-full w-full max-h-[95vh] flex-col rounded-t-3xl bg-white shadow-2xl md:h-auto md:max-w-2xl md:rounded-3xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 md:border-0 md:px-0 md:py-0">
          <h3 className="text-lg font-semibold text-slate-900">Pembayaran</h3>
          <button 
            onClick={onClose} 
            className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-6 md:px-0 md:py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-6 pb-4">
            {/* Ringkasan Pesanan */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Ringkasan Pesanan" />
                <span className="text-xs text-slate-500">{cart.length} item</span>
              </div>
              <OrderItemsList cart={cart} subtotal={subtotal} taxPercentage={taxPercentage} onRemoveItem={onRemoveItem} />
            </div>

            {/* Nama Customer */}
            <div className="space-y-4">
              <SectionTitle icon={<Store className="h-4 w-4" />} title="Nama Customer" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Masukkan nama Anda"
                maxLength={150}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-xs text-slate-500">
                Nama wajib diisi untuk mengidentifikasi pesanan Anda
              </p>
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-4">
              <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Metode Pembayaran" />
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => onPaymentChange(e.target.value as PaymentMethod)}
                  className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="cash">Cash - Bayar ke kasir</option>
                  {paymentSettings.banks.length > 0 && (
                    <option value="transfer">Transfer - Unggah bukti</option>
                  )}
                  {paymentSettings.qris_image && (
                    <option value="qris">QRIS - Scan QR</option>
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
              {paymentMethod === "transfer" && (
                <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                  <SectionTitle icon={<Banknote className="h-4 w-4" />} title="Bank pilihan" />
                  {paymentSettings.banks.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada bank yang tersedia</p>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        {paymentSettings.banks.map((bank, index) => (
                          <button
                            key={index}
                            onClick={() => onSelectBank(bank.bank)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-sm transition",
                              selectedBank === bank.bank
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            {bank.bank}
                          </button>
                        ))}
                      </div>
                      {selectedBank && paymentSettings.banks.find(b => b.bank === selectedBank) && (() => {
                        const selectedBankData = paymentSettings.banks.find(b => b.bank === selectedBank)!;
                        const bankLogoPath = getBankLogoPath(selectedBankData.bank);
                        return (
                          <div className="rounded-xl bg-slate-50 p-4">
                            <div className="flex items-start gap-4">
                              {bankLogoPath && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={bankLogoPath}
                                    alt={`Logo ${selectedBankData.bank}`}
                                    className="h-12 w-12 object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-slate-500 mb-1">Nomor Rekening</p>
                                  <p className="font-semibold text-slate-900">{selectedBankData.account_number}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500 mb-1">Atas Nama</p>
                                  <p className="text-sm text-slate-700">{selectedBankData.account_name}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleCopyAccountNumber(selectedBankData.account_number)}
                                className="flex-shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                              >
                                Salin
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                  <label className="block text-xs font-semibold text-slate-600">
                    Unggah bukti pembayaran <span className="text-rose-600">*</span>
                    <div className={cn(
                      "mt-2 rounded-xl border border-dashed px-3 py-2 text-sm",
                      selectedProofName 
                        ? "border-emerald-300 bg-emerald-50" 
                        : "border-slate-300 bg-white"
                    )}>
                      <div className="flex items-center justify-between gap-3">
                        <span className={cn(
                          "truncate text-xs",
                          selectedProofName ? "text-emerald-700 font-medium" : "text-slate-500"
                        )}>
                          {selectedProofName ?? "Pilih file bukti transfer (JPG)"}
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50">
                          <Upload className="h-4 w-4" />
                          {selectedProofName ? "Ubah" : "Unggah File"}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              setFileError(null);
                              if (file) {
                                // Validasi ekstensi file
                                const validExtensions = ['jpg', 'jpeg'];
                                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                                if (fileExtension && validExtensions.includes(fileExtension)) {
                                  onProofChange(file);
                                } else {
                                  setFileError("Hanya file JPG yang diperbolehkan.");
                                  event.target.value = ''; // Reset input
                                  onProofChange(null);
                                }
                              } else {
                                onProofChange(null);
                              }
                            }}
                            required={paymentMethod === "transfer"}
                          />
                        </label>
                      </div>
                      {proofPreview && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-2">
                          <img 
                            src={proofPreview} 
                            alt="Preview bukti pembayaran" 
                            className="w-full rounded-lg object-contain max-h-48"
                          />
                        </div>
                      )}
                      {!selectedProofName && !fileError && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Bukti transfer wajib diunggah (format: JPG)
                        </p>
                      )}
                      {fileError && (
                        <p className="mt-2 text-[11px] text-rose-600 font-medium">
                          {fileError}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )}
              {paymentMethod === "qris" && (
                <div className="rounded-2xl border border-slate-200 p-4 text-center">
                  <SectionTitle icon={<QrCode className="h-4 w-4" />} title="QRIS" />
                  {paymentSettings.qris_image ? (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <img 
                        src={paymentSettings.qris_image} 
                        alt="QRIS" 
                        className="mx-auto h-64 w-64 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <QrCode className="mx-auto h-32 w-32 text-slate-400" />
                      <p className="mt-2 text-xs text-slate-500">QRIS belum tersedia</p>
                    </div>
                  )}
                  <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" className="accent-emerald-500" /> Saya sudah membayar
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 md:border-0 md:px-0 md:py-0 md:pt-6">
          <div className="space-y-3">
            {apiError && <p className="text-xs text-rose-600">{apiError}</p>}
            {proofMessage && (
              <p className="text-xs text-emerald-600">{proofMessage}</p>
            )}
            <button
              onClick={onConfirm}
              disabled={isSubmitting || !customerName.trim() || (paymentMethod === "transfer" && !selectedProofName)}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {confirmLabel}
            </button>
            {!customerName.trim() && (
              <p className="text-[11px] text-rose-600 text-center">
                Mohon masukkan nama customer terlebih dahulu
              </p>
            )}
            {paymentMethod === "transfer" && !selectedProofName && (
              <p className="text-[11px] text-rose-600 text-center">
                Mohon unggah bukti pembayaran terlebih dahulu
              </p>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batalkan
            </button>
          </div>
        </div>
      </div>

      {/* Copy Success Modal */}
      <AlertModal
        isOpen={showCopySuccessModal}
        onClose={() => setShowCopySuccessModal(false)}
        title="Nomor Rekening Berhasil Disalin"
        message="Nomor rekening telah disalin ke clipboard Anda."
        variant="success"
        buttonLabel="OK"
      />
    </div>
  );
}

function OrderItemsList({ cart, subtotal, taxPercentage, onRemoveItem }: { cart: CartItemState[]; subtotal: number; taxPercentage: number; onRemoveItem: (clientItemId: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ITEMS_TO_SHOW = 5;
  const hasMoreItems = cart.length > ITEMS_TO_SHOW;
  const itemsToDisplay = isExpanded ? cart : cart.slice(0, ITEMS_TO_SHOW);

  // Calculate tax and total
  const taxAmount = subtotal * (taxPercentage / 100);
  const totalWithTax = subtotal + taxAmount;

  return (
    <div className="space-y-3">
      {itemsToDisplay.map((item) => (
        <div key={item.clientItemId} className="rounded-2xl border border-slate-200 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-slate-900">
                <p className="font-semibold">
                  {item.menuName} × {item.qty}
                </p>
                <p>{currencyFormatter.format(item.displayPrice)}</p>
              </div>
              <p className="text-xs text-slate-500">{item.optionLabels.join(", ")}</p>
              {item.item_note && <p className="text-xs text-emerald-600">Catatan: {item.item_note}</p>}
            </div>
            <button
              onClick={() => onRemoveItem(item.clientItemId)}
              className="flex-shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
              type="button"
              aria-label="Hapus item"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {hasMoreItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {isExpanded ? (
            <>Tampilkan lebih sedikit</>
          ) : (
            <>Lihat {cart.length - ITEMS_TO_SHOW} item lainnya</>
          )}
        </button>
      )}
      
      {/* Invoice Breakdown */}
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold text-slate-900">Subtotal</p>
            <p className="text-xs text-slate-500">Belum termasuk pajak</p>
          </div>
          <p className="font-semibold text-slate-900">{currencyFormatter.format(subtotal)}</p>
        </div>
        
        {taxPercentage > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
            <div>
              <p className="font-semibold text-slate-900">Pajak {taxPercentage}%</p>
              <p className="text-xs text-slate-500">Pajak daerah</p>
            </div>
            <p className="font-semibold text-slate-900">{currencyFormatter.format(taxAmount)}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between border-t-2 border-slate-200 pt-2">
          <div>
            <p className="text-base font-bold text-slate-900">Total Pembayaran</p>
            <p className="text-xs text-slate-500">Sudah termasuk pajak</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">{currencyFormatter.format(totalWithTax)}</p>
        </div>
      </div>
    </div>
  );
}

function enrichCartItem(
  payload: CartItemPayload,
  menuMap: Map<number, MenuItem>,
  optionItemMap: Map<number, MenuOptionItem>
): CartItemState {
  const menu = menuMap.get(payload.menu_id);
  const optionLabels = payload.option_item_ids
    .map((id) => optionItemMap.get(id)?.label)
    .filter(Boolean) as string[];
  const optionCost = payload.option_item_ids.reduce((sum, id) => {
    const option = optionItemMap.get(id);
    return option ? sum + option.extraPrice : sum;
  }, 0);
  const basePrice = (menu?.price ?? 0) + optionCost;
  const displayPrice = basePrice * payload.qty;
  const clientItemId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${payload.menu_id}-${Date.now()}-${Math.random()}`;
  return {
    ...payload,
    clientItemId,
    menuName: menu?.name ?? "Menu",
    displayPrice,
    optionLabels,
  };
}

