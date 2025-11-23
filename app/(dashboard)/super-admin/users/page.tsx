"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";
import { Users, Plus, Edit as EditIcon, Power, PowerOff, Loader2, Building2, Search } from "lucide-react";
import { UserFormModal } from "@/components/tenant/user-form-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import { TableSkeleton } from "@/components/shared/menu-skeleton";
import {
  fetchSuperAdminTenants,
  type SuperAdminTenant,
} from "@/lib/api-client";

type TenantUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  tenant_id: number;
};

export default function SuperAdminUsersPage() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadUsers(selectedTenantId);
    } else {
      setUsers([]);
    }
  }, [selectedTenantId]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const response = await fetchSuperAdminTenants();
      setTenants(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTenantId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async (tenantId: number) => {
    setIsLoadingUsers(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const base = backendUrl.replace(/\/$/, "");
      // Switch to tenant context
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) {
        throw new Error("Tenant not found");
      }

      // Fetch users from tenant
      const response = await fetch(`${base}/api/tenant/users?tenant_id=${tenantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Gagal memuat users");
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat users");
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreate = () => {
    if (!selectedTenantId) {
      setAlertModal({
        isOpen: true,
        title: "Peringatan",
        message: "Pilih tenant terlebih dahulu",
        variant: "warning",
      });
      return;
    }
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (payload: any) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const base = backendUrl.replace(/\/$/, "");
      const url = selectedUser
        ? `${base}/api/tenant/users/${selectedUser.id}`
        : `${base}/api/tenant/users`;

      const response = await fetch(url, {
        method: selectedUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          tenant_id: selectedTenantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Gagal menyimpan user");
      }

      if (selectedTenantId) {
        await loadUsers(selectedTenantId);
      }
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      throw err;
    }
  };

  const handleToggleStatus = async (userId: number) => {
    setIsToggling(userId);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const base = backendUrl.replace(/\/$/, "");
      const response = await fetch(`${base}/api/tenant/users/${userId}/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Gagal mengubah status user");
      }

      if (selectedTenantId) {
        await loadUsers(selectedTenantId);
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal mengubah status pengguna. Silakan coba lagi.",
        variant: "error",
      });
    } finally {
      setIsToggling(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Tenant Users</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola pengguna dari semua tenant. Pilih tenant untuk melihat dan mengelola users-nya, termasuk reset password dan mengubah status.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SectionTitle icon={<Users className="h-4 w-4" />} title="Tenant Users" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedTenantId || ""}
                  onChange={(e) => setSelectedTenantId(Number(e.target.value) || null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Pilih Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTenantId && (
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-600 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Tambah User
                </button>
              )}
            </div>
          </div>

          {selectedTenantId && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {isLoading || isLoadingUsers ? (
            <TableSkeleton rows={5} columns={5} />
          ) : !selectedTenantId ? (
            <div className="py-12 text-center text-slate-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Pilih tenant untuk melihat users</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {searchQuery ? "Tidak ada user yang sesuai dengan pencarian" : "Tidak ada pengguna di tenant ini"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3">Nama</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="py-4 font-semibold text-slate-900">{user.name}</td>
                      <td className="py-4 text-slate-600">{user.email}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            user.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="group relative flex items-center justify-center rounded-lg p-2 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-110 active:scale-95 cursor-pointer"
                            title="Edit User"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={isToggling === user.id}
                            className="group relative flex items-center justify-center rounded-lg p-2 text-amber-600 transition-all duration-200 hover:bg-amber-50 hover:text-amber-700 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer"
                            title={user.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {isToggling === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedTenantId && (
        <UserFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmit}
          user={selectedUser}
        />
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </DashboardLayout>
  );
}

