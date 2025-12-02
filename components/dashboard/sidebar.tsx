"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  BarChart3,
  MenuSquare,
  QrCode,
  Settings,
  ClipboardList,
  TrendingUp,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  History,
  FolderTree,
  Settings2,
  Loader2,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, logout, fetchOrders, type LoginResponse } from "@/lib/api-client";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
};

type SidebarProps = {
  role: "super-admin" | "tenant-admin" | "cashier";
  userEmail?: string;
  userName?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ role, userEmail, userName, onCollapseChange, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [incompleteOrderCount, setIncompleteOrderCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getCurrentUser();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch incomplete orders count and notifications for cashier role
  useEffect(() => {
    if (role !== "cashier") return;

    const fetchIncompleteOrders = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetchOrders({ date: today });

        // Count orders that are not completed or canceled
        const incompleteCount = response.data.filter(
          (order) => order.order_status !== "completed" && order.order_status !== "canceled"
        ).length;

        setIncompleteOrderCount(incompleteCount);

        // Count notifications: pending orders + waiting verification + ready orders
        // Ini adalah pengingat untuk cashier tentang:
        // 1. Pesanan baru yang perlu dikonfirmasi (pending)
        // 2. Pembayaran yang perlu diverifikasi (waiting_verification)
        // 3. Pesanan yang sudah siap dan perlu diantar (ready)
        const notifCount = response.data.filter(
          (order) =>
            order.order_status === "pending" || // Pesanan baru perlu konfirmasi
            order.payment_status === "waiting_verification" || // Pembayaran perlu verifikasi
            order.order_status === "ready" // Pesanan siap perlu diantar
        ).length;

        setNotificationCount(notifCount);
      } catch (error) {
        console.error("Failed to fetch orders count:", error);
        setIncompleteOrderCount(0);
        setNotificationCount(0);
      }
    };

    fetchIncompleteOrders();

    // Poll every 5 seconds to update count
    const interval = setInterval(fetchIncompleteOrders, 5000);
    return () => clearInterval(interval);
  }, [role]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to login even if API call fails
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const menuItems: Record<typeof role, MenuItem[]> = {
    "super-admin": [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" />, href: "/super-admin" },
      { id: "tenants", label: "Tenants", icon: <Building2 className="h-5 w-5" />, href: "/super-admin/tenants" },
      { id: "users", label: "Tenant Users", icon: <Users className="h-5 w-5" />, href: "/super-admin/users" },
      { id: "plans", label: "Paket", icon: <Package className="h-5 w-5" />, href: "/super-admin/plans" },
      { id: "subscriptions", label: "Langganan", icon: <Package className="h-5 w-5" />, href: "/super-admin/subscriptions" },
      { id: "reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" />, href: "/super-admin/reports" },
      { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" />, href: "/super-admin/settings" },
    ],
    "tenant-admin": [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" />, href: "/tenant-admin" },
      { id: "menu", label: "Menu", icon: <MenuSquare className="h-5 w-5" />, href: "/tenant-admin/menu" },
      { id: "category", label: "Kategori", icon: <FolderTree className="h-5 w-5" />, href: "/tenant-admin/category" },
      { id: "option-groups", label: "Variasi Menu", icon: <Settings2 className="h-5 w-5" />, href: "/tenant-admin/option-groups" },
      { id: "tables", label: "Meja & QR", icon: <QrCode className="h-5 w-5" />, href: "/tenant-admin/tables" },
      { id: "users", label: "Pengguna", icon: <Users className="h-5 w-5" />, href: "/tenant-admin/users" },
      { id: "orders", label: "Pesanan", icon: <ClipboardList className="h-5 w-5" />, href: "/tenant-admin/orders" },
      { id: "kds", label: "Kitchen Display", icon: <Monitor className="h-5 w-5" />, href: userData?.tenant?.slug ? `/kds/${userData.tenant.slug}` : "#" },
      { id: "reports", label: "Laporan", icon: <BarChart3 className="h-5 w-5" />, href: "/tenant-admin/reports" },
      { id: "subscription", label: "Subscription", icon: <Package className="h-5 w-5" />, href: "/tenant-admin/subscription" },
      { id: "settings", label: "Pengaturan", icon: <Settings className="h-5 w-5" />, href: "/tenant-admin/settings" },
    ],
    cashier: [
      {
        id: "orders",
        label: "Order Queue",
        icon: <ClipboardList className="h-5 w-5" />,
        href: "/cashier",
        badge: incompleteOrderCount > 0 ? incompleteOrderCount : undefined
      },
      { id: "kds", label: "Kitchen Display", icon: <Monitor className="h-5 w-5" />, href: userData?.tenant?.slug ? `/kds/${userData.tenant.slug}` : "#" },
      { id: "statistics", label: "Statistik", icon: <TrendingUp className="h-5 w-5" />, href: "/cashier/today" },
      { id: "history", label: "Riwayat Pesanan", icon: <History className="h-5 w-5" />, href: "/cashier/history" },
      {
        id: "notifications",
        label: "Notifikasi",
        icon: <Bell className="h-5 w-5" />,
        href: "/cashier/notifications",
        badge: notificationCount > 0 ? notificationCount : undefined
      },
      { id: "settings", label: "Pengaturan", icon: <Settings className="h-5 w-5" />, href: "/cashier/settings" },
    ],
  };

  const items = menuItems[role];

  // Find the most specific (longest matching) menu item for the current pathname
  const findActiveHref = () => {
    const normalizedPathname = (pathname || "/").replace(/\/$/, "") || "/";
    let bestMatch: string | null = null;
    let bestMatchLength = 0;

    for (const item of items) {
      const itemHref = (item.href || "/").replace(/\/$/, "") || "/";

      // Check for exact match (highest priority)
      if (normalizedPathname === itemHref) {
        return itemHref; // Exact match always wins
      }

      // Check for nested match (pathname starts with itemHref + "/")
      if (normalizedPathname.startsWith(itemHref + "/")) {
        // If this match is longer (more specific) than the current best, update best match
        if (itemHref.length > bestMatchLength) {
          bestMatch = itemHref;
          bestMatchLength = itemHref.length;
        }
      }
    }

    return bestMatch;
  };

  const activeHref = findActiveHref();

  const isActive = (href: string) => {
    const normalizedHref = (href || "/").replace(/\/$/, "") || "/";
    return normalizedHref === activeHref;
  };

  // Get display values - prefer API data over props
  const displayName = userData?.user.name || userName || "Admin User";
  const displayEmail = userData?.user.email || userEmail || "admin@example.com";
  const tenantName = userData?.tenant?.name;
  const displayTitle = role === "super-admin" ? "OrderOps" : tenantName || "OrderOps";
  const displaySubtitle = role === "super-admin" ? "Super Admin" : role.replace("-", " ");

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-lg lg:shadow-none",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                {isLoadingUser ? (
                  <>
                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-1.5 w-24" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-900 truncate">{displayTitle}</p>
                    <p className="text-xs text-slate-500 capitalize truncate">{displaySubtitle}</p>
                  </>
                )}
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center mx-auto">
              <QrCode className="h-5 w-5 text-white" />
            </div>
          )}
          <button
            onClick={handleToggle}
            className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition flex-shrink-0"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition group",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn("flex-shrink-0", active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-500 text-xs font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200">
          {!isCollapsed && (
            <div className="mb-3">
              {isLoadingUser ? (
                <>
                  <div className="h-4 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed w-full",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 text-slate-400" />
            )}
            {!isCollapsed && <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

