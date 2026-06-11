import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-hairline bg-surface">
      <div className="flex items-start justify-between gap-4">
        <div>
          {breadcrumb && (
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
              {breadcrumb}
            </div>
          )}
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-[64ch]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}