export type Tenant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  taxPercentage?: number;
};

export type TableInfo = {
  id: number;
  number: string;
  qrToken: string;
  note?: string;
};

export type Category = {
  id: number;
  name: string;
};

export type MenuOptionItem = {
  id: number;
  groupId: number;
  label: string;
  extraPrice: number;
  isActive: boolean;
};

export type MenuOptionGroup = {
  id: number;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  optionItemIds: number[];
};

export type MenuItem = {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  badges?: string[];
  optionGroupIds: number[];
};

export type CartItemPayload = {
  menu_id: number;
  qty: number;
  option_item_ids: number[];
  item_note?: string;
};

export type PaymentMethod = "cash" | "transfer" | "qris";

export type CheckoutPayload = {
  qr_token: string;
  customer_name?: string;
  items: CartItemPayload[];
  payment_method: PaymentMethod;
  bank_choice?: string;
};

export type TenantUser = {
  id: number;
  name: string;
  email: string;
  role: "tenant_admin" | "cashier";
  status: "active" | "inactive";
  lastActive: string;
};

export type PaymentConfig = {
  cash: boolean;
  banks: { bank: string; accountNumber: string; accountName: string }[];
  qrisImage: string;
};

export type SuperAdminTenant = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  status: "active" | "expired" | "trial";
  expiry: string;
  ordersToday: number;
};

export type PlanInfo = {
  id: number;
  name: string;
  price: number;
  features: string[];
};

