import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          {breadcrumb && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              {breadcrumb}
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {description && (
            <p className="text-[12.5px] text-zinc-500 mt-1 max-w-[64ch]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}