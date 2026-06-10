import type { ReactNode } from "react";
import { StatusBadge, statusTone } from "./status-badge";

export type DocField = { label: string; value: ReactNode };

export function DocumentHeader({
  docNumber,
  docType,
  status,
  fields,
  actions,
}: {
  docNumber: string;
  docType: string;
  status: string;
  fields: DocField[];
  actions?: ReactNode;
}) {
  return (
    <div className="bg-white ring-1 ring-zinc-200 rounded-sm">
      <div className="px-5 py-4 border-b border-zinc-200 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {docType}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-lg font-mono font-bold tracking-tight text-zinc-900">
              {docNumber}
            </span>
            <StatusBadge label={status} tone={statusTone(status)} />
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-zinc-100">
        {fields.map((f) => (
          <div key={f.label} className="px-4 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {f.label}
            </dt>
            <dd className="mt-1 text-[13px] text-zinc-900 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}