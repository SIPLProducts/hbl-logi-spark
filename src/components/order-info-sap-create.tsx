import { useEffect, useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

type FieldSpec = {
  label: string;
  value: string;
  type?: "text" | "select" | "date";
  options?: string[];
};

const FIELDS: FieldSpec[] = [
  { label: "Tax Invoice", value: "" },
  { label: "ODN Number", value: "" },
  { label: "Invoice Date", value: "", type: "date" },

  { label: "Basic Shipment Value", value: "" },
  { label: "Invoice Value With GST", value: "" },
  { label: "Fiscal Year", value: "" },

  { label: "Fiscal Quarter", value: "" },
  { label: "Month", value: "" },
  { label: "Required Date & Time", value: "", type: "date" },

  { label: "Reported Date & Time", value: "", type: "date" },
  { label: "Physical Dispatch Date & Time", value: "", type: "date" },
  {
    label: "Plant",
    value: "",
    type: "select",
    options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"],
  },

  {
    label: "Transaction Type",
    value: "",
    type: "select",
    options: [
      "FULL TRUCK LOAD",
      "CARGO",
      "RATE CONTRACT",
      "LOCAL TRANSPORTATION",
      "CUSTOMER TRANSPORTER",
      "COMPANY VEHICLE",
      "COURIER",
      "BY HAND",
    ],
  },
  {
    label: "Billing Transaction Type",
    value: "",
    type: "select",
    options: ["Domestic Invoice", "Export Invoice", "Stock Transfer"],
  },
  {
    label: "Division",
    value: "",
    type: "select",
    options: ["NCPP", "VSP", "Industrial"],
  },

  {
    label: "Sub Division",
    value: "",
    type: "select",
    options: [
      "FUZE",
      "IPS SYSTEM",
      "LITHIUM",
      "NCFP",
      "NCPP",
      "NCPP-VSEZ",
      "NCPP/ETP",
      "NCSP",
      "PE",
      "SILVER ZINC",
      "SYSTEM ORDERS",
      "THERMAL",
      "THERMAL,FUZE,SZ"
    ],
  },
  { label: "SO / Ref. Number", value: "" },
  { label: "Customer Name", value: "" },

  { label: "Customer Group", value: "" },
  { label: "Consignee Name", value: "" },
  { label: "Destination Location", value: "" },

  { label: "Destination State", value: "" },
  { label: "Destination Zone", value: "" },
];

function getLoggedInUser() {
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return "";
    const user = JSON.parse(raw) as Record<string, unknown>;
    return String(
      user?.USER ??
      user?.USERNAME ??
      user?.USER_ID ??
      user?.EMP_ID ??
      user?.EMAIL ??
      `${user?.FIRST_NAME ?? ""} ${user?.LAST_NAME ?? ""}`.trim() ??
      "",
    );
  } catch {
    return "";
  }
}

export function OrderInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [tableData, setTableData] = useState<any[]>([
    {
      REF_NO: "",
      WORK_ORDER_NO: "",
      LR_NO: "",
      TRANSPORTER: "",
      selected: false,
    },
  ]);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showFields = isWithout || revealed;
  const fields = isWithout ? FIELDS.map((f, i) => (i === 0 ? { ...f, label: "DC Reference Number" } : f)) : FIELDS;

  const fetchGlobalReferences = async (
    row: any,
    index: number,
    fieldKey: string
  ) => {

    if (index !== 0) return;
    try {
      const payload = {
        global_scr: "ORDER INFO",
        REF_NO: fieldKey === "REF_NO" ? row.REF_NO : "",
        WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? row.WORK_ORDER_NO : "",
        LR_NO: fieldKey === "LR_NO" ? row.LR_NO : "",
        TRANSPORTER: fieldKey === "TRANSPORTER" ? row.TRANSPORTER : "",
        LINE_NO: index + 1,
        ZUSER: getLoggedInUser(),
      };

      console.log("Payload:", payload);

      const response = isWithout
        ? await service.GlobalReferenceNoFetchwithoutsap(payload)
        : await service.GlobalReferenceNoFetch(payload);

      console.log("API Response:", response);

      // No Data Found
      if (response?.STATUS === "FALSE") {
        Swal.fire({
          icon: "warning",
          title: "No Data Found",
          text: response.MESSAGE || "No data found for given input.",
          confirmButtonText: "OK",
        });
        return;
      }

      // Success Response
      if (Array.isArray(response) && response.length > 0) {
        setTableData(
          response.map((item: any, idx: number) => ({
            ...item,
            selected: false,
            editable: idx === 0,
          }))
        );

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data fetched successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching references:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "Something went wrong while fetching data.",
      });
    }
  };

  



  const handleChange = (index: number, field: string, value: string) => {
    setTableData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
                    checked={row.selected || false}
                    onChange={() => { }}
                    className="size-4 accent-sky-600"
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  {index + 1}
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.REF_NO || ""}
                    readOnly={index !== 0}
                    onChange={(e) =>
                      handleChange(index, "REF_NO", e.target.value)
                    }
                    onBlur={() =>
                      fetchGlobalReferences(
                        row,
                        index,
                        "REF_NO"
                      )
                    }
                    className={GREEN_INPUT}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.WORK_ORDER_NO || ""}
                    readOnly={index !== 0}
                    onChange={(e) =>
                      handleChange(index, "WORK_ORDER_NO", e.target.value)
                    }
                    onBlur={() =>
                      fetchGlobalReferences(
                        row,
                        index,
                        "WORK_ORDER_NO"
                      )
                    }
                    className={GREEN_INPUT}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.LR_NO || ""}
                    readOnly={index !== 0}
                    onChange={(e) =>
                      handleChange(index, "LR_NO", e.target.value)
                    }
                    onBlur={() =>
                      fetchGlobalReferences(
                        row,
                        index,
                        "LR_NO"
                      )
                    }
                    className={GREEN_INPUT}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.TRANSPORTER || ""}
                    readOnly={index !== 0}
                    onChange={(e) =>
                      handleChange(index, "TRANSPORTER", e.target.value)
                    }
                    onBlur={() =>
                      fetchGlobalReferences(
                        row,
                        index,
                        "TRANSPORTER"
                      )
                    }
                    className={GREEN_INPUT}
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                    <MoreVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && (
            <>
              <div className="flex-1 min-w-[220px]">
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
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </>
          )}
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
            <button className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && (
        <>
          {/* Field grid */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              {fields.map((f) => (
                <SapField key={f.label} field={f} />
              ))}
            </div>
          </div>

          {/* Footer action bar */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
              <Save className="size-3.5" /> Save
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm">
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm">
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SapField({ field }: { field: FieldSpec }) {
  const { label, value, type = "text", options } = field;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {type === "select" ? (
        <select defaultValue={value} className={GREEN_INPUT}>
          <option value="" disabled>
            Select
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input type="datetime-local" defaultValue={value} className={GREEN_INPUT} />
      ) : (
        <input defaultValue={value} placeholder={`Enter ${label}`} className={GREEN_INPUT} />
      )}
    </div>
  );
}
