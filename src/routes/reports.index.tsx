import { createFileRoute, Link } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { REPORTS_NAV } from "@/lib/reports-nav";

export const Route = createFileRoute("/reports/")({
  component: ReportsHubPage,
});

function ReportsHubPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <FileBarChart className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Reports
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Generate operational, financial, and compliance reports across the dispatch lifecycle.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {REPORTS_NAV.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.to}
              to={r.to}
              className="group bg-surface border border-hairline rounded-2xl shadow-elegant p-5 hover:-translate-y-0.5 hover:shadow-cta transition-all"
            >
              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 grid place-items-center text-white shadow-sm">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-[14px] font-semibold text-foreground mt-3 group-hover:text-indigo-600">
                {r.title}
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">{r.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}