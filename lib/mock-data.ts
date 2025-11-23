import {
  CartItemPayload,
  Category,
  MenuItem,
  MenuOptionGroup,
  MenuOptionItem,
  PaymentConfig,
  PaymentMethod,
  PlanInfo,
  SuperAdminTenant,
  TableInfo,
  Tenant,
  TenantUser,
} from "./types";

export const tenantContext: Tenant = {
  id: 17,
  name: "Brew Haven",
  slug: "brew-haven",
  logoUrl: "/window.svg",
};

export const tableContext: TableInfo = {
  id: 44,
  number: "12",
  qrToken: "tbl-12-alpha",
  note: "Zona non-smoking",
};

export const categories: Category[] = [
  { id: 1, name: "Signature" },
  { id: 2, name: "Coffee" },
  { id: 3, name: "Non Coffee" },
  { id: 4, name: "Snacks" },
  { id: 5, name: "Dessert" },
];

export const optionGroups: MenuOptionGroup[] = [
  {
    id: 21,
    name: "Temperature",
    selectionType: "single",
    required: true,
    optionItemIds: [100, 101],
  },
  {
    id: 22,
    name: "Sugar Level",
    selectionType: "single",
    required: true,
    optionItemIds: [102, 103, 104, 105],
  },
  {
    id: 23,
    name: "Size",
    selectionType: "single",
    required: true,
    optionItemIds: [106, 107, 108],
  },
  {
    id: 24,
    name: "Topping",
    selectionType: "multiple",
    required: false,
    optionItemIds: [109, 110, 111],
  },
];

export const optionItems: MenuOptionItem[] = [
  { id: 100, groupId: 21, label: "Hot", extraPrice: 0, isActive: true },
  { id: 101, groupId: 21, label: "Iced", extraPrice: 2000, isActive: true },
  { id: 102, groupId: 22, label: "No Sugar", extraPrice: 0, isActive: true },
  { id: 103, groupId: 22, label: "Less Sugar", extraPrice: 0, isActive: true },
  { id: 104, groupId: 22, label: "Normal", extraPrice: 0, isActive: true },
  { id: 105, groupId: 22, label: "Extra Sweet", extraPrice: 0, isActive: true },
  { id: 106, groupId: 23, label: "Small", extraPrice: 0, isActive: true },
  { id: 107, groupId: 23, label: "Medium (+3.000)", extraPrice: 3000, isActive: true },
  { id: 108, groupId: 23, label: "Large (+5.000)", extraPrice: 5000, isActive: true },
  { id: 109, groupId: 24, label: "Extra Shot (+5.000)", extraPrice: 5000, isActive: true },
  { id: 110, groupId: 24, label: "Whipped Cream (+4.000)", extraPrice: 4000, isActive: true },
  { id: 111, groupId: 24, label: "Brown Sugar Jelly (+6.000)", extraPrice: 6000, isActive: true },
];

export const menuItems: MenuItem[] = [
  {
    id: 501,
    tenantId: tenantContext.id,
    categoryId: 1,
    name: "Brew Haven Latte",
    description: "Single origin espresso dengan susu oat creamy.",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    price: 38000,
    isAvailable: true,
    badges: ["Best Seller"],
    optionGroupIds: [21, 22, 23, 24],
  },
  {
    id: 502,
    tenantId: tenantContext.id,
    categoryId: 2,
    name: "V60 Seasonal",
    description: "Manual brew untuk pecinta rasa original.",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80",
    price: 42000,
    isAvailable: true,
    badges: ["Limited"],
    optionGroupIds: [21],
  },
  {
    id: 503,
    tenantId: tenantContext.id,
    categoryId: 3,
    name: "Matcha Cloud",
    description: "Uji matcha premium dengan susu segar dan cream cheese.",
    imageUrl: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80",
    price: 45000,
    isAvailable: true,
    badges: ["New"],
    optionGroupIds: [22, 23],
  },
  {
    id: 504,
    tenantId: tenantContext.id,
    categoryId: 4,
    name: "Truffle Fries",
    description: "Kentang goreng dengan minyak truffle dan parmesan.",
    imageUrl: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=800&q=80",
    price: 36000,
    isAvailable: false,
    badges: ["Habis"],
    optionGroupIds: [],
  },
];

export type CashierOrderRow = {
  id: number;
  createdAt: string;
  tableNumber: string;
  orderCode: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "waiting_verification" | "paid";
  orderStatus: "pending" | "accepted" | "preparing" | "ready" | "completed";
};

export const cashierOrders: CashierOrderRow[] = [
  {
    id: 9001,
    createdAt: "2025-11-21T09:15:00",
    tableNumber: "12",
    orderCode: "BRH-1121-0901",
    totalAmount: 125000,
    paymentMethod: "qris",
    paymentStatus: "waiting_verification",
    orderStatus: "pending",
  },
  {
    id: 9002,
    createdAt: "2025-11-21T09:22:00",
    tableNumber: "05",
    orderCode: "BRH-1121-0902",
    totalAmount: 88000,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    orderStatus: "accepted",
  },
  {
    id: 9003,
    createdAt: "2025-11-21T09:30:00",
    tableNumber: "07",
    orderCode: "BRH-1121-0903",
    totalAmount: 152000,
    paymentMethod: "transfer",
    paymentStatus: "paid",
    orderStatus: "preparing",
  },
];

export const cashierOrderDetail = {
  id: 9001,
  orderCode: "BRH-1121-0901",
  tableNumber: "12",
  createdAt: "2025-11-21T09:15:00",
  paymentMethod: "qris" as PaymentMethod,
  paymentStatus: "waiting_verification",
  orderStatus: "pending",
  items: [
    {
      name: "Brew Haven Latte",
      qty: 2,
      options: ["Iced", "Less Sugar", "Large (+5.000)", "Extra Shot (+5.000)"],
    },
    {
      name: "Matcha Cloud",
      qty: 1,
      options: ["Less Sugar", "Medium (+3.000)"],
    },
  ],
  logs: [
    { status: "pending", label: "Pesanan dibuat", timestamp: "09:15" },
    { status: "accepted", label: "Pesanan diterima kasir", timestamp: "09:17" },
  ],
};

export const tenantMenuGrid = menuItems;

export const tenantOptionGroups = optionGroups.map((group) => ({
  ...group,
  options: optionItems.filter((item) => item.groupId === group.id),
}));

export const tenantTables = [
  { id: 1, number: "01", status: "active" },
  { id: 2, number: "02", status: "active" },
  { id: 3, number: "12", status: "active" },
  { id: 4, number: "19", status: "inactive" },
];

export const subscriptionCard = {
  plan: "Growth",
  status: "Active",
  expiresAt: "2026-01-05",
};

export const customerCartSeed: CartItemPayload[] = [
  {
    menu_id: 501,
    qty: 1,
    option_item_ids: [101, 103, 108, 109],
    item_note: "Tanpa sedotan plastik",
  },
];

export const tenantUsers: TenantUser[] = [
  {
    id: 301,
    name: "Nadia Putri",
    email: "kasir.nadia@brewhaven.id",
    role: "cashier",
    status: "active",
    lastActive: "2025-11-21T09:00:00",
  },
  {
    id: 302,
    name: "Rafi Akbar",
    email: "rafi@brewhaven.id",
    role: "tenant_admin",
    status: "active",
    lastActive: "2025-11-20T17:10:00",
  },
  {
    id: 303,
    name: "Gracia",
    email: "gracia@brewhaven.id",
    role: "cashier",
    status: "inactive",
    lastActive: "2025-11-18T14:20:00",
  },
];

export const tenantPaymentConfig: PaymentConfig = {
  cash: true,
  banks: [
    { bank: "BCA", accountNumber: "7611882212", accountName: "Brew Haven" },
    { bank: "Mandiri", accountNumber: "11000441122", accountName: "Brew Haven" },
  ],
  qrisImage: "/qris-placeholder.png",
};

export const superAdminTenants: SuperAdminTenant[] = [
  {
    id: 17,
    name: "Brew Haven",
    slug: "brew-haven",
    plan: "Growth",
    status: "active",
    expiry: "2026-01-05",
    ordersToday: 128,
  },
  {
    id: 18,
    name: "Toastology",
    slug: "toastology",
    plan: "Starter",
    status: "active",
    expiry: "2025-12-02",
    ordersToday: 64,
  },
  {
    id: 19,
    name: "Kopi Klasik",
    slug: "kopi-klasik",
    plan: "Trial",
    status: "expired",
    expiry: "2025-10-30",
    ordersToday: 12,
  },
];

export const superAdminPlans: PlanInfo[] = [
  { id: 1, name: "Trial", price: 0, features: ["10 order/hari", "1 device kasir"] },
  { id: 2, name: "Starter", price: 149000, features: ["100 order/hari", "3 device kasir"] },
  { id: 3, name: "Growth", price: 299000, features: ["Unlimited order", "Kasir tak terbatas"] },
];

export const superAdminActivity = [
  { id: "log-1", message: "Tenant Brew Haven memperpanjang plan Growth", time: "09:10" },
  { id: "log-2", message: "Tenant Toastology menambah kasir baru", time: "08:55" },
  { id: "log-3", message: "Plan Trial Kopi Klasik kedaluwarsa", time: "08:40" },
];

