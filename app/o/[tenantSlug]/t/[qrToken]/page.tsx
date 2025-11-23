import { CustomerExperience } from "@/components/customer/customer-experience";
import { fetchPublicMenuData } from "@/lib/server/public-menu";

type CustomerOrderPageProps = {
  params: Promise<{
    tenantSlug: string;
    qrToken: string;
  }>;
};

export default async function CustomerOrderPage({ params }: CustomerOrderPageProps) {
  // Await params in Next.js 15+ (params can be a Promise)
  const resolvedParams = await params;
  
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

