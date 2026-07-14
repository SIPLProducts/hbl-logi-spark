import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

type FieldSpec = {
  label: string;
  key: string;
  value?: string;
  type?: "text" | "select" | "date" | "file";
  options?: string[];
  placeholder?: string;
};

type TableRow = {
  REF_NO: string;
  MAPID: number | string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: number | string;
  selected: boolean;
};
const EMPTY_ROW = (): TableRow => ({
  REF_NO: "",
  MAPID: "",
  WORK_ORDER_NO: "",
  LR_NO: "",
  TRANSPORTER: "",
  LINE_NO: "",
  selected: false,
});

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

const BASE_FIELDS: FieldSpec[] = [
  { label: "Fiscal Year", key: "FI" },
  { label: "Reported Date", key: "REP_DATE", type: "date" },
  { label: "Claim Reference", key: "CLAIM_REF" },
  { label: "Invoice Date", key: "INV_DATE", type: "date" },
  { label: "Invoice Basic Value", key: "INV_BV" },
  { label: "Loss Declared", key: "LOSS_DCL" },
  { label: "Claim Received", key: "CLM_RF", type: "date" },
  { label: "Salvage Value", key: "SOL_VAL" },
  { label: "Customer", key: "CUSTOMER" },
  { label: "SO Number", key: "SO_NO" },
  { label: "Location", key: "LOCATION" },
  { label: "Damage Remarks", key: "DAMAGE_RMK", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"] },
  { label: "Claim Info Sent", key: "CLM_INF" },
  { label: "Claim Status", key: "CLM_ST", type: "select", options: ["Under preparation", "Submitted", "Not submitted"] },
  { label: "Claim Document Status", key: "CLM_DOC_ST" },
  { label: "Courier Details", key: "COURIER_DET" },
  { label: "Payment Status", key: "PAY_ST", type: "select", options: ["Pending", "Settled"] },
  { label: "Payment Info", key: "PAY_INFO" },
  { label: "UTR", key: "UTR" },
  { label: "Claim Settlement Date", key: "CLM_SET_DT", type: "date" },
  { label: "Supporting Document", key: "ZSUPT_DOC", type: "file" },
  { label: "Approve Document", key: "ZAPP_DOC", type: "file" },
];

export function InsuranceClaimTrackingSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {

  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(!isWithout);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showFields = isWithout || revealed;
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const fields: FieldSpec[] = isWithout
    ? [
      {
        label: "DC Reference Number",
        key: "DC_REF_NO",
        type: "text",
      },
      ...BASE_FIELDS,
    ]
    : BASE_FIELDS;
  const [headerData, setHeaderData] = useState<any>({});
  const [itemData, setItemData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<TableRow[]>([]);
  const [supportingBase64, setSupportingBase64] = useState("");
  const [supportingPath, setSupportingPath] = useState("");

  const [approveBase64, setApproveBase64] = useState("");
  const [approvePath, setApprovePath] = useState("");


  const onCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const checked = event.target.checked;

    const updated = [...tableData];
    updated[index].selected = checked;
    setTableData(updated);

    const selected = updated.filter((x) => x.selected);
    setSelectedItems(selected);

    setLookupValue("");
  };

  const populateReferenceRows = (data: any[]) => {
    if (!data || data.length === 0) {
      setTableData([EMPTY_ROW()]);
      setInvoiceF4List([]);
      return;
    }

    const invoiceList: string[] = [];

    const rows = data.map((d: any) => {
      if (Array.isArray(d.INV_NO)) {
        d.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !invoiceList.includes(inv.VBELN)) {
            invoiceList.push(inv.VBELN);
          }
        });
      }

      return {
        MAPID: d.MAPID ?? "",
        REF_NO: String(d.REF_NO ?? ""),
        WORK_ORDER_NO: d.WORK_ORDER_NO ?? "",
        LR_NO: d.LR_NO ?? "",
        TRANSPORTER: d.TRANSPORTER ?? "",
        LINE_NO: d.LINE_NO ?? "",
        selected: false,
      };
    });

    setTableData(rows);
    setInvoiceF4List(invoiceList);

    console.log("Invoice F4:", invoiceList);
  };

  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    // if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "INSURANCE CLAIM STATUS",
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
        populateReferenceRows(res);
      } else {
        setTableData([EMPTY_ROW()]);
      }
    } catch (e) {
      console.error("GlobalReference fetch error:", e);
      Swal.fire({ icon: "error", text: "Error fetching reference details." });
    }
  };

  const fetchInvoiceDetails = async () => {
    if (!lookupValue) {
      Swal.fire("Warning", "Please enter Invoice number", "warning");
      return;
    }

    const selectedRef = selectedItems[0] || {};

    const payload = {
      VBELN: lookupValue,
      ZREFNO: selectedRef.REF_NO || "",
      ZMAPID: selectedRef.MAPID || "",
    };

    console.log("With SAP Invoice Fetch Payload:", payload);

    try {
      setLoading(true);

      const res: any = await service.InsuranceClaimTrackingfetch(payload);

      setLoading(false);

      console.log("With SAP Invoice Fetch Response:", res);

      if (res?.STATUS === "False") {
        Swal.fire("Info", res.MESSAGE, "info");
        return;
      }

      Swal.fire(
        "Success",
        "Invoice Details fetched successfully!",
        "success"
      );

      const header = res?.[0]?.HEADER || {};
      const items = res?.[0]?.ITEM || [];

      console.log("Header:", header);
      console.log("Items:", items);

      // Show the form
      setRevealed(true);

      // Header data
      setHeaderData({
        INV_NO: header.INV_NO || "",
        FI: header.FI || "",
        REP_DATE: header.REP_DATE || "",
        CLAIM_REF: header.CLAIM_REF || "",
        INV_DATE: header.INV_DATE || "",
        INV_BV: header.INV_BV || "",
        LOSS_DCL: header.LOSS_DCL || "",
        CLM_RF: header.CLM_RF || "",
        SOL_VAL: header.SOL_VAL || "",
        CUSTOMER: header.CUSTOMER || "",
        ODN_NO: header.ODN_NO || "",
        SO_NO: header.SO_NO || "",
        SALE_PERSON: header.SALE_PERSON || "",
        LOCATION: header.LOCATION || "",
        DAMAGE_RMK: header.DAMAGE_RMK || "",
        CLM_INF: header.CLM_INF || "",
        CLM_ST: header.CLM_ST || "",
        CLM_DOC_ST: header.CLM_DOC_ST || "",
        COURIER_DET: header.COURIER_DET || "",
        PAY_ST: header.PAY_ST || "",
        PAY_INFO: header.PAY_INFO || "",
        UTR: header.UTR || "",
        CLM_SET_DT: header.CLM_SET_DT || "",
      });

      // Item table
      const tableRows = items.map((x: any) => ({
        selected: false,
        ZMAPID: x.ZMAPID || x.MAPID || "",
        ZREFNO: x.ZREFNO || "",
        ZLINE_NO: x.ZLINE_NO || "",
        INV_NO: x.INV_NO || "",
        POSNR: x.POSNR || "",
        VEH_LINE: x.VEH_LINE || "",
        VEHICLE: x.VEHICLE || "",
        TRUCK_NO: x.TRUCK_NO || "",
        LR_NO: x.LR_NO || "",
        AH: x.AH || "",
        NO_SETS: x.NO_SETS || "",
        TRANSPORTER: x.TRANSPORTER || "",
        WORK_ORDER: x.WORK_ORDER || "",
        BILLNO: x.BILLNO || "",
      }));

      setItemData(tableRows);
      console.log("Item Data:", tableRows);

    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire("Error", "Error fetching data", "error");
    }
  };

  const onSaveActionSap = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {
    try {
      // Selected Rows
      const filtered = itemData
        .filter((row: any) => row.selected)
        .map(({ selected, ...row }: any) => ({
          ...row,
        }));

      if (filtered.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: "Please select at least one product row.",
        });
        return;
      }

      const selectedRef = selectedItems[0] || {};

      //------------------------------------
      // Header
      //------------------------------------

      const headerValue = {
        ...headerData,

        INV_NO: lookupValue,

        LINE_NO:
          selectedRef.LINE_NO ||
          filtered[0]?.LINE_NO ||
          0,

        REFNO:
          selectedRef.REF_NO || 0,

        SO_NO: headerData.SO_NO || "",

        ODN_NO: headerData.ODN_NO || "",

        SALE_PERSON: headerData.SALE_PERSON || "",

        ZSUPT_DOC: supportingBase64,

        ZSUPT_PATH: supportingPath,

        ZAPP_DOC: approveBase64,

        ZAPP_PATH: approvePath,

        ZUSER: getLoggedInUser(),

        ZUSER_CH: "",
      };

      //------------------------------------
      // Items
      //------------------------------------

      filtered.forEach((row: any) => {
        row.INV_NO = lookupValue;

        row.LINE_NO =
          selectedRef.LINE_NO ||
          row.LINE_NO ||
          0;

        row.REFNO = headerValue.REFNO;
      });

      //------------------------------------
      // Payload
      //------------------------------------

      const payload = {
        HEADER: headerValue,
        ITEM: filtered,
      };

      console.log("Save Payload", payload);

      setLoading(true);

      const res: any =
        await service.InsuranceClaimTrackingSave(payload);

      setLoading(false);

      if (res?.STATUS === "TRUE") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Saved Successfully",
        });

        if (action === "next") {
          console.log("Navigate Next");
        } else if (action === "previous") {
          console.log("Navigate Previous");
        } else {
          console.log("Stay");
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: res?.MESSAGE || "Save Failed",
        });
      }
    } catch (err) {
      setLoading(false);

      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error while saving.",
      });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };

      reader.onerror = reject;
    });
  };

  return (
    <div className="space-y-2">
      {/* Reference table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-0.5 text-center">Map ID</th>
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
                    onChange={(e) => onCheckboxChange(e, index)}
                    className="size-4 accent-sky-600"
                  />
                </td>

                <td className="px-3 py-0.5 text-center">{index + 1}</td>

                {/* MAP ID */}
                <td className="px-3 py-0.5">
                  <input
                    value={row.MAPID}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].MAPID = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "MAPID")}
                    placeholder="Enter Map ID"
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                {/* Reference Number */}
                <td className="px-3 py-0.5">
                  <input
                    value={row.REF_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].REF_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                    placeholder="Enter Ref. No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                {/* Work Order */}
                <td className="px-3 py-0.5">
                  <input
                    value={row.WORK_ORDER_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].WORK_ORDER_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                    placeholder="Enter Work Order No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                {/* LR Number */}
                <td className="px-3 py-0.5">
                  <input
                    value={row.LR_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].LR_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                    placeholder="Enter LR No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                {/* Transporter */}
                <td className="px-3 py-0.5">
                  <input
                    value={row.TRANSPORTER}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].TRANSPORTER = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                    placeholder="Enter Transporter"
                    className={GREEN_INPUT + " text-center"}
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

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && (
            <div className="flex items-end gap-2 max-w-md">
              <div className="w-full max-w-xs">
                <label className={LABEL}>Invoice Number</label>
                <select
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  className={GREEN_INPUT}
                >
                  <option value="">Select Invoice Number</option>

                  {invoiceF4List.map((inv) => (
                    <option key={inv} value={inv}>
                      {inv}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchInvoiceDetails}
                disabled={!lookupValue}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] text-white"
              >
                GET
              </button>
            </div>
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
                <SapField
                  key={f.key}
                  field={{
                    ...f,
                    value: headerData?.[f.key] ?? "",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Secondary table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                  <th className="px-3 py-0.5 text-center w-12">
                    <input type="checkbox" className="size-4 accent-white" />
                  </th>
                  <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
                  <th className="px-3 py-0.5 text-center">Map ID</th>
                  <th className="px-3 py-0.5 text-center">Vehicle Line</th>
                  <th className="px-3 py-0.5 text-center">Vehicle Type</th>
                  <th className="px-3 py-0.5 text-center">Truck Number</th>
                  <th className="px-3 py-0.5 text-center">LR Number</th>
                  <th className="px-3 py-0.5 text-center">AH</th>
                  <th className="px-3 py-0.5 text-center">No. of Sets</th>
                  <th className="px-3 py-0.5 text-center">Transporter</th>
                  <th className="px-3 py-0.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {itemData.map((row: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-0.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => {
                          const data = [...itemData];
                          data[index].selected = e.target.checked;
                          setItemData(data);
                        }}
                        className="size-4 accent-sky-600"
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      {index + 1}
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.ZMAPID ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.VEH_LINE ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.VEHICLE ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.TRUCK_NO ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.LR_NO ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.AH ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.NO_SETS ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.TRANSPORTER ?? ""}
                        readOnly
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 text-white">
                          <Plus className="size-3.5" />
                        </button>

                        <button className="inline-grid place-items-center size-7 rounded-md bg-rose-500 text-white">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              onClick={() => onSaveActionSap("stay")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 text-white"
            >
              <Save className="size-3.5" />
              Save
            </button>

            <button
              onClick={() => onSaveActionSap("next")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 text-white"
            >
              Save and Next
            </button>

            <button
              onClick={() => onSaveActionSap("previous")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 text-white"
            >
              Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SapField({ field }: { field: FieldSpec }) {
  const {
    label,
    value = "",
    type = "text",
    options = [],
    placeholder,
  } = field;

  return (
    <div>
      <label className={LABEL}>{label}</label>

      {type === "select" ? (
        <select
          value={value ?? ""}
          onChange={() => { }}
          className={GREEN_INPUT}
        >
          <option value="">
            {placeholder ?? "Select"}
          </option>

          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input
          type="date"
          value={value ?? ""}
          readOnly
          className={GREEN_INPUT}
        />
      ) : type === "file" ? (
        <input
          type="file"
          className={GREEN_INPUT + " py-1.5"}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          readOnly
          placeholder={placeholder ?? `Enter ${label}`}
          className={GREEN_INPUT}
        />
      )}
    </div>
  );
}
