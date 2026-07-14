import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
  Calendar,
  BarChart3,
  IndianRupee,
  HandCoins,
  Weight,
  Target,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

const NAVY_HEADER = "bg-[#0b2249] text-white";
const CARD = "bg-white border border-slate-200 rounded-xl shadow-elegant overflow-hidden";

type KpiTile = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  border: string;
  bg: string;
  iconBg: string;
};

const KPIS: KpiTile[] = [
  {
    label: "Total LAh Loaded",
    value: "155 LAh",
    icon: BarChart3,
    border: "border-blue-600/40",
    bg: "bg-white",
    iconBg: "bg-blue-600",
  },
  {
    label: "Total Freight Cost",
    value: "₹ 44 Lakhs",
    icon: Truck,
    border: "border-green-500/50",
    bg: "bg-green-50",
    iconBg: "bg-green-600",
  },
  {
    label: "Freight Cost / Ah",
    value: "₹ 0.28",
    sub: "(Weighted Avg.)",
    icon: IndianRupee,
    border: "border-orange-400/60",
    bg: "bg-orange-50",
    iconBg: "bg-orange-500",
  },
  {
    label: "Unloading & Detention / Ah",
    value: "₹ 0.10",
    sub: "(Weighted Avg.)",
    icon: HandCoins,
    border: "border-sky-400/60",
    bg: "bg-sky-50",
    iconBg: "bg-sky-500",
  },
  {
    label: "Actual Weight",
    value: "1,034 TON",
    icon: Weight,
    border: "border-amber-400/60",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
  },
  {
    label: "Unloading & Detention Charges per Ton",
    value: "₹ 4,224",
    sub: "(Weighted Avg.)",
    icon: IndianRupee,
    border: "border-violet-400/60",
    bg: "bg-violet-50",
    iconBg: "bg-violet-500",
  },
];

const TABLE_HEADERS = [
  "Destination Location",
  "LAh Loaded in the Truck",
  "Basic Freight Charges (Lakhs - INR)",
  "Detention charges at Unloading Point (Lakhs - INR)",
  "Un-loading charges (Lakhs - INR)",
  "Total Freight (Lakhs - INR)",
  "Freight Cost / Ah (INR)",
  "Unloading and Detention / Ah (INR)",
  "Actual Weight in Ton",
  "Unloading & Detention Charges per Ton (INR)",
];

const TABLE_ROWS: string[][] = [
  ["Chennai", "25.9", "4.6", "-", "2.4", "7", "0.27", "0.09", "168", "4,175"],
  ["Gandhinagar", "6.6", "2.5", "-", "0.7", "3", "0.48", "0.11", "56.95", "5,552"],
  ["Hyderabad", "1.7", "0.1", "-", "0.0", "0", "0.10", "0.03", "15.5", "1,161"],
  ["Mumbai", "19.7", "4.3", "0.8", "3.4", "9", "0.43", "0.21", "136", "6,251"],
  ["Noida", "2.3", "2.0", "-", "-", "2", "0.87", "-", "35.2", "5,750"],
  ["Pune", "98.7", "15.1", "-", "7.7", "23", "0.23", "0.08", "622.5", "3,663"],
];

const TABLE_TOTAL = ["Total", "155", "29", "1", "14", "44", "0.28", "0.10", "1,034", "4,224"];

const DEST_COLORS: Record<string, string> = {
  Pune: "#1d4ed8",
  Mumbai: "#f97316",
  Chennai: "#16a34a",
  Gandhinagar: "#0ea5e9",
  Noida: "#8b5cf6",
  Hyderabad: "#94a3b8",
};

const FREIGHT_BY_DEST: [string, number][] = [
  ["Pune", 23],
  ["Mumbai", 9],
  ["Chennai", 7],
  ["Gandhinagar", 3],
  ["Noida", 2],
  ["Hyderabad", 0],
];

const DONUT: { name: string; pct: number }[] = [
  { name: "Pune", pct: 52 },
  { name: "Mumbai", pct: 21 },
  { name: "Chennai", pct: 16 },
  { name: "Gandhinagar", pct: 7 },
  { name: "Noida", pct: 5 },
  { name: "Hyderabad", pct: 0 },
];

type BarDatum = [string, number | null];

const CHART_FREIGHT_AH: BarDatum[] = [
  ["Noida", 0.87],
  ["Gandhinagar", 0.48],
  ["Mumbai", 0.43],
  ["Chennai", 0.27],
  ["Pune", 0.23],
  ["Hyderabad", 0.1],
];

const CHART_UD_AH: BarDatum[] = [
  ["Mumbai", 0.21],
  ["Gandhinagar", 0.11],
  ["Chennai", 0.09],
  ["Pune", 0.08],
  ["Hyderabad", 0.03],
  ["Noida", null],
];

const CHART_UD_TON: BarDatum[] = [
  ["Mumbai", 6251],
  ["Noida", 5750],
  ["Gandhinagar", 5552],
  ["Chennai", 4175],
  ["Pune", 3663],
  ["Hyderabad", 1161],
];

const INSIGHTS: { icon: LucideIcon; iconBg: string; text: string }[] = [
  {
    icon: BarChart3,
    iconBg: "bg-blue-600",
    text: "Pune contributes the highest freight cost at ₹23 Lakhs (52% of total), driven by highest volume of 98.7 LAh.",
  },
  {
    icon: IndianRupee,
    iconBg: "bg-orange-500",
    text: "Noida has the highest Freight Cost / Ah at ₹0.87, indicating higher cost impact for low volume.",
  },
  {
    icon: Truck,
    iconBg: "bg-green-600",
    text: "Mumbai has the highest Unloading & Detention / Ah at ₹0.21, mainly due to detention charges of ₹0.8 Lakhs.",
  },
  {
    icon: Weight,
    iconBg: "bg-violet-500",
    text: "Mumbai also has the highest Unloading & Detention Charges per Ton at ₹6,251.",
  },
  {
    icon: Target,
    iconBg: "bg-teal-600",
    text: "Overall Unloading & Detention Charges per Ton stands at ₹4,224 for Q1 FY'27.",
  },
];

const SUMMARY = [
  "Total Freight Cost for Q1 FY'27 is ₹44 Lakhs for 155 LAh with overall Freight Cost / Ah of ₹0.28.",
  "Unloading & Detention Charges total ₹15 Lakhs with weighted average of ₹0.10 per Ah.",
  "Pune and Mumbai are the key cost drivers and contribute 73% of the total freight cost.",
  "Focused actions on unloading efficiency and detention reduction can further optimize costs.",
];

function DashboardPage() {
  return (
    <div className="min-h-full bg-[#e8edf3] p-2.5 space-y-2.5">
      {/* Header banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#07173a] via-[#0e2a5e] to-[#0a2150] px-4 py-2 flex flex-wrap items-center gap-3 shadow-cta">
        <div className="size-10 rounded-lg bg-white/10 grid place-items-center text-white shrink-0">
          <Truck className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-base sm:text-xl font-extrabold tracking-tight text-white uppercase leading-tight">
            STT Freight &amp; Unloading Cost Analysis
          </h1>
          <div className="text-[12px] font-bold text-sky-400 uppercase tracking-wide">
            Q1 of FY'27
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/25 bg-white/5 px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
              <Calendar className="size-3" /> Date
            </div>
            <div className="font-display text-[14px] font-bold text-white tabular-nums">
              08.07.2026
            </div>
          </div>
          <div className="hidden sm:block w-px h-9 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full bg-amber-400 grid place-items-center text-[#0b2249]">
              <IndianRupee className="size-4.5" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
                Total Freight Cost
              </div>
              <div className="font-display text-[15px] font-extrabold text-white">₹ 44 Lakhs</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className={"rounded-xl border p-2.5 flex flex-col " + k.border + " " + k.bg}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#0b2249] leading-snug">
                  {k.label}
                </div>
                <div
                  className={
                    "size-7 rounded-full grid place-items-center text-white shrink-0 " + k.iconBg
                  }
                >
                  <Icon className="size-3.5" />
                </div>
              </div>
              <div className="mt-auto pt-1 font-display text-[16px] font-extrabold tabular-nums text-[#0b2249] leading-none">
                {k.value}
              </div>
              {k.sub && <div className="mt-0.5 text-[9px] text-slate-500">{k.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Table + freight by destination */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className={"lg:col-span-2 " + CARD}>
          <div className={NAVY_HEADER + " px-3 py-2 text-center"}>
            <h3 className="font-display text-[12px] font-bold uppercase tracking-wide">
              Destination Wise Freight &amp; Unloading Cost Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="bg-[#132f66] text-white font-semibold px-1.5 py-1.5 text-[10px] text-center align-middle leading-tight border-l border-white/10 first:border-l-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr key={row[0]} className="border-t border-slate-200 hover:bg-slate-50">
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        className={
                          "px-1.5 py-1.5 tabular-nums border-l border-slate-100 first:border-l-0 " +
                          (i === 0
                            ? "text-left font-semibold text-slate-800"
                            : "text-center text-slate-700")
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#0b2249] text-white font-bold">
                  {TABLE_TOTAL.map((cell, i) => (
                    <td
                      key={i}
                      className={
                        "px-1.5 py-1.5 tabular-nums border-l border-white/10 first:border-l-0 " +
                        (i === 0 ? "text-left" : "text-center")
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={CARD}>
          <div className={NAVY_HEADER + " px-3 py-2 text-center"}>
            <h3 className="font-display text-[12px] font-bold uppercase tracking-wide">
              Total Freight (Lakhs - INR) by Destination
            </h3>
          </div>
          <div className="p-2.5">
            <div className="space-y-1">
              {FREIGHT_BY_DEST.map(([name, v]) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-16 text-right text-[10px] text-slate-600 shrink-0">{name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-sm relative">
                    <div
                      className="h-full rounded-sm bg-[#1d4ed8]"
                      style={{ width: `${(v / 25) * 100}%` }}
                    />
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700"
                      style={{ left: `calc(${(v / 25) * 100}% + 6px)` }}
                    >
                      {v}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex">
              <div className="w-16 shrink-0" />
              <div className="flex-1 flex justify-between border-t border-slate-300 pt-0.5 text-[9px] font-mono text-slate-500">
                {[0, 5, 10, 15, 20, 25].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-500">Lakhs - INR</div>

            <div className="mt-2 flex items-center justify-center gap-4">
              <Donut />
              <div className="flex flex-col gap-1">
                {FREIGHT_BY_DEST.map(([name]) => (
                  <div key={name} className="flex items-center gap-1.5 text-[10px] text-slate-700">
                    <span
                      className="size-2.5 rounded-[2px] shrink-0"
                      style={{ background: DEST_COLORS[name] }}
                    />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three bar charts + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className={"lg:col-span-2 " + CARD + " p-3"}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VBarChart
              title="Freight Cost / Ah (INR)"
              barColor="#1d4ed8"
              data={CHART_FREIGHT_AH}
              yMax={1}
              ticks={[1, 0.8, 0.6, 0.4, 0.2, 0]}
              fmt={(v) => v.toFixed(2)}
            />
            <VBarChart
              title="Unloading & Detention / Ah (INR)"
              barColor="#16a34a"
              data={CHART_UD_AH}
              yMax={0.25}
              ticks={[0.25, 0.2, 0.15, 0.1, 0.05, 0]}
              fmt={(v) => v.toFixed(2)}
            />
            <VBarChart
              title="Unloading & Detention Charges per Ton (INR)"
              barColor="#eab308"
              data={CHART_UD_TON}
              yMax={8000}
              ticks={[8000, 6000, 4000, 2000, 0]}
              fmt={(v) => v.toLocaleString("en-IN")}
            />
          </div>
        </div>

        <div className={CARD}>
          <div className={NAVY_HEADER + " px-3 py-2 text-center"}>
            <h3 className="font-display text-[12px] font-bold uppercase tracking-wide">
              Key Insights
            </h3>
          </div>
          <ul className="p-2.5 space-y-1.5">
            {INSIGHTS.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <li
                  key={i}
                  className="flex items-start gap-2 pb-1.5 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <span
                    className={
                      "size-5.5 rounded-full grid place-items-center text-white shrink-0 " +
                      insight.iconBg
                    }
                  >
                    <Icon className="size-3" />
                  </span>
                  <span className="text-[10.5px] text-slate-700 leading-snug">{insight.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Summary strip */}
      <div className={CARD + " px-3 py-2 flex flex-wrap items-center gap-3"}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-full bg-[#0b2249] grid place-items-center text-white">
            <ClipboardCheck className="size-4" />
          </div>
          <div className="font-display text-[12.5px] font-extrabold uppercase tracking-wide text-[#0b2249]">
            Summary
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-1.5 md:divide-x md:divide-slate-200">
          {SUMMARY.map((text, i) => (
            <p key={i} className="text-[11px] text-slate-700 leading-snug md:pl-4 md:first:pl-0">
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Donut() {
  const segs = DONUT.filter((s) => s.pct > 0);
  let acc = 0;
  const stops = segs.map((s) => {
    const start = acc;
    acc += s.pct;
    return `${DEST_COLORS[s.name]} ${start}% ${acc}%`;
  });
  acc = 0;
  const marks = segs.map((s) => {
    const mid = ((acc + s.pct / 2) / 100) * 2 * Math.PI;
    acc += s.pct;
    return { ...s, x: Math.sin(mid), y: -Math.cos(mid) };
  });
  const R = 42;
  return (
    <div
      className="relative size-28 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
    >
      <div className="absolute inset-[23%] rounded-full bg-white grid place-items-center text-center">
        <div>
          <div className="font-display text-[12px] font-extrabold text-[#0b2249] leading-none">
            ₹ 44
          </div>
          <div className="font-display text-[9px] font-bold text-[#0b2249] mt-0.5">LAKHS</div>
          <div className="text-[8px] text-slate-500 uppercase">Total</div>
        </div>
      </div>
      {marks.map((m) => (
        <span
          key={m.name}
          className="absolute text-[9px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]"
          style={{
            left: `calc(50% + ${m.x * R}px)`,
            top: `calc(50% + ${m.y * R}px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {m.pct}%
        </span>
      ))}
    </div>
  );
}

function VBarChart({
  title,
  barColor,
  data,
  yMax,
  ticks,
  fmt,
}: {
  title: string;
  barColor: string;
  data: BarDatum[];
  yMax: number;
  ticks: number[];
  fmt: (v: number) => string;
}) {
  const PLOT_H = 116;
  return (
    <div className="min-w-0">
      <h4 className="text-center text-[10.5px] font-bold uppercase tracking-wide text-[#0b2249] leading-tight">
        {title}
      </h4>
      <div className="mt-2 flex">
        <div
          className="flex flex-col justify-between text-right text-[9px] font-mono text-slate-500 pr-1.5 shrink-0"
          style={{ height: PLOT_H }}
        >
          {ticks.map((t) => (
            <span key={t}>{fmt(t)}</span>
          ))}
        </div>
        <div
          className="flex-1 flex items-end justify-around gap-1 border-l border-b border-slate-300 px-1"
          style={{ height: PLOT_H }}
        >
          {data.map(([label, value]) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
            >
              <span className="text-[9px] font-bold text-slate-700 mb-0.5 whitespace-nowrap">
                {value === null ? "-" : fmt(value)}
              </span>
              {value !== null && (
                <div
                  className="w-4/5 max-w-[24px] rounded-t-[2px]"
                  style={{ height: `${(value / yMax) * (PLOT_H - 20)}px`, background: barColor }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex">
        <div className="w-8 shrink-0" />
        <div className="flex-1 flex justify-around">
          {data.map(([label]) => (
            <div key={label} className="flex-1 relative h-10 min-w-0">
              <span className="absolute left-1/2 top-1 block w-max origin-top-right -rotate-45 -translate-x-full text-[8.5px] text-slate-600 whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
