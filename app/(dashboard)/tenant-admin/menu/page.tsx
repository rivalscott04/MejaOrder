"use client";

import { useState, useEffect, useMemo } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { tenantContext, tenantMenuGrid } from "@/lib/mock-data";
import { cn, currencyFormatter, calculateMenuBadges, isBestSellerMenu, isRecommendedMenu } from "@/lib/utils";
import { MenuSquare, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { MenuFormModal } from "@/components/tenant/menu-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import {
  fetchMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuAvailability,
  fetchCategories,
  type Menu,
  type Category,
} from "@/lib/api-client";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import { MenuGridSkeleton } from "@/components/shared/menu-skeleton";

type BadgeFilter = "all" | "terlaris" | "baru" | "layak-dicoba";

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadMenus();
    loadCategories();
  }, [currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, badgeFilter]);

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const loadMenus = async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        // Fallback to mock data
        const mockMenus = tenantMenuGrid.map((m) => ({
          id: m.id,
          tenant_id: m.tenantId,
          category_id: m.categoryId,
          name: m.name,
          description: m.description,
          price: m.price.toString(),
          image_url: m.imageUrl,
          is_available: m.isAvailable,
          stock: null,
          sku: null,
          option_groups: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setMenus(mockMenus);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: mockMenus.length,
        });
        setIsLoading(false);
        return;
      }
      const response = await fetchMenus(page, 20);
      setMenus(response.data || []);
      setPagination({
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || 20,
        total: response.total || 0,
      });
    } catch (err) {
      console.error("Failed to fetch menus:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat menu");
      // Fallback to mock data
      const mockMenus = tenantMenuGrid.map((m) => ({
        id: m.id,
        tenant_id: m.tenantId,
        category_id: m.categoryId,
        name: m.name,
        description: m.description,
        price: m.price.toString(),
        image_url: m.imageUrl,
        is_available: m.isAvailable,
        stock: null,
        sku: null,
        option_groups: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      setMenus(mockMenus);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: mockMenus.length,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedMenu(null);
    setShowModal(true);
  };

  const handleEdit = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowModal(true);
  };

  const handleSubmit = async (payload: any) => {
    try {
      if (selectedMenu) {
        await updateMenu(selectedMenu.id, payload);
      } else {
        await createMenu(payload);
      }
      await loadMenus(currentPage);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (menuId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Menu",
      message: "Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan.",
      variant: "danger",
      onConfirm: async () => {
        setIsConfirmingDelete(true);
        setIsDeleting(menuId);
        try {
          await deleteMenu(menuId);
          await loadMenus(currentPage);
          setConfirmModal({ ...confirmModal, isOpen: false });
          setAlertModal({
            isOpen: true,
            title: "Berhasil",
            message: "Menu berhasil dihapus",
            variant: "success",
          });
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: "Gagal Menghapus",
            message: err instanceof Error ? err.message : "Gagal menghapus menu. Silakan coba lagi.",
            variant: "error",
          });
        } finally {
          setIsDeleting(null);
          setIsConfirmingDelete(false);
        }
      },
    });
  };

  const handleToggle = async (menuId: number) => {
    setIsToggling(menuId);
    try {
      await toggleMenuAvailability(menuId);
      await loadMenus(currentPage);
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal mengubah status menu. Silakan coba lagi.",
        variant: "error",
      });
    } finally {
      setIsToggling(null);
    }
  };

  // Filter menus berdasarkan kategori dan badge
  const filteredMenus = useMemo(() => {
    let filtered = menus;

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((menu) => menu.category_id === categoryFilter);
    }

    // Filter by badge
    if (badgeFilter !== "all") {
      filtered = filtered.filter((menu) => {
        // Use badges from backend if available, otherwise calculate
        const badges = (menu as any).badges || calculateMenuBadges(menu.created_at);
        
        if (badgeFilter === "terlaris") {
          return badges.includes("Terlaris");
        } else if (badgeFilter === "baru") {
          return badges.includes("Baru");
        } else if (badgeFilter === "layak-dicoba") {
          return badges.includes("Layak Dicoba");
        }
        return true;
      });
    }

    return filtered;
  }, [menus, categoryFilter, badgeFilter]);

  // Get badges for a menu
  const getMenuBadges = (menu: Menu): string[] => {
    // Use badges from backend if available, otherwise calculate
    if ((menu as any).badges) {
      return (menu as any).badges;
    }
    const badges = calculateMenuBadges(menu.created_at);
    if (isBestSellerMenu(menu.id)) badges.push("Terlaris");
    if (isRecommendedMenu(menu.id, menu.created_at)) badges.push("Layak Dicoba");
    return badges;
  };

  return (
    <DashboardLayout role="tenant-admin" userEmail="admin@brewhaven.id" userName="Admin BrewHaven">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Menu Management</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola menu dan ketersediaan produk</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <SectionTitle icon={<MenuSquare className="h-4 w-4" />} title="Menu Management" />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Menu
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {/* Filters */}
          {!isLoading && menus.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Filter Kategori</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                      categoryFilter === "all"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Semua
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setCategoryFilter(category.id)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                        categoryFilter === category.id
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Filter */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Filter Badge</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(["all", "terlaris", "baru", "layak-dicoba"] as BadgeFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBadgeFilter(filter)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                        badgeFilter === filter
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {filter === "all"
                        ? "Semua"
                        : filter === "terlaris"
                          ? "Terlaris"
                          : filter === "baru"
                            ? "Baru"
                            : "Layak Dicoba"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <MenuGridSkeleton count={6} />
          ) : menus.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada menu</div>
          ) : filteredMenus.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada menu yang sesuai dengan filter</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredMenus.map((menu) => {
                  const badges = getMenuBadges(menu);
                  return (
                  <div
                    key={menu.id}
                    className={cn(
                      "rounded-2xl border p-4",
                      !menu.is_available && "opacity-60",
                      menu.is_available ? "border-slate-200" : "border-amber-200 bg-amber-50"
                    )}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{menu.name}</h3>
                        {badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {currencyFormatter.format(parseFloat(menu.price))}
                      </p>
                      {menu.description && (
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{menu.description}</p>
                      )}
                      {!menu.is_available && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">Tidak Tersedia</p>
                      )}
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">Tampilkan di Menu:</span>
                          <ToggleSwitch
                            checked={menu.is_available}
                            onChange={() => handleToggle(menu.id)}
                            size="sm"
                            disabled={isToggling === menu.id}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {menu.is_available ? "Menu ditampilkan untuk pelanggan" : "Menu disembunyikan dari pelanggan"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(menu)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Edit className="mr-1 inline h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          disabled={isDeleting === menu.id}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 flex items-center justify-center"
                        >
                          {isDeleting === menu.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="text-sm text-slate-600">
                    Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} menu
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      disabled={currentPage === 1 || isLoading}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition",
                        currentPage === 1 || isLoading
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            disabled={isLoading}
                            className={cn(
                              "h-9 w-9 rounded-lg text-sm font-semibold transition",
                              currentPage === pageNum
                                ? "bg-emerald-500 text-white"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                              isLoading && "cursor-not-allowed opacity-50"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        if (currentPage < pagination.last_page) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      disabled={currentPage === pagination.last_page || isLoading}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition",
                        currentPage === pagination.last_page || isLoading
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-slate-50"
                      )}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <MenuFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedMenu(null);
          }}
          onSubmit={handleSubmit}
          menu={selectedMenu}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => {
            if (!isConfirmingDelete) {
              setConfirmModal({ ...confirmModal, isOpen: false });
            }
          }}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          isLoading={isConfirmingDelete}
        />

        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
          variant={alertModal.variant}
        />
      </div>
    </DashboardLayout>
  );
}

