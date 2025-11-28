export function PaymentMethodBadge({ method }: { method: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    cash: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    },
    transfer: {
      bg: "bg-blue-100",
      text: "text-blue-700",
    },
    qris: {
      bg: "bg-purple-100",
      text: "text-purple-700",
    },
  };

  const variant = variants[method.toLowerCase()] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
  };

  return (
    <span className={`rounded-full ${variant.bg} ${variant.text} px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase whitespace-nowrap`}>
      {method}
    </span>
  );
}













