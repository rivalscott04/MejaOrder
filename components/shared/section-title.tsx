import type { ReactNode } from "react";

type SectionTitleProps = {
  icon: ReactNode;
  title: string;
};

export function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
      <span className="rounded-full bg-emerald-50 p-1 text-emerald-600">{icon}</span>
      {title}
    </div>
  );
}

