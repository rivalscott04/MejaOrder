"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { tenantUsers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Users, Plus, Edit as EditIcon, Power, PowerOff } from "lucide-react";
import { UserFormModal } from "@/components/tenant/user-form-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import { TableSkeleton } from "@/components/shared/menu-skeleton";
import {
  fetchUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  type TenantUser,
} from "@/lib/api-client";

export default function UsersPage() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        // Fallback to mock data
        setUsers(
          tenantUsers.map((u) => ({
            id: u.id,
            tenant_id: 1,
            name: u.name,
            email: u.email,
            role: u.role,
            is_active: u.status === "active",
            created_at: u.lastActive,
            updated_at: u.lastActive,
          }))
        );
        return;
      }
      const response = await fetchUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat pengguna");
      // Fallback to mock data
      setUsers(
        tenantUsers.map((u) => ({
          id: u.id,
          tenant_id: 1,
          name: u.name,
          email: u.email,
          role: u.role,
          is_active: u.status === "active",
          created_at: u.lastActive,
          updated_at: u.lastActive,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (payload: any) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, payload);
      } else {
        await createUser(payload);
      }
      await loadUsers();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await toggleUserStatus(userId);
      await loadUsers();
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal mengubah status pengguna. Silakan coba lagi.",
        variant: "error",
      });
    }
  };

  return (
    <DashboardLayout role="tenant-admin" userEmail="admin@brewhaven.id" userName="Admin BrewHaven">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">User Management</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola pengguna dan akses sistem</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <SectionTitle icon={<Users className="h-4 w-4" />} title="User Management" />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada pengguna</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3">Nama</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="py-4 font-semibold text-slate-900">{user.name}</td>
                      <td className="py-4 text-slate-600">{user.email}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
                          {user.role === "tenant_admin" ? "Admin" : "Kasir"}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            user.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {user.is_active ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            <EditIcon className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-700"
                          >
                            {user.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4" />
                                Aktifkan
                              </>
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

        <UserFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmit}
          user={selectedUser}
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

