import { Check } from "lucide-react";

export type TimelineStep = {
  label: string;
  timestamp?: string;
  user?: string;
  state: "done" | "current" | "pending";
};

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isDone = step.state === "done";
        const isCurrent = step.state === "current";
        return (
          <li key={step.label} className="flex gap-3 pb-5 last:pb-0 relative">
            {!isLast && (
              <span
                className={
                  "absolute left-[11px] top-6 bottom-0 w-px " +
                  (isDone ? "bg-blue-500" : "bg-zinc-200")
                }
              />
            )}
            <div
              className={
                "size-[22px] rounded-full grid place-items-center shrink-0 ring-4 ring-white " +
                (isDone
                  ? "bg-blue-600 text-white"
                  : isCurrent
                  ? "bg-white border-2 border-blue-600 text-blue-600"
                  : "bg-zinc-100 border border-zinc-300 text-zinc-400")
              }
            >
              {isDone ? (
                <Check className="size-3" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </div>
            <div className="pt-0.5">
              <div
                className={
                  "text-[12.5px] font-semibold " +
                  (isCurrent
                    ? "text-blue-700"
                    : isDone
                    ? "text-zinc-900"
                    : "text-zinc-400")
                }
              >
                {step.label}
              </div>
              {(step.timestamp || step.user) && (
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  {step.timestamp}
                  {step.user ? ` · ${step.user}` : ""}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}