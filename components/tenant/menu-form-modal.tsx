"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { cn, formatPriceInput, parsePriceInput } from "@/lib/utils";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import type { Menu, CreateMenuPayload, UpdateMenuPayload, Category, OptionGroup } from "@/lib/api-client";
import { fetchCategories, fetchOptionGroups } from "@/lib/api-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { menuFormSchema, type MenuFormData } from "@/lib/validations";

type MenuFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMenuPayload | UpdateMenuPayload) => Promise<void>;
  menu?: Menu | null;
};

export function MenuFormModal({ isOpen, onClose, onSubmit, menu }: MenuFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      category_id: 0,
      name: "",
      description: "",
      price: 0,
      image_url: "",
      is_available: true,
      stock: null,
      sku: "",
      option_group_ids: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (menu) {
        reset({
          category_id: menu.category_id,
          name: menu.name,
          description: menu.description || "",
          price: parseFloat(menu.price),
          image_url: menu.image_url || "",
          is_available: menu.is_available ?? true,
          stock: menu.stock ?? null,
          sku: menu.sku || "",
          option_group_ids: menu.option_groups?.map((og) => og.id) || [],
        });
        setImagePreview(menu.image_url || null);
        setImageFile(null);
      } else {
        reset({
          category_id: 0,
          name: "",
          description: "",
          price: 0,
          image_url: "",
          is_available: true,
          stock: null,
          sku: "",
          option_group_ids: [],
        });
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [isOpen, menu, reset]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [cats, opts] = await Promise.all([fetchCategories(), fetchOptionGroups()]);
      setCategories(cats);
      setOptionGroups(opts);
    } catch (err) {
      console.error("Failed to load data:", err);
      // Error akan ditangani oleh parent component jika diperlukan
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }
      // Validate file size (max 350KB)
      if (file.size > 350 * 1024) {
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const onFormSubmit = async (data: MenuFormData) => {
    try {
      let imageUrl = data.image_url || "";

      // Upload image if a new file is selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (err) {
          setIsUploadingImage(false);
          throw new Error("Gagal upload gambar. Pastikan file berupa gambar dan ukurannya maksimal 350KB");
        } finally {
          setIsUploadingImage(false);
        }
      }

      const payload: CreateMenuPayload | UpdateMenuPayload = {
        ...data,
        image_url: imageUrl,
        price: Number(data.price),
        stock: data.stock !== null ? Number(data.stock) : undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      // Error akan ditangani oleh parent component
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {menu ? "Edit Menu" : "Tambah Menu Baru"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {isLoadingData ? (
            <div className="py-8 text-center text-slate-500">Memuat data...</div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("category_id", { valueAsNumber: true })}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                    errors.category_id ? "border-rose-300" : ""
                  )}
                >
                  <option value={0}>Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-xs text-rose-600">{errors.category_id.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                    errors.name ? "border-rose-300" : ""
                  )}
                  placeholder="Contoh: Brew Haven Latte"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Deskripsi</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Deskripsi menu..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        value={formatPriceInput(field.value)}
                        onChange={(e) => {
                          const price = parsePriceInput(e.target.value);
                          field.onChange(price);
                        }}
                        onBlur={() => {
                          const price = watch("price");
                          if (price < 0) {
                            setValue("price", 0);
                          }
                        }}
                        className={cn(
                          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                          errors.price ? "border-rose-300" : ""
                        )}
                        placeholder="0"
                      />
                    )}
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-rose-600">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Stok</label>
                  <input
                    type="number"
                    min="0"
                    {...register("stock", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Kosongkan jika unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">SKU</label>
                <input
                  type="text"
                  {...register("sku")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Kode SKU (opsional)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Gambar Menu</label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full rounded-xl object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white transition hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 transition hover:border-emerald-500 hover:bg-emerald-50"
                    >
                      <Upload className="mb-2 h-10 w-10 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-600">Klik untuk upload gambar</p>
                      <p className="mt-1 text-xs text-slate-500">JPG, PNG, atau WEBP (max 350KB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {!imagePreview && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Pilih Gambar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Option Groups</label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {optionGroups.length === 0 ? (
                    <p className="text-sm text-slate-500">Tidak ada option group</p>
                  ) : (
                    optionGroups.map((group) => {
                      const optionGroupIds = watch("option_group_ids") || [];
                      return (
                        <label key={group.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={optionGroupIds.includes(group.id)}
                            onChange={(e) => {
                              const ids = optionGroupIds;
                              if (e.target.checked) {
                                setValue("option_group_ids", [...ids, group.id]);
                              } else {
                                setValue(
                                  "option_group_ids",
                                  ids.filter((id) => id !== group.id)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">{group.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Tampilkan di Menu:</label>
                  <Controller
                    name="is_available"
                    control={control}
                    render={({ field }) => (
                      <ToggleSwitch
                        checked={field.value ?? true}
                        onChange={field.onChange}
                        size="sm"
                      />
                    )}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {watch("is_available")
                    ? "Menu akan ditampilkan untuk pelanggan"
                    : "Menu akan disembunyikan dari pelanggan"}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage
                    ? "Mengunggah gambar..."
                    : isSubmitting
                      ? "Menyimpan..."
                      : menu
                        ? "Update"
                        : "Simpan"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

