// API client utilities for frontend

import { categories } from "./mock-data";

export const getBackendUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
};

const getAuthHeaders = () => {
  // In production, get token from auth context/cookies
  // For now, return empty headers (backend should handle auth via cookies/sessions)
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

// ==================== AUTH API ====================

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "tenant_admin" | "cashier" | "super_admin";
  tenant_id: number;
};

export type AuthTenant = {
  id: number;
  name: string;
  slug: string;
};

export type LoginResponse = {
  user: AuthUser;
  tenant: AuthTenant;
};

export type RegisterPayload = {
  tenant_name: string;
  tenant_slug: string;
  admin_name: string;
  admin_email: string;
  password: string;
  password_confirmation: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Login failed: ${response.statusText}`);
  }

  return response.json();
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/auth/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Registration failed: ${response.statusText}`);
  }

  return response.json();
}

export async function logout(): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/auth/logout`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.statusText}`);
  }
}

export async function getCurrentUser(): Promise<LoginResponse | null> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    return null;
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/auth/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export type OrderItem = {
  id: number;
  menu_id: number;
  menu_name_snapshot: string;
  price_snapshot: string;
  qty: number;
  subtotal: string;
  item_note?: string | null;
  options?: Array<{
    id: number;
    option_group_name_snapshot: string;
    option_item_label_snapshot: string;
    extra_price_snapshot: string;
  }>;
};

export type Order = {
  id: number;
  tenant_id: number;
  table_id: number;
  order_code: string;
  total_amount: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  customer_name?: string | null;
  customer_note?: string | null;
  invoice_printed_at?: string | null;
  created_at: string;
  updated_at: string;
  table?: {
    id: number;
    number: string;
    description?: string | null;
  };
  items?: OrderItem[];
  payments?: Array<{
    id: number;
    amount: string;
    method: string;
    proof_url?: string | null;
    verified_at?: string | null;
    verifier?: {
      id: number;
      name: string;
      email: string;
    } | null;
  }>;
};

export type OrdersResponse = {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export async function fetchOrders(params?: {
  order_status?: string;
  payment_status?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  all?: boolean;
}): Promise<OrdersResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const queryParams = new URLSearchParams();
  if (params?.order_status) queryParams.append("order_status", params.order_status);
  if (params?.payment_status) queryParams.append("payment_status", params.payment_status);
  if (params?.date) queryParams.append("date", params.date);
  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.all) queryParams.append("all", "true");

  const url = `${base}/api/cashier/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch completed orders for reports and summaries.
 * This endpoint returns only orders with status "completed" that are excluded from the order queue.
 */
export async function fetchCompletedOrders(params?: {
  payment_status?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  all?: boolean;
}): Promise<OrdersResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const queryParams = new URLSearchParams();
  if (params?.payment_status) queryParams.append("payment_status", params.payment_status);
  if (params?.date) queryParams.append("date", params.date);
  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.all) queryParams.append("all", "true");

  const url = `${base}/api/cashier/orders/completed${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch completed orders: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchOrderDetail(orderId: number): Promise<Order> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/cashier/orders/${orderId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order detail: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOrderStatus(orderId: number, orderStatus: string, note?: string, force?: boolean): Promise<Order> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/cashier/orders/${orderId}/status`;

  const body: { order_status: string; note?: string; force?: boolean } = { order_status: orderStatus };
  if (note) body.note = note;
  if (force !== undefined) body.force = force;

  const response = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update order status: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOrderPaymentStatus(orderId: number, paymentStatus: string): Promise<{ payment_status: string }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/cashier/orders/${orderId}/payment-status`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ payment_status: paymentStatus }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update payment status: ${response.statusText}`);
  }

  return response.json();
}

export async function markInvoicePrinted(orderId: number): Promise<{ invoice_printed_at: string }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/cashier/orders/${orderId}/mark-invoice-printed`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to mark invoice as printed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== MENU API ====================

export type Menu = {
  id: number;
  tenant_id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: string;
  image_url?: string | null;
  is_available: boolean;
  stock?: number | null;
  sku?: string | null;
  option_groups?: Array<{ id: number }>;
  created_at: string;
  updated_at: string;
  badges?: string[]; // Badges from backend (Terlaris, Baru, Layak Dicoba)
  sales_count?: number; // Sales count for statistics
};

export type MenuResponse = {
  data: Menu[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateMenuPayload = {
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  stock?: number;
  sku?: string;
  option_group_ids?: number[];
};

export type UpdateMenuPayload = Partial<CreateMenuPayload>;

export async function fetchMenus(page: number = 1, perPage: number = 20): Promise<MenuResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus?page=${page}&per_page=${perPage}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch menus: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchMenu(menuId: number): Promise<Menu> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus/${menuId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.statusText}`);
  }

  return response.json();
}

export async function createMenu(payload: CreateMenuPayload): Promise<Menu> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create menu: ${response.statusText}`);
  }

  return response.json();
}

export async function updateMenu(menuId: number, payload: UpdateMenuPayload): Promise<Menu> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus/${menuId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update menu: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteMenu(menuId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus/${menuId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete menu: ${response.statusText}`);
  }
}

export async function toggleMenuAvailability(menuId: number): Promise<{ is_available: boolean }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/menus/${menuId}/toggle-availability`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle menu availability: ${response.statusText}`);
  }

  return response.json();
}

// ==================== TABLE API ====================

export type Table = {
  id: number;
  tenant_id: number;
  table_number: string;
  description?: string | null;
  qr_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TableResponse = {
  data: Table[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateTablePayload = {
  table_number: string;
  description?: string | null;
  is_active?: boolean;
};

export type UpdateTablePayload = {
  table_number?: string;
  description?: string | null;
  is_active?: boolean;
};

export async function fetchTables(): Promise<TableResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tables: ${response.statusText}`);
  }

  return response.json();
}

export async function createTable(payload: CreateTablePayload): Promise<Table> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create table: ${response.statusText}`);
  }

  return response.json();
}

export async function updateTable(tableId: number, payload: UpdateTablePayload): Promise<Table> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables/${tableId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update table: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteTable(tableId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables/${tableId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete table: ${response.statusText}`);
  }
}

export async function regenerateTableQr(tableId: number): Promise<{ qr_token: string }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables/${tableId}/regenerate-qr`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to regenerate QR: ${response.statusText}`);
  }

  return response.json();
}

export type PrintQrResponse = {
  table_number: string;
  qr_token: string;
  qr_url: string;
  tenant_name: string;
};

export async function printTableQr(tableId: number): Promise<PrintQrResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables/${tableId}/print-qr`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to get QR data: ${response.statusText}`);
  }

  return response.json();
}

export async function downloadTableQr(tableId: number): Promise<Blob> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/tables/${tableId}/download-qr`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to download QR: ${response.statusText}`);
  }

  return response.blob();
}

// ==================== USER API ====================

export type TenantUser = {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: "tenant_admin" | "cashier";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserResponse = {
  data: TenantUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: "tenant_admin" | "cashier";
  is_active?: boolean;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: "tenant_admin" | "cashier";
  is_active?: boolean;
};

export async function fetchUsers(params?: { role?: string }): Promise<UserResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append("role", params.role);

  const url = `${base}/api/tenant/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

export async function createUser(payload: CreateUserPayload): Promise<TenantUser> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/users`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create user: ${response.statusText}`);
  }

  return response.json();
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<TenantUser> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/users/${userId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update user: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleUserStatus(userId: number): Promise<{ is_active: boolean }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/users/${userId}/toggle-status`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle user status: ${response.statusText}`);
  }

  return response.json();
}

// ==================== TENANT SETTINGS API ====================

export type TenantSettings = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  tax_percentage: number;
  payment_settings?: {
    banks?: Array<{
      bank: string;
      account_number: string;
      account_name: string;
    }>;
    qris_image?: string | null;
  };
  maintenance_mode?: {
    is_enabled: boolean;
    message: string | null;
    image_url: string | null;
    estimated_completion_at: string | null;
  };
  is_active: boolean;
  subscription?: {
    plan: string;
    status: string;
    expires_at: string;
  } | null;
};

export async function fetchTenantSettings(): Promise<TenantSettings> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  
  // Try cashier endpoint first (for cashier role), then fallback to tenant endpoint (for tenant_admin role)
  const endpoints = [
    `${base}/api/cashier/settings`,
    `${base}/api/tenant/settings`,
  ];

  let lastError: Error | null = null;
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        return response.json();
      }
      
      // If 403 or 404, try next endpoint
      if (response.status === 403 || response.status === 404) {
        continue;
      }
      
      // For other errors, throw immediately
      throw new Error(`Failed to fetch tenant settings: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next endpoint
      continue;
    }
  }

  // If all endpoints failed, throw the last error
  throw lastError || new Error("Failed to fetch tenant settings: All endpoints failed");
}

export type UpdateTenantSettingsPayload = {
  name?: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  tax_percentage?: number | null;
  payment_settings?: {
    banks?: Array<{
      bank: string;
      account_number: string;
      account_name: string;
    }>;
    qris_image?: string | null;
  };
  maintenance_mode?: {
    is_enabled?: boolean;
    message?: string | null;
    image_url?: string | null;
    estimated_completion_at?: string | null;
  };
};

export async function updateTenantSettings(payload: UpdateTenantSettingsPayload): Promise<TenantSettings> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/settings`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update tenant settings: ${response.statusText}`);
  }

  return response.json();
}

// ==================== CATEGORY API ====================

export type Category = {
  id: number;
  tenant_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    // Fallback to mock data with proper format
    return categories.map((cat) => ({
      id: cat.id,
      tenant_id: 1, // Default tenant ID
      name: cat.name,
      sort_order: cat.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/categories`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    // Fallback to mock data if API call fails
    console.error("Failed to fetch categories from API, using mock data:", err);
    return categories.map((cat) => ({
      id: cat.id,
      tenant_id: 1,
      name: cat.name,
      sort_order: cat.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
}

export type CreateCategoryPayload = {
  name: string;
  sort_order?: number;
};

export type UpdateCategoryPayload = {
  name: string;
  sort_order?: number;
};

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/categories`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create category: ${response.statusText}`);
  }

  return response.json();
}

export async function updateCategory(categoryId: number, payload: UpdateCategoryPayload): Promise<Category> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/categories/${categoryId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update category: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/categories/${categoryId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete category: ${response.statusText}`);
  }
}

// ==================== OPTION GROUP API ====================

export type OptionGroup = {
  id: number;
  tenant_id: number;
  name: string;
  type: "single_choice" | "multi_choice";
  is_required: boolean;
  min_select?: number | null;
  max_select?: number | null;
  sort_order: number;
  items?: OptionItem[];
};

export type OptionItem = {
  id: number;
  option_group_id: number;
  label: string;
  extra_price: string;
  is_active: boolean;
  sort_order: number;
};

export async function fetchOptionGroups(): Promise<OptionGroup[]> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-groups`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      // Handle 401 specifically - this is authentication error, not CORS
      if (response.status === 401) {
        throw new Error("401 Unauthorized: Silakan login ulang untuk melanjutkan.");
      }
      // Handle 403
      if (response.status === 403) {
        throw new Error("403 Forbidden: Anda tidak memiliki izin untuk mengakses data ini.");
      }
      // Try to get error message from response
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Failed to fetch option groups: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // If it's already an Error with status code, re-throw it
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
      throw error;
    }
    // For network/fetch errors (TypeError), let formatUserFriendlyError handle it
    // These might appear as CORS in console but are usually network/auth issues
    if (error instanceof TypeError) {
      // Check if it's actually a network error or CORS
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror')) {
        throw new Error("Network Error: Gagal terhubung ke server. Periksa koneksi internet Anda.");
      }
      // If it's a CORS-like error but CORS is configured, it's likely auth issue
      throw new Error("Connection Error: Gagal terhubung ke server. Pastikan Anda sudah login.");
    }
    // Re-throw other errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch option groups");
  }
}

export type CreateOptionGroupPayload = {
  name: string;
  type: "single_choice" | "multi_choice";
  is_required?: boolean;
  min_select?: number | null;
  max_select?: number | null;
  sort_order?: number;
};

export type UpdateOptionGroupPayload = {
  name: string;
  type: "single_choice" | "multi_choice";
  is_required?: boolean;
  min_select?: number | null;
  max_select?: number | null;
  sort_order?: number;
};

export type CreateOptionItemPayload = {
  label: string;
  extra_price: number;
  sort_order?: number;
  is_active?: boolean;
};

export type UpdateOptionItemPayload = {
  label: string;
  extra_price: number;
  sort_order?: number;
  is_active?: boolean;
};

export async function createOptionGroup(payload: CreateOptionGroupPayload): Promise<OptionGroup> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-groups`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create option group: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOptionGroup(optionGroupId: number, payload: UpdateOptionGroupPayload): Promise<OptionGroup> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-groups/${optionGroupId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update option group: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteOptionGroup(optionGroupId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-groups/${optionGroupId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete option group: ${response.statusText}`);
  }
}

export async function createOptionItem(optionGroupId: number, payload: CreateOptionItemPayload): Promise<OptionItem> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-groups/${optionGroupId}/items`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create option item: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOptionItem(optionItemId: number, payload: UpdateOptionItemPayload): Promise<OptionItem> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-items/${optionItemId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update option item: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteOptionItem(optionItemId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/tenant/option-items/${optionItemId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete option item: ${response.statusText}`);
  }
}

// ==================== SUPER ADMIN API ====================

// Tenant Management
export type SuperAdminTenant = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subscriptions?: Array<{
    id: number;
    plan_id: number;
    status: string;
    start_date: string;
    end_date: string;
    plan?: {
      id: number;
      name: string;
      price_monthly: string;
    };
  }>;
};

export type SuperAdminTenantResponse = {
  data: SuperAdminTenant[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateTenantPayload = {
  name: string;
  slug: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  timezone?: string;
  is_active?: boolean;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export async function fetchSuperAdminTenants(): Promise<SuperAdminTenantResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tenants: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSuperAdminTenant(tenantId: number): Promise<SuperAdminTenant> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants/${tenantId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tenant: ${response.statusText}`);
  }

  return response.json();
}

export async function createTenant(payload: CreateTenantPayload): Promise<SuperAdminTenant> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create tenant: ${response.statusText}`);
  }

  return response.json();
}

export async function updateTenant(tenantId: number, payload: UpdateTenantPayload): Promise<SuperAdminTenant> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants/${tenantId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update tenant: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteTenant(tenantId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants/${tenantId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete tenant: ${response.statusText}`);
  }
}

export async function toggleTenantStatus(tenantId: number): Promise<{ is_active: boolean }> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/tenants/${tenantId}/toggle-status`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to toggle tenant status: ${response.statusText}`);
  }

  return response.json();
}

// Plan/Pricing Management
export type Plan = {
  id: number;
  name: string;
  description: string | null;
  price_monthly: string;
  price_yearly: string | null;
  max_tenants: number | null;
  max_users: number | null;
  max_menus: number | null;
  features_json: string[] | null;
  discount_percentage: string | null;
  discount_type: "monthly" | "yearly" | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlanResponse = {
  data: Plan[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreatePlanPayload = {
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  max_tenants?: number | null;
  max_users?: number | null;
  max_menus?: number | null;
  features_json?: string[];
  discount_percentage?: number | null;
  discount_type?: "monthly" | "yearly" | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  is_active?: boolean;
};

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export async function fetchPlans(): Promise<PlanResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/plans`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plans: ${response.statusText}`);
  }

  return response.json();
}

// Fetch available plans for tenant (public/tenant endpoint)
export async function fetchAvailablePlans(): Promise<PlanResponse> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  
  // Try tenant endpoint first, fallback to admin endpoint
  const endpoints = [
    `${base}/api/tenant/plans`,
    `${base}/api/admin/plans`,
  ];

  let lastError: Error | null = null;
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        return response.json();
      }
      
      // If 403 or 404, try next endpoint
      if (response.status === 403 || response.status === 404) {
        continue;
      }
      
      // For other errors, throw immediately
      throw new Error(`Failed to fetch plans: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  // If all endpoints failed, throw the last error
  throw lastError || new Error("Failed to fetch plans from all endpoints");
}

export async function fetchPlan(planId: number): Promise<Plan> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/plans/${planId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plan: ${response.statusText}`);
  }

  return response.json();
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/plans`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create plan: ${response.statusText}`);
  }

  return response.json();
}

export async function updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/plans/${planId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update plan: ${response.statusText}`);
  }

  return response.json();
}

export async function deletePlan(planId: number): Promise<void> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const base = backendUrl.replace(/\/$/, "");
  const url = `${base}/api/admin/plans/${planId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete plan: ${response.statusText}`);
  }
}

