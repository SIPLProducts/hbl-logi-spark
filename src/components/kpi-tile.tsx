import type { ReactNode } from "react";

export function KpiTile({
  label,
  value,
  unit,
  trend,
  trendTone = "zinc",
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: ReactNode;
  trendTone?: "green" | "red" | "amber" | "zinc";
  accent?: boolean;
}) {
  const trendColor =
    trendTone === "green"
      ? "text-emerald-600"
      : trendTone === "red"
      ? "text-red-600"
      : trendTone === "amber"
      ? "text-amber-600"
      : "text-zinc-500";

  return (
    <div className="bg-white p-4 ring-1 ring-zinc-200 rounded-sm">
      <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={
            "text-2xl font-mono font-bold tracking-tight " +
            (accent ? "text-blue-600" : "text-zinc-900")
          }
        >
          {value}
        </span>
        {unit && <span className="text-[11px] text-zinc-400 font-medium">{unit}</span>}
      </div>
      {trend && (
        <div className={"mt-2 text-[11px] font-medium " + trendColor}>{trend}</div>
      )}
    </div>
  );
}