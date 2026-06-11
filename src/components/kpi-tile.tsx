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
      ? "text-success"
      : trendTone === "red"
      ? "text-destructive"
      : trendTone === "amber"
      ? "text-warning"
      : "text-muted-foreground";

  return (
    <div className="bg-surface border border-hairline rounded-xl p-4 shadow-soft transition-shadow hover:shadow-elegant">
      <div className="text-[10px] uppercase font-bold tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={
            "font-display text-[26px] leading-none font-bold tracking-tight " +
            (accent ? "text-primary" : "text-foreground")
          }
        >
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground font-medium">{unit}</span>}
      </div>
      {trend && (
        <div className={"mt-2 text-[11px] font-semibold " + trendColor}>{trend}</div>
      )}
    </div>
  );
}