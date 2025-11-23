"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Settings, Upload, Image as ImageIcon, Save, X, Plus, Trash2, Banknote, QrCode } from "lucide-react";
import { fetchTenantSettings, updateTenantSettings, getCurrentUser, type TenantSettings, type LoginResponse } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsFormSchema, type SettingsFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payment settings state
  const [banks, setBanks] = useState<Array<{ bank: string; account_number: string; account_name: string }>>([]);
  const [qrisImageFile, setQrisImageFile] = useState<File | null>(null);
  const [qrisImagePreview, setQrisImagePreview] = useState<string | null>(null);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      logo_url: "",
      tax_percentage: 0,
    },
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTenantSettings();
      setSettings(data);
      reset({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        logo_url: data.logo_url || "",
        tax_percentage: data.tax_percentage || 0,
      });
      setImagePreview(data.logo_url || null);
      
      // Load payment settings
      setBanks(data.payment_settings?.banks || []);
      setQrisImagePreview(data.payment_settings?.qris_image || null);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Gagal memuat pengaturan tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }
      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        setError("Ukuran file maksimal 500KB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      // If no backend, create a data URL (for development)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/tenant/upload-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Gagal upload gambar");
    }

    const data = await response.json();
    return data.url || data.image_url || data.path;
  };

  const onFormSubmit = async (data: SettingsFormData) => {
    setError(null);
    setSuccess(null);

    try {
      let logoUrl = data.logo_url || "";
      let qrisImageUrl = qrisImagePreview || null;

      // Upload logo image if a new file is selected
      if (imageFile) {
        try {
          logoUrl = await uploadImage(imageFile);
        } catch (err) {
          setError("Gagal upload gambar logo. Pastikan file berupa gambar dan ukurannya maksimal 500KB");
          throw err;
        }
      }

      // Upload QRIS image if a new file is selected
      if (qrisImageFile) {
        try {
          qrisImageUrl = await uploadImage(qrisImageFile);
        } catch (err) {
          setError("Gagal upload gambar QRIS. Pastikan file berupa gambar dan ukurannya maksimal 500KB");
          throw err;
        }
      }

      const updated = await updateTenantSettings({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        logo_url: logoUrl || null,
        tax_percentage: data.tax_percentage || null,
        payment_settings: {
          banks: banks.filter(b => b.bank && b.account_number && b.account_name),
          qris_image: qrisImageUrl,
        },
      });

      setSettings(updated);
      reset({
        ...data,
        logo_url: updated.logo_url || "",
      });
      setImageFile(null);
      setQrisImageFile(null);
      setBanks(updated.payment_settings?.banks || []);
      setQrisImagePreview(updated.payment_settings?.qris_image || null);
      setSuccess("Pengaturan berhasil disimpan");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      if (!error) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
      }
    }
  };

  const handleRemoveLogo = () => {
    setImageFile(null);
    setImagePreview(null);
    reset({ ...watch(), logo_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQrisImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }
      if (file.size > 500 * 1024) {
        setError("Ukuran file maksimal 500KB");
        return;
      }
      setQrisImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrisImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleRemoveQrisImage = () => {
    setQrisImageFile(null);
    setQrisImagePreview(null);
    if (qrisFileInputRef.current) {
      qrisFileInputRef.current.value = "";
    }
  };

  const handleAddBank = () => {
    setBanks([...banks, { bank: "", account_number: "", account_name: "" }]);
  };

  const handleRemoveBank = (index: number) => {
    setBanks(banks.filter((_, i) => i !== index));
  };

  const handleBankChange = (index: number, field: string, value: string) => {
    const updated = [...banks];
    updated[index] = { ...updated[index], [field]: value };
    setBanks(updated);
  };

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Pengaturan Tenant</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola logo, nama, dan alamat tenant untuk invoice</p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="py-12 text-center text-slate-500">Memuat pengaturan...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Logo Upload */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Logo Tenant</h2>
              <p className="mb-4 text-sm text-slate-600">
                Logo akan ditampilkan di tengah header invoice (hitam putih saat dicetak)
              </p>

              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Logo preview"
                        className="h-32 w-32 rounded-lg border border-slate-200 object-contain bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview ? "Ganti Logo" : "Upload Logo"}
                  </label>
                  <p className="mt-2 text-xs text-slate-500">Format: JPG, PNG. Maksimal 500KB</p>
                </div>
              </div>
            </div>

            {/* Tenant Name */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Nama Tenant</h2>
              <p className="mb-4 text-sm text-slate-600">Nama tenant akan ditampilkan di header invoice</p>
              <input
                type="text"
                {...register("name")}
                placeholder="Masukkan nama tenant"
                className={cn(
                  "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                  errors.name ? "border-rose-300" : ""
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Alamat Tenant</h2>
              <p className="mb-4 text-sm text-slate-600">Alamat akan ditampilkan di header invoice</p>
              <textarea
                {...register("address")}
                placeholder="Masukkan alamat tenant"
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Phone */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Nomor Telepon (Opsional)</h2>
              <p className="mb-4 text-sm text-slate-600">Nomor telepon akan ditampilkan di invoice jika diisi</p>
              <input
                type="text"
                {...register("phone")}
                placeholder="Masukkan nomor telepon"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Tax Percentage */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Pajak Daerah (Per Transaksi)</h2>
              <p className="mb-4 text-sm text-slate-600">
                Persentase pajak yang akan ditambahkan ke setiap transaksi (dihitung dari total semua menu dalam 1 order)
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register("tax_percentage", { valueAsNumber: true })}
                  placeholder="0"
                  className={cn(
                    "w-32 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                    errors.tax_percentage ? "border-rose-300" : ""
                  )}
                />
                <span className="text-sm font-medium text-slate-700">%</span>
              </div>
              {errors.tax_percentage && (
                <p className="mt-1 text-xs text-rose-600">{errors.tax_percentage.message}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Contoh: 10 untuk 10% pajak. Jika total order Rp 100.000, maka pajak = Rp 10.000, total bayar = Rp 110.000
              </p>
            </div>

            {/* Payment Settings */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Pengaturan Pembayaran</h2>
              <p className="mb-6 text-sm text-slate-600">
                Konfigurasi metode pembayaran yang tersedia untuk pelanggan
              </p>

              {/* Bank Transfer Settings */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-900">Bank Transfer</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBank}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Bank
                  </button>
                </div>

                {banks.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada bank yang dikonfigurasi</p>
                ) : (
                  <div className="space-y-3">
                    {banks.map((bank, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">Bank #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBank(index)}
                            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Nama Bank</label>
                            <input
                              type="text"
                              value={bank.bank}
                              onChange={(e) => handleBankChange(index, "bank", e.target.value)}
                              placeholder="Contoh: BCA"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Nomor Rekening</label>
                            <input
                              type="text"
                              value={bank.account_number}
                              onChange={(e) => handleBankChange(index, "account_number", e.target.value)}
                              placeholder="Contoh: 1234567890"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Atas Nama</label>
                            <input
                              type="text"
                              value={bank.account_name}
                              onChange={(e) => handleBankChange(index, "account_name", e.target.value)}
                              placeholder="Contoh: Nama Tenant"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QRIS Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-900">QRIS Image</h3>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {qrisImagePreview ? (
                      <div className="relative">
                        <img
                          src={qrisImagePreview}
                          alt="QRIS preview"
                          className="h-48 w-48 rounded-lg border border-slate-200 object-contain bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveQrisImage}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                        <QrCode className="h-12 w-12 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={qrisFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrisImageChange}
                      className="hidden"
                      id="qris-upload"
                    />
                    <label
                      htmlFor="qris-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      <Upload className="h-4 w-4" />
                      {qrisImagePreview ? "Ganti QRIS Image" : "Upload QRIS Image"}
                    </label>
                    <p className="mt-2 text-xs text-slate-500">Format: JPG, PNG. Maksimal 500KB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
