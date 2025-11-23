"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { fetchOrders, getCurrentUser, type Order, type LoginResponse } from "@/lib/api-client";
import { currencyFormatter, formatTime, cn, formatOrderCode } from "@/lib/utils";
import { Bell, CheckCircle2, AlertCircle, Clock, XCircle, Package } from "lucide-react";

type Notification = {
  id: string;
  type: "new_order" | "payment_waiting" | "order_ready" | "order_completed";
  title: string;
  message: string;
  orderId: number;
  orderCode: string;
  timestamp: string;
  isRead: boolean;
};

export default function CashierNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getCurrentUser();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    loadUserData();
  }, []);

  // Generate notifications from orders
  const generateNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const response = await fetchOrders({ date: today });
      const orders = response.data;

      const notifs: Notification[] = [];

      orders.forEach((order) => {
        // New order (pending)
        if (order.order_status === "pending") {
          notifs.push({
            id: `new-${order.id}`,
            type: "new_order",
            title: "Pesanan Baru",
            message: `Pesanan ${formatOrderCode(order.order_code)} dari Meja ${order.table?.number || "-"} menunggu konfirmasi`,
            orderId: order.id,
            orderCode: order.order_code,
            timestamp: order.created_at,
            isRead: false,
          });
        }

        // Payment waiting verification
        if (order.payment_status === "waiting_verification") {
          notifs.push({
            id: `payment-${order.id}`,
            type: "payment_waiting",
            title: "Menunggu Verifikasi Pembayaran",
            message: `Pesanan ${formatOrderCode(order.order_code)} menunggu verifikasi pembayaran ${order.payment_method.toUpperCase()}`,
            orderId: order.id,
            orderCode: order.order_code,
            timestamp: order.created_at,
            isRead: false,
          });
        }

        // Order ready
        if (order.order_status === "ready") {
          notifs.push({
            id: `ready-${order.id}`,
            type: "order_ready",
            title: "Pesanan Siap",
            message: `Pesanan ${formatOrderCode(order.order_code)} sudah siap untuk diantar`,
            orderId: order.id,
            orderCode: order.order_code,
            timestamp: order.updated_at,
            isRead: false,
          });
        }
      });

      // Sort by timestamp (newest first)
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(notifs);
    } catch (error) {
      console.error("Failed to generate notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateNotifications();
    // Polling every 5 seconds
    const interval = setInterval(generateNotifications, 5000);
    return () => clearInterval(interval);
  }, [generateNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "new_order":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "payment_waiting":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "order_ready":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "order_completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-600" />;
    }
  };

  const getNotificationBg = (type: Notification["type"]) => {
    switch (type) {
      case "new_order":
        return "bg-blue-50 border-blue-200";
      case "payment_waiting":
        return "bg-amber-50 border-amber-200";
      case "order_ready":
        return "bg-emerald-50 border-emerald-200";
      case "order_completed":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <DashboardLayout role="cashier" userEmail={userData?.user.email} userName={userData?.user.name}>
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Notifikasi</h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="py-12 text-center text-sm text-slate-500">Memuat notifikasi...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">Tidak ada notifikasi</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "rounded-xl border-2 p-4 cursor-pointer transition",
                  notif.isRead
                    ? "bg-white border-slate-200"
                    : `${getNotificationBg(notif.type)} border-opacity-50`
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-full p-2", notif.isRead ? "bg-slate-100" : getNotificationBg(notif.type))}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                        <p className="mt-1 text-xs text-slate-600">{notif.message}</p>
                        <p className="mt-2 text-xs text-slate-400">{formatTime(notif.timestamp)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 ml-2 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

