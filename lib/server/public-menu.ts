import "server-only";

import {
  categories as mockCategories,
  menuItems as mockMenus,
  optionGroups as mockOptionGroups,
  optionItems as mockOptionItems,
  tableContext as mockTable,
  tenantContext as mockTenant,
} from "@/lib/mock-data";
import type {
  Category,
  MenuItem,
  MenuOptionGroup,
  MenuOptionItem,
  TableInfo,
  Tenant,
} from "@/lib/types";

export type PublicMenuData = {
  tenant: Tenant;
  table: TableInfo;
  categories: Category[];
  menus: MenuItem[];
  optionGroups: MenuOptionGroup[];
  optionItems: MenuOptionItem[];
};

const FALLBACK: PublicMenuData = {
  tenant: mockTenant,
  table: mockTable,
  categories: mockCategories,
  menus: mockMenus,
  optionGroups: mockOptionGroups,
  optionItems: mockOptionItems,
};

export async function fetchPublicMenuData(tenantSlug: string, qrToken: string): Promise<PublicMenuData> {
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (backendUrl) {
    const base = backendUrl.replace(/\/$/, "");
    try {
      const response = await fetch(`${base}/api/public/${tenantSlug}/tables/${qrToken}/menus`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const payload = await response.json();
        
        // Transform menus from backend format to MenuItem format
        const transformedMenus: MenuItem[] = (payload.menus || []).map((menu: any) => ({
          id: menu.id,
          tenantId: menu.tenant_id,
          categoryId: menu.category_id,
          name: menu.name,
          description: menu.description || "",
          imageUrl: menu.image_url || "",
          price: menu.price,
          isAvailable: menu.is_available,
          badges: menu.badges || [], // Badges from backend (Terlaris, Baru, Layak Dicoba)
          optionGroupIds: menu.option_group_ids || [],
        }));

        // Transform categories from backend format
        const transformedCategories: Category[] = (payload.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
        }));

        // Transform option groups from backend format
        const transformedOptionGroups: MenuOptionGroup[] = (payload.option_groups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          selectionType: group.type === "multiple" ? "multiple" : "single",
          required: group.is_required || false,
          optionItemIds: [], // Will be populated from optionItems
        }));

        // Transform option items from backend format
        const transformedOptionItems: MenuOptionItem[] = (payload.option_items || []).map((item: any) => ({
          id: item.id,
          groupId: item.option_group_id,
          label: item.label,
          extraPrice: item.extra_price,
          isActive: item.is_active,
        }));

        // Populate optionItemIds in option groups
        transformedOptionGroups.forEach((group) => {
          group.optionItemIds = transformedOptionItems
            .filter((item) => item.groupId === group.id)
            .map((item) => item.id);
        });

        return {
          tenant: payload.tenant
            ? {
                id: payload.tenant.id,
                name: payload.tenant.name,
                slug: payload.tenant.slug,
                logoUrl: payload.tenant.logo_url || "",
                taxPercentage: payload.tenant.tax_percentage || 0,
              }
            : { ...mockTenant, taxPercentage: 10 }, // Default 10% for testing
          table: payload.table
            ? {
                id: payload.table.id,
                number: payload.table.number,
                qrToken: payload.table.qr_token,
                note: payload.table.note,
              }
            : mockTable,
          categories: transformedCategories.length > 0 ? transformedCategories : mockCategories,
          menus: transformedMenus.length > 0 ? transformedMenus : mockMenus,
          optionGroups: transformedOptionGroups.length > 0 ? transformedOptionGroups : mockOptionGroups,
          optionItems: transformedOptionItems.length > 0 ? transformedOptionItems : mockOptionItems,
        };
      }
    } catch (error) {
      console.warn("[fetchPublicMenuData] falling back to mock data:", (error as Error).message);
    }
  }

  return FALLBACK;
}

