import { CustomerExperience } from "@/components/customer/customer-experience";
import { MaintenancePage } from "@/components/customer/maintenance-page";
import { fetchPublicMenuData } from "@/lib/server/public-menu";

type CustomerOrderPageProps = {
  params: Promise<{
    tenantSlug: string;
    qrToken: string;
  }>;
};

async function checkMaintenanceMode(tenantSlug: string) {
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return null;

  try {
    const base = backendUrl.replace(/\/$/, "");
    const response = await fetch(`${base}/api/public/${tenantSlug}/maintenance-status`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.maintenance_mode) {
        return {
          message: data.message,
          image_url: data.image_url,
          estimated_completion_at: data.estimated_completion_at,
        };
      }
    }
  } catch (error) {
    console.warn("[checkMaintenanceMode] Error:", error);
  }

  return null;
}

export default async function CustomerOrderPage({ params }: CustomerOrderPageProps) {
  // Await params in Next.js 15+ (params can be a Promise)
  const resolvedParams = await params;
  
  // Check maintenance mode first
  const maintenanceInfo = await checkMaintenanceMode(resolvedParams.tenantSlug);
  
  if (maintenanceInfo) {
    // fetchPublicMenuData already has fallback, so it should never throw
    const data = await fetchPublicMenuData(resolvedParams.tenantSlug, resolvedParams.qrToken);
    
      return (
        <MaintenancePage
          message={maintenanceInfo.message}
          estimatedCompletionAt={maintenanceInfo.estimated_completion_at}
          tenantName={data.tenant.name}
          tenantLogo={data.tenant.logoUrl}
        />
      );
  }
  
  // fetchPublicMenuData already has fallback, so it should never throw
  const data = await fetchPublicMenuData(resolvedParams.tenantSlug, resolvedParams.qrToken);
  const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <CustomerExperience
          tenant={data.tenant}
          table={data.table}
          categories={data.categories}
          menus={data.menus}
          optionGroups={data.optionGroups}
          optionItems={data.optionItems}
          initialCart={[]}
          apiBaseUrl={apiBaseUrl || undefined}
        />
      </div>
    </div>
  );
}

