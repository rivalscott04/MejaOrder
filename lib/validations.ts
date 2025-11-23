import { z } from "zod";

// Helper untuk pesan error yang sopan dan mudah dipahami
const errorMessages = {
  required: (field: string) => `Mohon isi ${field}`,
  email: "Mohon masukkan alamat email yang benar",
  minLength: (field: string, min: number) => `${field} minimal ${min} karakter`,
  maxLength: (field: string, max: number) => `${field} maksimal ${max} karakter`,
  invalidFormat: (field: string) => `Format ${field} tidak sesuai`,
  passwordMismatch: "Password yang Anda masukkan tidak sama",
  invalidNumber: (field: string) => `Mohon masukkan ${field} yang valid`,
  minValue: (field: string, min: number) => `${field} minimal ${min}`,
  maxValue: (field: string, max: number) => `${field} maksimal ${max}`,
};

// Schema untuk Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, errorMessages.required("email"))
    .email(errorMessages.email),
  password: z
    .string()
    .min(1, errorMessages.required("password"))
    .min(6, errorMessages.minLength("Password", 6)),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema untuk Register
export const registerSchema = z
  .object({
    tenantName: z
      .string()
      .min(1, errorMessages.required("nama tenant"))
      .min(3, "Nama tenant minimal 3 karakter"),
    tenantSlug: z
      .string()
      .min(1, errorMessages.required("slug tenant"))
      .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)"),
    adminName: z
      .string()
      .min(1, errorMessages.required("nama admin"))
      .min(2, "Nama admin minimal 2 karakter"),
    adminEmail: z
      .string()
      .min(1, errorMessages.required("email admin"))
      .email(errorMessages.email),
    password: z
      .string()
      .min(1, errorMessages.required("password"))
      .min(6, errorMessages.minLength("Password", 6)),
    confirmPassword: z
      .string()
      .min(1, errorMessages.required("konfirmasi password")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errorMessages.passwordMismatch,
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Base schema untuk User Form
const userFormBaseSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.required("nama"))
    .min(2, "Nama minimal 2 karakter"),
  email: z
    .string()
    .min(1, errorMessages.required("email"))
    .email(errorMessages.email),
  role: z.enum(["tenant_admin", "cashier"], {
    message: errorMessages.required("role"),
  }),
  is_active: z.boolean(),
});

// Schema untuk Create User (password wajib)
export const createUserFormSchema = userFormBaseSchema.extend({
  password: z
    .string()
    .min(1, errorMessages.required("password"))
    .min(6, errorMessages.minLength("Password", 6)),
});

// Schema untuk Update User (password optional)
export const updateUserFormSchema = userFormBaseSchema.extend({
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        // Jika diisi, minimal 6 karakter
        return !val || val.length >= 6;
      },
      {
        message: errorMessages.minLength("Password", 6),
      }
    ),
});

export type UserFormData = z.infer<typeof createUserFormSchema> | z.infer<typeof updateUserFormSchema>;

// Schema untuk Table Form
export const tableFormSchema = z.object({
  table_number: z
    .string()
    .min(1, errorMessages.required("nomor meja"))
    .min(1, "Nomor meja tidak boleh kosong"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

export type TableFormData = z.infer<typeof tableFormSchema>;

// Schema untuk Menu Form
export const menuFormSchema = z.object({
  category_id: z
    .number()
    .min(1, errorMessages.required("kategori")),
  name: z
    .string()
    .min(1, errorMessages.required("nama menu"))
    .min(2, "Nama menu minimal 2 karakter"),
  description: z.string().optional(),
  price: z
    .number()
    .min(0, "Harga tidak boleh negatif")
    .min(1, errorMessages.required("harga")),
  image_url: z.string().optional(),
  is_available: z.boolean(),
  stock: z.number().nullable().optional(),
  sku: z.string().optional(),
  option_group_ids: z.array(z.number()).optional(),
});

export type MenuFormData = z.infer<typeof menuFormSchema>;

// Schema untuk Settings Form
export const settingsFormSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.required("nama tenant"))
    .min(2, "Nama tenant minimal 2 karakter"),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo_url: z.string().optional().nullable(),
  tax_percentage: z
    .number()
    .min(0, "Persentase pajak tidak boleh negatif")
    .max(100, "Persentase pajak maksimal 100%"),
});

export type SettingsFormData = z.infer<typeof settingsFormSchema>;

// Schema untuk Tenant Form (Super Admin)
const tenantFormBaseSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.required("nama tenant"))
    .min(2, "Nama tenant minimal 2 karakter")
    .max(150, errorMessages.maxLength("Nama tenant", 150)),
  slug: z
    .string()
    .min(1, errorMessages.required("slug tenant"))
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)")
    .max(150, errorMessages.maxLength("Slug", 150)),
  logo_url: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable().max(50, errorMessages.maxLength("Nomor telepon", 50)),
  timezone: z.string().optional().max(50, errorMessages.maxLength("Timezone", 50)),
  is_active: z.boolean(),
});

export const createTenantFormSchema = tenantFormBaseSchema;
export const updateTenantFormSchema = tenantFormBaseSchema.partial().extend({
  name: z
    .string()
    .min(2, "Nama tenant minimal 2 karakter")
    .max(150, errorMessages.maxLength("Nama tenant", 150))
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)")
    .max(150, errorMessages.maxLength("Slug", 150))
    .optional(),
});

export type TenantFormData = z.infer<typeof createTenantFormSchema> | z.infer<typeof updateTenantFormSchema>;

// Schema untuk Plan/Pricing Form (Super Admin)
const planFormBaseSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.required("nama plan"))
    .min(2, "Nama plan minimal 2 karakter")
    .max(100, errorMessages.maxLength("Nama plan", 100)),
  description: z.string().optional().nullable(),
  price_monthly: z
    .number()
    .min(0, "Harga bulanan tidak boleh negatif")
    .min(1, errorMessages.required("harga bulanan")),
  price_yearly: z.number().min(0, "Harga tahunan tidak boleh negatif").optional().nullable(),
  max_tenants: z.number().min(0, "Maksimal tenant tidak boleh negatif").optional().nullable(),
  max_users: z.number().min(0, "Maksimal user tidak boleh negatif").optional().nullable(),
  max_menus: z.number().min(0, "Maksimal menu tidak boleh negatif").optional().nullable(),
  features_json: z.array(z.string()).optional().nullable(),
  discount_percentage: z
    .number()
    .min(0, "Diskon persentase tidak boleh negatif")
    .max(100, "Diskon persentase maksimal 100%")
    .optional()
    .nullable(),
  discount_amount: z
    .number()
    .min(0, "Diskon nominal tidak boleh negatif")
    .optional()
    .nullable(),
  discount_start_date: z.string().optional().nullable(),
  discount_end_date: z.string().optional().nullable(),
  is_active: z.boolean(),
}).refine(
  (data) => {
    // Jika discount_end_date ada, harus setelah discount_start_date
    if (data.discount_start_date && data.discount_end_date) {
      return new Date(data.discount_end_date) >= new Date(data.discount_start_date);
    }
    return true;
  },
  {
    message: "Tanggal akhir diskon harus setelah tanggal mulai",
    path: ["discount_end_date"],
  }
);

export const createPlanFormSchema = planFormBaseSchema;
export const updatePlanFormSchema = planFormBaseSchema.partial().extend({
  name: z
    .string()
    .min(2, "Nama plan minimal 2 karakter")
    .max(100, errorMessages.maxLength("Nama plan", 100))
    .optional(),
  price_monthly: z
    .number()
    .min(0, "Harga bulanan tidak boleh negatif")
    .optional(),
});

export type PlanFormData = z.infer<typeof createPlanFormSchema> | z.infer<typeof updatePlanFormSchema>;

