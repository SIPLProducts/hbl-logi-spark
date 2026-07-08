import { useState } from "react";
import { MoreVertical } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

type TableRow = {
  REF_NO: string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: string;
  selected: boolean;
};

const EMPTY_ROW = (): TableRow => ({
  REF_NO: "", WORK_ORDER_NO: "", LR_NO: "", TRANSPORTER: "", LINE_NO: "", selected: false,
});


function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

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

function YesNo({ value, onChange }: { value: "yes" | "no" | null; onChange: (v: "yes" | "no") => void }) {
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

type ServiceLevelSapCreateProps = {
  mode?: "with" | "without";
  loadType?: "ftl" | "cargo" | null;
};

export function ServiceLevelSapCreate({
  mode = "with",
  loadType,
}: ServiceLevelSapCreateProps) {

  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [selectedItems, setSelectedItems] = useState<TableRow[]>([]);
  const [answers, setAnswers] = useState<Record<Q, "yes" | "no" | null>>(() =>
    QUESTIONS.reduce((a, q) => ({ ...a, [q]: null }), {} as Record<Q, "yes" | "no" | null>),
  );
  const [overall, setOverall] = useState<Rating | null>(null);


  const onCheckboxChange = (
    checked: boolean,
    row: TableRow,
    index: number
  ) => {

    // Update table checkbox
    setTableData((prev) =>
      prev.map((item, i) => ({
        ...item,
        selected: i === index ? checked : item.selected,
      }))
    );

    if (checked) {
      setSelectedItems((prev) => {

        const exists = prev.some(
          (item) =>
            item.REF_NO === row.REF_NO &&
            item.WORK_ORDER_NO === row.WORK_ORDER_NO &&
            item.LR_NO === row.LR_NO &&
            item.TRANSPORTER === row.TRANSPORTER
        );

        if (exists) return prev;

        return [...prev, row];
      });
    } else {
      setSelectedItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.REF_NO === row.REF_NO &&
              item.WORK_ORDER_NO === row.WORK_ORDER_NO &&
              item.LR_NO === row.LR_NO &&
              item.TRANSPORTER === row.TRANSPORTER
            )
        )
      );
    }

    console.log("Selected Items:", selectedItems);
  };

  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "SERVICE LEVEL",
      TYPE_OPTION: loadType, // <-- Add this
      REF_NO: fieldKey === "REF_NO" ? row.REF_NO : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? row.WORK_ORDER_NO : "",
      LR_NO: fieldKey === "LR_NO" ? row.LR_NO : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? row.TRANSPORTER : "",
      LINE_NO: row.LINE_NO || "",
      ZUSER: getLoggedInUser(),
    };

    try {
      const res: any = isSap
        ? await service.GlobalReferenceNoFetch(payload)
        : await service.GlobalReferenceNoFetchwithoutsap(payload);

      if (res?.STATUS === "FALSE") {
        Swal.fire({ icon: "info", title: "No Records Found", text: "No matching reference details found.", timer: 1500, showConfirmButton: false });
        setTableData([EMPTY_ROW()]);
        return;
      }
      if (Array.isArray(res) && res.length > 0) {
        setTableData(res.map((item: any) => ({
          REF_NO: item.REF_NO || "",
          WORK_ORDER_NO: item.WORK_ORDER_NO || "",
          LR_NO: item.LR_NO || "",
          TRANSPORTER: item.TRANSPORTER || "",
          LINE_NO: item.LINE_NO || "",
          selected: false,
        })));
      } else {
        setTableData([EMPTY_ROW()]);
      }
    } catch (e) {
      console.error("GlobalReference fetch error:", e);
      Swal.fire({ icon: "error", text: "Error fetching reference details." });
    }
  };

  const submitFeedback = async () => {
    // 1. Selected row
   if (selectedItems.length === 0) {
  Swal.fire({
    icon: "warning",
    title: "No Reference Selected",
    text: "Please select at least one reference row",
  });
  return;
}

    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Reference Selected",
        text: "Please select at least one reference row",
      });
      return;
    }

    // 2. Invoice validation
    if (!invoiceNumber.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Invoice Missing",
        text: "Please enter Invoice Number",
      });
      return;
    }

    // 3. Overall feedback validation
    if (!overall) {
      Swal.fire({
        icon: "warning",
        title: "Feedback Missing",
        text: "Please provide overall feedback.",
      });
      return;
    }

    const payload = selectedItems.map((item) => ({
      ZREFNO: item.REF_NO,
      ZLINE_NO: item.LINE_NO,
      VBELN: invoiceNumber,
      ZLRNO: item.LR_NO,
      ZTRANSPORTER: item.TRANSPORTER,
      ZWORK_ORDER: item.WORK_ORDER_NO,
      ZVEH_TYPE: loadType,

      ZONTIME: answers["On time delivery"],
      ZTRNSMNT: "",
      ZONDELV: answers["On time delivery"],
      ZDAMAGE: answers["Damage if any"],
      ZACCIDENT: answers["Accident if any"],
      ZPROBIATED: "",
      ZLOADTRANSIT: "",
      ZONPOD: answers["On time POD submission"],
      ZONFREIGHT: answers["On time freight bill submission"],
      ZFEEDBACK: overall,

      ZTOT_SCORE: "",
      ZPALNT: "",
      ZDIVISION: "",
      ZUSER: getLoggedInUser(),
      ZSUBMIT_DT: new Date().toISOString().slice(0, 10),
    }));

    console.log(payload);

    try {
      const res = isSap
        ? await service.FeedbackCreationwithsap(payload)
        : await service.FeedbackCreationwithoutsap(payload);

      if (res?.STATUS === "FALSE") {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: res.MESSAGE,
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Feedback Submitted Successfully",
      });

      setInvoiceNumber("");
      setOverall(null);
      setAnswers(
        QUESTIONS.reduce(
          (acc, q) => ({ ...acc, [q]: null }),
          {} as Record<Q, "yes" | "no" | null>
        )
      );
      setTableData([EMPTY_ROW()]);
      setRevealed(false);
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong",
      });
    }
  };

const getInvoiceDetails = async () => {

  // 1. Check selected row
  if (selectedItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Please select one row",
    });
    return;
  }

  // 2. Check invoice number
  if (!invoiceNumber.trim()) {
    Swal.fire({
      icon: "warning",
      title: "Invoice Missing",
      text: "Please enter Invoice Number",
    });
    return;
  }

  // 3. Check truck type
  if (!loadType) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Please select Truck Type",
    });
    return;
  }

  const selected = selectedItems[0];

  const payload = {
    INV_DEF: invoiceNumber,
    ZREFNO: selected.REF_NO,
    ZLINE_NO: selected.LINE_NO || "",
  };

  console.log("Invoice Payload:", payload);

  try {
    const res = isSap
      ? await service.FeedBackInvoiceDetailsfetchwithsap(payload)
      : await service.FeedBackInvoiceDetailsfetchwithoutsap(payload);

    // No data
    if (res?.STATUS === "FALSE") {
      setRevealed(false);

      Swal.fire({
        icon: "warning",
        title: "No Data Found",
        text: res.MESSAGE,
      });

      return;
    }

    // Success
    if (Array.isArray(res) && res.length > 0) {
      const data = res[0];

      setAnswers({
        "On time delivery": data.ZONDELV === "YES" ? "yes" : "no",
        "Damage if any": data.ZDAMAGE === "YES" ? "yes" : "no",
        "Accident if any": data.ZACCIDENT === "YES" ? "yes" : "no",
        "On time POD submission": data.ZONPOD === "YES" ? "yes" : "no",
        "On time freight bill submission":
          data.ZONFREIGHT === "YES" ? "yes" : "no",
      });

      setOverall(data.ZFEEDBACK);
      setRevealed(true);

      Swal.fire({
        icon: "success",
        title: "Invoice Details Loaded Successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  } catch (err) {
    console.error(err);

    Swal.fire({
      icon: "error",
      title: "API Error",
      text: "Unable to load invoice details",
    });
  }
};

  return (
    <div className="space-y-2">

      {!loadType && (
        <p className="text-[12px] text-muted-foreground px-1">
          Select <span className="font-semibold">Full Truck Load</span> or <span className="font-semibold">Cargo</span>{" "}
          to continue.
        </p>
      )}

      {loadType && (
        <>
          {/* Selection table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                  <th className="px-3 py-0.5 text-center w-16">Select</th>
                  <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
                  <th className="px-3 py-0.5 text-center">Reference Number</th>
                  <th className="px-3 py-0.5 text-center">Work Order Number</th>
                  <th className="px-3 py-0.5 text-center">LR Number</th>
                  <th className="px-3 py-0.5 text-center">Transporter</th>
                  <th className="px-3 py-0.5 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) =>
                          onCheckboxChange(
                            e.target.checked,
                            row,
                            index
                          )
                        }
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      {index + 1}
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.REF_NO}
                        onChange={(e) =>
                          setTableData(prev => {
                            const copy = [...prev];
                            copy[index].REF_NO = e.target.value;
                            return copy;
                          })
                        }
                        onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.WORK_ORDER_NO}
                        onChange={(e) =>
                          setTableData(prev => {
                            const copy = [...prev];
                            copy[index].WORK_ORDER_NO = e.target.value;
                            return copy;
                          })
                        }
                        onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.LR_NO}
                        onChange={(e) =>
                          setTableData(prev => {
                            const copy = [...prev];
                            copy[index].LR_NO = e.target.value;
                            return copy;
                          })
                        }
                        onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.TRANSPORTER}
                        onChange={(e) =>
                          setTableData(prev => {
                            const copy = [...prev];
                            copy[index].TRANSPORTER = e.target.value;
                            return copy;
                          })
                        }
                        onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      <button>
                        <MoreVertical className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice lookup bar */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant max-w-md">
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
                onClick={getInvoiceDetails}
                disabled={!invoiceNumber.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
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
                  <h3 className="text-[13px] font-semibold text-sky-600 tracking-tight">Shipment Feedback</h3>
                </div>
                <div className="divide-y divide-hairline/60">
                  {QUESTIONS.map((q, idx) => (
                    <div key={q} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/[0.03]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-grid place-items-center size-6 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-medium text-foreground">{q}</span>
                      </div>
                      <YesNo value={answers[q]} onChange={(v) => setAnswers((a) => ({ ...a, [q]: v }))} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-grid place-items-center size-6 rounded-full bg-violet-100 text-violet-700 text-[12px] font-bold">
                        ★
                      </span>
                      <span className="text-[13px] font-medium text-foreground">Overall Feedback from User</span>
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
                <button
                  onClick={submitFeedback}
                  className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
                >
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
