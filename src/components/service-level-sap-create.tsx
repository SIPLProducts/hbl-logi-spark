import { useState } from "react";
import { MoreVertical } from "lucide-react";

const GREEN_INPUT =
  "h-9 w-full rounded-md bg-white dark:bg-surface border border-emerald-400/70 px-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-300 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30";
const LABEL =
  "block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1";

const QUESTIONS = [
  "On time delivery",
  "Damage if any",
  "Accident if any",
  "On time POD submission",
  "On time freight bill submission",
] as const;
type Q = (typeof QUESTIONS)[number];

const RATINGS = ["Poor", "Avg", "Good", "Excellent"] as const;
type Rating = (typeof RATINGS)[number];

function YesNo({
  value,
  onChange,
}: {
  value: "yes" | "no" | null;
  onChange: (v: "yes" | "no") => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-1 px-4 h-7 rounded-full text-[11.5px] font-semibold border transition-colors";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={
          base +
          " " +
          (value === "yes"
            ? "bg-emerald-100 text-emerald-700 border-emerald-400"
            : "bg-muted text-muted-foreground border-hairline hover:bg-emerald-50")
        }
      >
        ✓ YES
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        className={
          base +
          " " +
          (value === "no"
            ? "bg-rose-100 text-rose-700 border-rose-400"
            : "bg-muted text-muted-foreground border-hairline hover:bg-rose-50")
        }
      >
        ✕ NO
      </button>
    </div>
  );
}

export function ServiceLevelSapCreate({
  loadType = null,
}: {
  mode?: "with" | "without";
  loadType?: "ftl" | "cargo" | null;
} = {}) {
  const [checked, setChecked] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<Q, "yes" | "no" | null>>(
    () => QUESTIONS.reduce((a, q) => ({ ...a, [q]: null }), {} as Record<Q, "yes" | "no" | null>),
  );
  const [overall, setOverall] = useState<Rating | null>(null);

  return (
    <div className="space-y-4">
      {/* Status chips */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[12px] font-semibold border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" /> Pending: 0
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Completed: 1
        </span>
      </div>

      {!loadType && (
        <p className="text-[12px] text-muted-foreground px-1">
          Select <span className="font-semibold">Full Truck Load</span> or{" "}
          <span className="font-semibold">Cargo</span> to continue.
        </p>
      )}

      {loadType && (
        <>
      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
              <th className="px-3 py-2.5 text-center w-16">Select</th>
              <th className="px-3 py-2.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-2.5 text-center">Reference Number</th>
              <th className="px-3 py-2.5 text-center">Work Order Number</th>
              <th className="px-3 py-2.5 text-center">LR Number</th>
              <th className="px-3 py-2.5 text-center">Transporter</th>
              <th className="px-3 py-2.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-2 text-center">1</td>
              <td className="px-3 py-2">
                <input defaultValue="1000000001" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="1234" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Invoice lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant max-w-md">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className={LABEL}>Invoice Number</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={GREEN_INPUT}
            />
          </div>
          <button
            onClick={() => {
              if (invoiceNumber.trim()) setRevealed(true);
            }}
            disabled={!invoiceNumber.trim()}
            className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
          >
            GET
          </button>
        </div>
      </div>

      {!revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load the feedback form.
        </p>
      )}

      {revealed && (
        <>
          {/* Shipment Feedback card */}
          <div className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden">
            <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
              <h3 className="text-[13px] font-semibold text-sky-600 tracking-tight">
                Shipment Feedback
              </h3>
            </div>
            <div className="divide-y divide-hairline/60">
              {QUESTIONS.map((q, idx) => (
                <div
                  key={q}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/[0.03]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-grid place-items-center size-6 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-[13px] font-medium text-foreground">{q}</span>
                  </div>
                  <YesNo
                    value={answers[q]}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q]: v }))}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-grid place-items-center size-6 rounded-full bg-violet-100 text-violet-700 text-[12px] font-bold">
                    ★
                  </span>
                  <span className="text-[13px] font-medium text-foreground">
                    Overall Feedback from User
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {RATINGS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOverall(r)}
                      className={
                        "px-4 h-7 rounded-full text-[11.5px] font-semibold border transition-colors " +
                        (overall === r
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10")
                      }
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end pt-2">
            <button className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
              Submit
            </button>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}