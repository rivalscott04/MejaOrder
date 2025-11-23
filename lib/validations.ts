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
    errorMap: () => ({ message: errorMessages.required("role") }),
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

