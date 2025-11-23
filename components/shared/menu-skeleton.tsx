export function MenuSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-200" />
      <div className="mt-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
      <div className="mt-3 space-y-3">
        <div className="rounded-lg bg-slate-100 p-2.5">
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 rounded-xl bg-slate-200" />
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function MenuGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <MenuSkeleton key={i} />
      ))}
    </div>
  );
}

// Stats Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl lg:rounded-2xl border border-slate-200 p-4 lg:p-6 animate-pulse">
      <div className="mb-2 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-5 w-5 rounded bg-slate-200" />
      </div>
      <div className="h-8 lg:h-10 w-20 rounded bg-slate-200" />
    </div>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 w-24 rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="pb-3">
                <div className="h-4 w-20 rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Card Grid Skeleton (for tables, users, etc.)
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-8 w-8 rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-3 w-16 rounded bg-slate-200" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="h-9 flex-1 rounded-xl bg-slate-200" />
        <div className="h-9 w-20 rounded-xl bg-slate-200" />
        <div className="h-9 w-20 rounded-xl bg-slate-200" />
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Order List Skeleton
export function OrderRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-3">
        <div className="h-4 w-16 rounded bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-4 w-20 rounded bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-4 w-20 rounded bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-6 w-20 rounded-full bg-slate-200" />
      </td>
      <td className="py-3">
        <div className="h-4 w-16 rounded bg-slate-200" />
      </td>
    </tr>
  );
}

export function OrderTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="pb-3">Waktu</th>
            <th className="pb-3">Meja</th>
            <th className="pb-3">Kode</th>
            <th className="pb-3">Total</th>
            <th className="pb-3">Bayar</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Order Detail Sidebar Skeleton
export function OrderDetailSkeleton() {
  return (
    <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-32 rounded bg-slate-200" />
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <div className="h-5 w-40 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="h-3 w-32 rounded bg-slate-200 mb-2" />
          <div className="h-4 w-24 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-28 rounded bg-slate-200 mb-2" />
          <div className="h-6 w-24 rounded-full bg-slate-200" />
        </div>
        <div>
          <div className="h-3 w-16 rounded bg-slate-200 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3">
                <div className="h-4 w-32 rounded bg-slate-200 mb-1" />
                <div className="h-3 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-10 w-full rounded-xl bg-slate-200" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Customer Menu Skeleton (for customer order page)
export function CustomerMenuCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-200" />
      <div className="mt-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-200" />
          <div className="h-5 w-16 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function CustomerMenuGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CustomerMenuCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Plan Card Skeleton
export function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-slate-200 mb-2" />
      <div className="h-8 w-40 rounded bg-slate-200 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-slate-200" />
        ))}
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-200" />
    </div>
  );
}

export function PlanGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PlanCardSkeleton key={i} />
      ))}
    </div>
  );
}

