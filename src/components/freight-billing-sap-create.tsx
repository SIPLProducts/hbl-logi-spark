import { useEffect, useMemo, useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, X } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL =
  "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = [
  "Reference",
  "Invoice",
  "ODN",
  "SO Number",
  "Work Order",
  "LR Number",
];

const SEARCH_FIELD_MAP: Record<string, string> = {
  "Reference": "ref_no",
  "Invoice": "inv_no",
  "ODN": "odn_no",
  "SO Number": "so_no",
  "Work Order": "workorder_no",
  "LR Number": "lr_no",
};

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

const BREAKDOWN_FIELDS = [
  "Basic Freight",
  "Detention Loading",
  "Detention Unloading",
  "Loading Charges",
  "Unloading Charges",
  "Route Change",
  "Transhipment Charges",
  "Other Charges",
  "Deduction",
] as const;
type BreakdownKey = (typeof BREAKDOWN_FIELDS)[number];
type Breakdown = Record<BreakdownKey, number>;
const EMPTY_BREAKDOWN: Breakdown = BREAKDOWN_FIELDS.reduce((acc, k) => {
  acc[k] = 0;
  return acc;
}, {} as Breakdown);

function computeTotal(b: Breakdown) {
  const sum = BREAKDOWN_FIELDS.filter((k) => k !== "Deduction").reduce(
    (s, k) => s + (Number(b[k]) || 0),
    0,
  );
  return sum - (Number(b.Deduction) || 0);
}

function ChargesBreakdownDialog({
  open,
  onOpenChange,
  title,
  totalLabel,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  totalLabel: string;
  value: Breakdown;
  onSave: (b: Breakdown, total: number) => void;
}) {
  const [draft, setDraft] = useState<Breakdown>(value);
  const [taxMode, setTaxMode] = useState<"RCM" | "FCM">("RCM");
  const [gstAmount, setGstAmount] = useState<number>(0);
  // Sync when reopened
  const total = useMemo(() => computeTotal(draft), [draft]);
  const grandTotal = taxMode === "FCM" ? total + (Number(gstAmount) || 0) : total;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-surface border border-hairline shadow-elegant animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center justify-between">
          <h3 className="text-white text-[14px] font-semibold tracking-wide">{title}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-3 flex items-center gap-4">
            {(["RCM", "FCM"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name={`tax-mode-${title}`}
                  checked={taxMode === m}
                  onChange={() => setTaxMode(m)}
                  className="accent-primary"
                />
                {m}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
            {BREAKDOWN_FIELDS.map((k) => (
              <div key={k}>
                <label className={LABEL}>{k}</label>
                <input
                  type="number"
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [k]: Number(e.target.value) || 0 }))
                  }
                  className={GREEN_INPUT}
                />
              </div>
            ))}
            {taxMode === "FCM" && (
              <div>
                <label className={LABEL}>GST Amount</label>
                <input
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(Number(e.target.value) || 0)}
                  className={GREEN_INPUT}
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-semibold text-foreground">
            <span>{totalLabel}: {total}</span>
            {taxMode === "FCM" && (
              <>
                <span>GST Total: {Number(gstAmount) || 0}</span>
                <span>Grand Total: {grandTotal}</span>
              </>
            )}
          </div>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center px-5 h-9 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-semibold shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft, grandTotal);
              onOpenChange(false);
            }}
            className="inline-flex items-center px-5 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function FreightBillingSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {

  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [provision, setProvision] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return JSON.parse(sessionStorage.getItem("freight-billing-provision") || "false");
    } catch {
      return false;
    }
  });
  const [account, setAccount] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return JSON.parse(sessionStorage.getItem("freight-billing-account") || "false");
    } catch {
      return false;
    }
  });

  const [provisionBreakdown, setProvisionBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [provisionTotal, setProvisionTotal] = useState<number | "">("");
  const [provisionDate, setProvisionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-provision-date") || "";
    } catch {
      return "";
    }
  });
  const [provisionOpen, setProvisionOpen] = useState(false);

  const [freightBreakdown, setFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [freightTotal, setFreightTotal] = useState<number | "">("");
  const [freightOpen, setFreightOpen] = useState(false);
  const [freightBillNo, setFreightBillNo] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-no") || "";
    } catch {
      return "";
    }
  });
  const [freightBillDate, setFreightBillDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-date") || "";
    } catch {
      return "";
    }
  });
  const [billSubmissionDate, setBillSubmissionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-submission-date") || "";
    } catch {
      return "";
    }
  });
  const [physicalSubmissionDate, setPhysicalSubmissionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-physical-date") || "";
    } catch {
      return "";
    }
  });
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [searchOptionsList, setSearchOptionsList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  const [financeDetails, setFinanceDetails] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-finance-details") || "";
    } catch {
      return "";
    }
  });
  const [jvNumber, setJvNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-jv-number") || "";
    } catch {
      return "";
    }
  });
  const [jvDate, setJvDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-jv-date") || "";
    } catch {
      return "";
    }
  });
  const [utrNumber, setUtrNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-utr-number") || "";
    } catch {
      return "";
    }
  });
  const [utrDate, setUtrDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-utr-date") || "";
    } catch {
      return "";
    }
  });

  const resetFormState = () => {
    setChecked(false);
    setSearchType("");
    setSearchValue("");
    setProvision(false);
    setAccount(false);
    setProvisionBreakdown(EMPTY_BREAKDOWN);
    setProvisionTotal("");
    setProvisionDate("");
    setProvisionOpen(false);
    setFreightBreakdown(EMPTY_BREAKDOWN);
    setFreightTotal("");
    setFreightOpen(false);
    setFreightBillNo("");
    setFreightBillDate("");
    setBillSubmissionDate("");
    setPhysicalSubmissionDate("");
    setItemsList([]);
    setShowTable(false);
    setTableData([EMPTY_ROW()]);
    setSearchOptionsList([]);
    setShowForm(true);
    setFinanceDetails("");
    setJvNumber("");
    setJvDate("");
    setUtrNumber("");
    setUtrDate("");

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("freight-billing-provision");
      sessionStorage.removeItem("freight-billing-account");
      sessionStorage.removeItem("freight-billing-provision-date");
      sessionStorage.removeItem("freight-billing-no");
      sessionStorage.removeItem("freight-billing-date");
      sessionStorage.removeItem("freight-billing-submission-date");
      sessionStorage.removeItem("freight-billing-physical-date");
      sessionStorage.removeItem("freight-billing-finance-details");
      sessionStorage.removeItem("freight-billing-jv-number");
      sessionStorage.removeItem("freight-billing-jv-date");
      sessionStorage.removeItem("freight-billing-utr-number");
      sessionStorage.removeItem("freight-billing-utr-date");
    }
  };

  useEffect(() => {
    resetFormState();
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("freight-billing-provision", JSON.stringify(provision));
    sessionStorage.setItem("freight-billing-account", JSON.stringify(account));
    sessionStorage.setItem("freight-billing-provision-date", provisionDate);
    sessionStorage.setItem("freight-billing-no", freightBillNo);
    sessionStorage.setItem("freight-billing-date", freightBillDate);
    sessionStorage.setItem("freight-billing-submission-date", billSubmissionDate);
    sessionStorage.setItem("freight-billing-physical-date", physicalSubmissionDate);
  }, [provision, account, provisionDate, freightBillNo, freightBillDate, billSubmissionDate, physicalSubmissionDate]);


  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "TRANSIT INFO",
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

  const saveFreightBilling = async (
    action = "stay" // stay | next | previous
  ) => {
    try {
      // Find selected row
      const selectedRow = tableData.find((row) => row.selected);

      if (!selectedRow) {
        Swal.fire({
          icon: "warning",
          text: "Please select at least one reference row before saving",
        });
        return;
      }

      const record = {
        INV_NO: "",
        REFNO: selectedRow.REF_NO,
        LINE_NO: selectedRow.LINE_NO,
        BILLNO: freightBillNo,
        BILLDATE: freightBillDate,

        PRO_CHK: provision ? "X" : "",
        ACC_CHK: account ? "X" : "",

        PROVDT: provisionDate,
        PROVAMT: provisionTotal || 0,

        PHY_DATE: physicalSubmissionDate,
        FRT_CHARGES: freightTotal || 0,

        ORDER_NO: selectedRow.WORK_ORDER_NO,
        WORKORDER: selectedRow.WORK_ORDER_NO,
        LRNO: selectedRow.LR_NO,
        TRANSPORTER: selectedRow.TRANSPORTER,

        BILL_SUBMISSION: billSubmissionDate,

        FRBILLUP: "",
        UNLOADAPP: "",
        DETENTUP: "",
        WORDUP: "",

        // Freight Charges
        ZFC_BASIC: account ? freightBreakdown["Basic Freight"] : 0,
        ZFC_DELOAD: account ? freightBreakdown["Detention Loading"] : 0,
        ZFC_DEUNLOAD: account ? freightBreakdown["Detention Unloading"] : 0,
        ZFC_LOAD: account ? freightBreakdown["Loading Charges"] : 0,
        ZFC_UNLOAD: account ? freightBreakdown["Unloading Charges"] : 0,
        ZFC_ROUTE: account ? freightBreakdown["Route Change"] : 0,
        ZFC_TSHIP: account ? freightBreakdown["Transhipment Charges"] : 0,
        ZFC_OTHER: account ? freightBreakdown["Other Charges"] : 0,
        ZFC_DEDUCT: account ? freightBreakdown["Deduction"] : 0,

        // Provision Breakdown
        ZPR_BASIC: provision ? provisionBreakdown["Basic Freight"] : 0,
        ZPR_DELOAD: provision ? provisionBreakdown["Detention Loading"] : 0,
        ZPR_DEUNLOAD: provision ? provisionBreakdown["Detention Unloading"] : 0,
        ZPR_LOAD: provision ? provisionBreakdown["Loading Charges"] : 0,
        ZPR_UNLOAD: provision ? provisionBreakdown["Unloading Charges"] : 0,
        ZPR_ROUTE: provision ? provisionBreakdown["Route Change"] : 0,
        ZPR_TSHIP: provision ? provisionBreakdown["Transhipment Charges"] : 0,
        ZPR_OTHER: provision ? provisionBreakdown["Other Charges"] : 0,
        ZPR_DEDUCT: provision ? provisionBreakdown["Deduction"] : 0,
      };

      console.log(record);

      const response = isSap
        ? await service.FreightBillingSave({ SAVE: [record] })
        : await service.FreightBillingNonSap({ CREATE: [record] });

      if (response.STATUS === "true" || response.NUMBER === "200") {
        await Swal.fire({
          icon: "success",
          text: response.MESSAGE || "Freight Billing Saved Successfully",
        });

        if (action === "next") {
          console.log("Navigate Next");
          // navigate("/transit-damage-info");
        } else if (action === "previous") {
          console.log("Navigate Previous");
          // navigate("/transit-info");
        } else {
          console.log("Reset Form");
        }
      } else {
        Swal.fire({
          icon: "error",
          text: response.MESSAGE || "Save Failed",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving.",
      });
    }
  };

  const onSearchReference = async () => {
    setShowForm(true);

    if (!searchValue.trim()) {
      Swal.fire({
        icon: "warning",
        text: "Please enter a value",
      });
      return;
    }

    if (!searchType) {
      Swal.fire({
        icon: "info",
        text: "Please select a search type",
      });
      return;
    }

    const payload = {
      global: "FREIGHT BILLING",
      data: {
        ref_no: "",
        inv_no: "",
        so_no: "",
        transporter: "",
        lr_no: "",
        workorder_no: "",
        sales_person: "",
        location: "",
        odn_no: "",
        vehicle_no: "",
        freight_billno: "",
        nature_damage: "",
        claim_status: "",
      },
    };

    const apiField = SEARCH_FIELD_MAP[searchType];

    payload.data[apiField as keyof typeof payload.data] = searchValue.trim();

    console.log("Payload", payload);

    try {
      const res = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      console.log("Response", res);

      if (res.NUMBER === "100" && res.STATUS === "FALSE") {
        setSearchOptionsList([]);
        setShowForm(true);
        Swal.fire({
          icon: "warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res.HEADER || res.HEADER.length === 0) {
        setSearchOptionsList([]);
        setShowForm(true);
        Swal.fire({
          icon: "info",
          text: "No records found",
        });
        return;
      }

      setSearchOptionsList(
        res.HEADER.map((item: any) => ({
          ...item,
          isEdit: false,
        }))
      );

      setShowForm(false);

      Swal.fire({
        icon: "success",
        text: "Data fetched successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);

      setShowForm(true);
      Swal.fire({
        icon: "error",
        text: "Error fetching data",
      });
    }
  };

  return (
    <div className="space-y-2">

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
                    onChange={(e) => {
                      setTableData((prev) =>
                        prev.map((item, i) => ({
                          ...item,
                          selected: i === index ? e.target.checked : false,
                        }))
                      );
                    }}
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

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
            >
              <option value="">Select</option>
              {SEARCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button
              onClick={onSearchReference}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {!showForm && searchOptionsList.length > 0 && (
        <div className="max-h-[560px] overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Ref No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Invoice No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Line No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">ODN No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">SO No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Sales Person</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">P/A Check</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Provision Amount</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Provision Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Bill No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Bill Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Physical Submission</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Work Order</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Bill Submission</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">LR No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Transporter</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Location</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Created Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle Line</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-hairline/70">
                {searchOptionsList.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-surface hover:bg-muted/50"
                        : "bg-surface-2/40 hover:bg-muted/50"
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZINV_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          className={GREEN_INPUT}
                          value={item.ZODN_NO || ""}
                          onChange={(e) => {
                            const list = [...searchOptionsList];
                            list[index].ZODN_NO = e.target.value;
                            setSearchOptionsList(list);
                          }}
                        />
                      ) : (
                        item.ZODN_NO
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          className={GREEN_INPUT}
                          value={item.ZSONO || ""}
                          onChange={(e) => {
                            const list = [...searchOptionsList];
                            list[index].ZSONO = e.target.value;
                            setSearchOptionsList(list);
                          }}
                        />
                      ) : (
                        item.ZSONO
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          className={GREEN_INPUT}
                          value={item.ZSALE_PERSON || ""}
                          onChange={(e) => {
                            const list = [...searchOptionsList];
                            list[index].ZSALE_PERSON = e.target.value;
                            setSearchOptionsList(list);
                          }}
                        />
                      ) : (
                        item.ZSALE_PERSON
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <button className="bg-blue-500 text-white px-2 rounded">
                        View
                      </button>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZPROVAMT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZPROVDT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZBILLNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZBILLDATE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZPHY_DATE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZFRT_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZWORK_ORDER}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZBILL_SUBMISSION}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLRNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZTRANSPORTER}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLOCATION}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZVEH_NUM}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZCREATED_DT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZVEH_LINE}</td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {!item.isEdit ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-blue-500 text-white px-2 rounded"
                          // onClick={() => editSearchRow(index)}
                          >
                            Edit
                          </button>

                          <button
                            className="bg-red-500 text-white px-2 rounded"
                          // onClick={() => deleteRow(index)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-green-500 text-white px-2 rounded"
                          // onClick={() => updateSearchRow(index)}
                          >
                            Save
                          </button>

                          <button
                            className="bg-gray-500 text-white px-2 rounded"
                          // onClick={() => cancelSearchEdit(index)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Field grid */}
      {showForm && (
        <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
            <div>
              <label className={LABEL}>Invoice Number</label>
              <input placeholder="Enter Invoice Number" className={GREEN_INPUT} />
            </div>
            <div>
              <label className={LABEL}>Transportation Type</label>
              <input placeholder="Enter Transportation Type" className={GREEN_INPUT} />
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={provision}
                  onChange={(e) => {
                    setProvision(e.target.checked);
                    if (e.target.checked) setAccount(false);
                  }}
                  className="size-4 accent-emerald-600"
                />
                Provision
              </label>
              <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={account}
                  onChange={(e) => {
                    setAccount(e.target.checked);
                    if (e.target.checked) setProvision(false);
                  }}
                  className="size-4 accent-emerald-600"
                />
                Account
              </label>
            </div>

            {provision && (
              <>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Provision Amount</label>
                  <input
                    readOnly
                    value={provisionTotal === "" ? "" : String(provisionTotal)}
                    onClick={() => setProvisionOpen(true)}
                    placeholder="Click to enter amount"
                    className={GREEN_INPUT + " cursor-pointer"}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Provision Date</label>
                  <input
                    type="date"
                    value={provisionDate}
                    onChange={(e) => setProvisionDate(e.target.value)}
                    className={GREEN_INPUT}
                  />
                </div>
              </>
            )}

            {account && (
              <>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Freight Bill Number</label>
                  <input
                    value={freightBillNo}
                    onChange={(e) => setFreightBillNo(e.target.value)}
                    placeholder="Freight Bill Number"
                    className={GREEN_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Freight Bill Date</label>
                  <input
                    type="date"
                    value={freightBillDate}
                    onChange={(e) => setFreightBillDate(e.target.value)}
                    className={GREEN_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Physical Submission Date</label>
                  <input
                    type="date"
                    value={physicalSubmissionDate}
                    onChange={(e) => setPhysicalSubmissionDate(e.target.value)}
                    className={GREEN_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Freight Charges</label>
                  <input
                    readOnly
                    value={freightTotal === "" ? "" : String(freightTotal)}
                    onClick={() => setFreightOpen(true)}
                    placeholder="Click to enter charges"
                    className={GREEN_INPUT + " cursor-pointer"}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={LABEL}>Bill Submission To F&amp;A</label>
                  <input
                    type="date"
                    value={billSubmissionDate}
                    onChange={(e) => setBillSubmissionDate(e.target.value)}
                    className={GREEN_INPUT}
                  />
                </div>
              </>
            )}

            <div>
              <label className={LABEL}>Freight Bill upload</label>
              <input type="file" className={GREEN_INPUT + " py-1.5"} />
            </div>
            <div>
              <label className={LABEL}>Unloading Charges Approval</label>
              <input type="file" className={GREEN_INPUT + " py-1.5"} />
            </div>
            <div>
              <label className={LABEL}>Detention Charges Uploading</label>
              <input type="file" className={GREEN_INPUT + " py-1.5"} />
            </div>
            <div>
              <label className={LABEL}>Work Order Uploading</label>
              <input type="file" className={GREEN_INPUT + " py-1.5"} />
            </div>
          </div>
        </div>
      )}

      {/* Footer action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button
          onClick={() => saveFreightBilling("stay")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
        >
          <Save className="size-3.5" />
          Save
        </button>
        <button
          onClick={() => saveFreightBilling("next")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm"
        >
          Save and Next
          <ChevronRight className="size-3.5" />
        </button>
        <button
          onClick={() => saveFreightBilling("previous")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm"
        >
          <ChevronLeft className="size-3.5" />
          Save and Previous
        </button>
      </div>

      <ChargesBreakdownDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Detailed Provision Amount Input"
        totalLabel="Total Provision"
        value={provisionBreakdown}
        onSave={(b, total) => {
          setProvisionBreakdown(b);
          setProvisionTotal(total);
        }}
      />
      <ChargesBreakdownDialog
        open={freightOpen}
        onOpenChange={setFreightOpen}
        title="Detailed Freight Charges Input"
        totalLabel="Total Freight"
        value={freightBreakdown}
        onSave={(b, total) => {
          setFreightBreakdown(b);
          setFreightTotal(total);
        }}
      />
    </div>
  );
}