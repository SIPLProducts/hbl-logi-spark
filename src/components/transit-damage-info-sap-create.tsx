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
  value?: string;
  type?: "text" | "select" | "date" | "file";
  options?: string[];
  placeholder?: string;
};

const BASE_FIELDS: FieldSpec[] = [
  { label: "Invoice Date", type: "date" },
  { label: "FSR Report Date", type: "date" },
  { label: "Invoice Basic Value" },
  { label: "Incident Date", type: "date" },
  { label: "Customer" },
  { label: "C/nee Name" },
  {
    label: "Damage Remarks",
    type: "select",
    options: [
      "Packing material damage",
      "Pallet damage",
      "Cells damage",
      "Cell Bank damage",
      "Can damage",
      "Accident",
      "Prohibited material loading and seized by Police",
      "Damage during unloading",
      "Material in wet condition",
      "Damage due to other materials loaded",
    ],
    placeholder: "Select Damage Remarks",
  },
  {
    label: "Settlement",
    type: "select",
    options: [
      "Claim Settlement",
      "Direct Deduction",
      "Insurance claim",
      "Repair Locally with cost",
      "Repair Locally without cost",
    ],
    placeholder: "Select Settlement",
  },
  { label: "Closing Date", type: "date" },
  { label: "Images", type: "file" },
  { label: "FSR Report", type: "file" },
  { label: "FIR Report", type: "file" },
  { label: "COF", type: "file" },
];

type TableRow = {
  REF_NO: string;
  MAPID: number | string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: number | string;
  selected: boolean;
};

const searchTypeMap: Record<string, string> = {
  Reference: "REF_NO",
  Invoice: "INV_NO",
  ODN: "ODN_NO",
  "SO Number": "SO_NO",
  "Work Order": "WORKORDER_NO",
  "LR Number": "LR_NO",
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

const labelToKey = (label: string) => {
  switch (label) {
    case "Invoice Date":
      return "INV_DATE";

    case "DC Reference Number":
      return "INV_NO";

    case "FSR Report Date":
      return "FSR_RPT_DT";

    case "Invoice Basic Value":
      return "BASIC_VALUE";

    case "Incident Date":
      return "INC_DATE";

    case "Customer":
      return "CUSTOMER";

    case "C/nee Name":
      return "CONSIGN_NAME";

    case "Damage Remarks":
      return "DAMAGE_RMK";

    case "Settlement":
      return "SETTLEMENT";

    case "Closing Date":
      return "CLOSING_DT";

    default:
      return label;
  }
};

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

export function TransitDamageInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {

  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(!isWithout);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [revealed, setRevealed] = useState(false);

  const [headerData, setHeaderData] = useState<any>({});
  const [itemData, setItemData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<TableRow[]>([]);

  // file states
  const [imagesBase64, setImagesBase64] = useState("");
  const [imagesPath, setImagesPath] = useState("");

  const [fsrReportBase64, setFsrReportBase64] = useState("");
  const [fsrReportPath, setFsrReportPath] = useState("");

  const [firReportBase64, setFirReportBase64] = useState("");
  const [firReportPath, setFirReportPath] = useState("");

  const [cofBase64, setCofBase64] = useState("");
  const [cofPath, setCofPath] = useState("");
  const [showForm, setShowForm] = useState(false);
  const showFields = isWithout || revealed;
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const handleHeaderChange = (key: string, value: any) => {
    setHeaderData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };


  const fields: FieldSpec[] = [
    {
      label: "Invoice Date",
      type: "date",
      value: headerData.INV_DATE || "",
    },
    ...(isWithout
      ? [
        {
          label: "DC Reference Number",
          value: headerData.INV_NO || lookupValue || "",
        },
      ]
      : []),
    {
      label: "FSR Report Date",
      type: "date",
      value: headerData.FSR_RPT_DT || "",
    },
    {
      label: "Invoice Basic Value",
      value: String(headerData.BASIC_VALUE || ""),
    },
    {
      label: "Incident Date",
      type: "date",
      value: headerData.INC_DATE || "",
    },
    {
      label: "Customer",
      value: headerData.CUSTOMER || "",
    },
    {
      label: "C/nee Name",
      value: headerData.CONSIGN_NAME || "",
    },
    {
      label: "Damage Remarks",
      type: "select",
      value: headerData.DAMAGE_RMK || "",
      options: [
        "Packing material damage",
        "Pallet damage",
        "Cells damage",
        "Cell Bank damage",
        "Can damage",
        "Accident",
        "Prohibited material loading and seized by Police",
        "Damage during unloading",
        "Material in wet condition",
        "Damage due to other materials loaded",
      ],
    },
    {
      label: "Settlement",
      type: "select",
      value: headerData.SETTLEMENT || "",
      options: [
        "Claim Settlement",
        "Direct Deduction",
        "Insurance claim",
        "Repair Locally with cost",
        "Repair Locally without cost",
      ],
    },
    {
      label: "Closing Date",
      type: "date",
      value: headerData.CLOSING_DT || "",
    },
    {
      label: "Images",
      type: "file",
    },
    {
      label: "FSR Report",
      type: "file",
    },
    {
      label: "FIR Report",
      type: "file",
    },
    {
      label: "COF",
      type: "file",
    },
  ];


  const onCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const checked = event.target.checked;
    const rowValue = tableData[index];

    // Update tableData
    const updatedTable = [...tableData];
    updatedTable[index].selected = checked;
    setTableData(updatedTable);

    if (checked) {
      const exists = selectedItems.some(
        (item) => item.MAPID === rowValue.MAPID
      );

      if (!exists) {
        const updatedSelectedItems = [...selectedItems, rowValue];

        setSelectedItems(updatedSelectedItems);

        console.log("Selected:", updatedSelectedItems);
      }
    } else {
      const updatedSelectedItems = selectedItems.filter(
        (item) => item.MAPID !== rowValue.MAPID
      );

      setSelectedItems(updatedSelectedItems);

      console.log("Selected:", updatedSelectedItems);
    }
  };



  const updateInvoiceListForSelectedItems = () => {
    console.log("Selected Items:", selectedItems);
  };

  const populateReferenceRows = (data: any[]) => {

    // Reset
    setInvoiceF4List([]);
    setFullReferenceData([]);

    if (data && data.length > 0) {

      setFullReferenceData(data);

      const invoiceList: string[] = [];

      const rows = data.map((d: any) => {

        // Same as Angular
        if (d.INV_NO && Array.isArray(d.INV_NO)) {

          d.INV_NO.forEach((inv: any) => {

            if (
              inv.VBELN &&
              !invoiceList.includes(inv.VBELN)
            ) {
              invoiceList.push(inv.VBELN);
            }

          });

        }

        return {
          MAPID: d.MAPID || "",
          REF_NO: d.REF_NO || d.referenceNumber || "",
          WORK_ORDER_NO: d.WORK_ORDER_NO || d.workOrderNumber || "",
          LR_NO: d.LR_NO || d.lrNumber || "",
          TRANSPORTER: d.TRANSPORTER || d.transporter || "",
          LINE_NO: d.LINE_NO || d.lineNumber || "",
          selected: false,
        };

      });

      setInvoiceF4List(invoiceList);

      setLookupValue("");

      setTableData(rows);

      console.log("🟢 Invoice F4 List:", invoiceList);

    } else {

      Swal.fire({
        icon: "info",
        title: "No Records Found",
        text: "No matching reference details were found.",
        timer: 1500,
        showConfirmButton: false,
      });

      setTableData([EMPTY_ROW()]);
    }
  };

  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "TRANSIT DAMAGE INFO",
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

  const onchangeMAPID = (
    index: number,
    selectedMapId: any
  ) => {

    console.log("Selected MAPID:", selectedMapId);

    const selectedObj = selectedItems.find(
      item => item.MAPID == selectedMapId
    );

    console.log("Selected MAPID object:", selectedObj);

    if (!selectedObj) return;

    const updatedItems = [...itemData];

    updatedItems[index] = {

      ...updatedItems[index],

      REFNO: selectedObj.REF_NO || "",

      WORK_ORDER: selectedObj.WORK_ORDER_NO || "",

      LR_NO: selectedObj.LR_NO || "",

      TRANSPORTER: selectedObj.TRANSPORTER || "",

      ZMAPID: selectedObj.MAPID || "",

      ZLINE_NO: selectedObj.LINE_NO,

    };

    setItemData(updatedItems);

    console.log("Updated items:", updatedItems);

  };


  const fetchInvoiceDetails = async () => {
    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter Invoice Number",
      });
      return;
    }

    const selectedRow = tableData.find((row) => row.selected);

    console.log("Selected Row:", selectedRow);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    const payload = {
      VBELN: lookupValue,
      ZREFNO: selectedRow.REF_NO || "",
      ZMAPID: selectedRow.MAPID || "",
    };

    console.log("Invoice Payload", payload);

    try {
      const res: any = await service.TransitDamageInfofetch(payload);

      console.log("Invoice Response", res);

      if (res?.STATUS === "False") {
        Swal.fire({
          icon: "info",
          text: res.MESSAGE,
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Invoice Details fetched successfully",
      });

      const header = res?.[0]?.HEADER || {};
      const items = res?.[0]?.ITEM || [];

      setHeaderData(header);
      setItemData(items);
      setShowForm(true);
      setIsGlobalSearch(true);
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        text: "Error fetching invoice details",
      });
    }
  };

  const handleSave = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {

    // Selected reference
    const selectedRow = tableData.find((r) => r.selected);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Invoice Number is required",
      });
      return;
    }


    const header = {
      ...headerData,

      INV_NO: lookupValue,

      REFNO: selectedRow.REF_NO,

      LINE_NO: selectedRow.LINE_NO,

      INC_DATE: headerData.INC_DATE || null,

      CLOSING_DT: headerData.CLOSING_DT || null,

      ROUTE: headerData.ROUTE || null,

      ZDIMAGES: imagesBase64,

      ZDIMG_PATH: imagesPath,

      ZFSRREP: fsrReportBase64,

      ZFSRREP_PATH: fsrReportPath,

      ZFIRREP: firReportBase64,

      ZFIRREP_PATH: firReportPath,

      ZCOF: cofBase64,

      ZCOF_PATH: cofPath,

      ZUSER: getLoggedInUser(),

      ZUSER_CH: "",
    };


    const items = itemData
      .filter((x: any) => x.selected)
      .map((row: any) => ({
        ...row,

        INV_NO: lookupValue,

        REFNO: selectedRow.REF_NO,

        ZLINE_NO: row.ZLINE_NO || selectedRow.LINE_NO,
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one item",
      });
      return;
    }

    const payload = {
      HEADER: header,
      ITEM: items,
    };

    console.log("SAVE PAYLOAD", payload);

    try {

      const res: any = await service.TransitDamageInfoSave(payload);

      if (res?.STATUS === "TRUE") {

        Swal.fire({
          icon: "success",
          text: res.MESSAGE || "Saved Successfully",
        });

        if (action === "next") {

          // navigate("/insurance-claim-tracking")

        } else if (action === "previous") {

          // navigate("/freight-billing")

        }

      } else {

        Swal.fire({
          icon: "warning",
          title: "Save Failed",
          text: res?.MESSAGE || "",
        });

      }

    } catch (err) {

      console.log(err);

      Swal.fire({
        icon: "error",
        text: "Save Failed",
      });

    }
  };


  const onSearchReference = async () => {
    // Reset
    setHeaderData({});
    setItemData([]);
    setShowForm(false);
    setRevealed(false);
    setIsGlobalSearch(true);

    if (!searchValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter a value",
      });
      return;
    }

    if (!searchType) {
      Swal.fire({
        icon: "info",
        title: "Info",
        text: "Please select a search type",
      });
      return;
    }

    const payload: any = {
      global: "TRANSIT DAMAGE INFO",
      ZUSER: getLoggedInUser(),
      data: {
        REF_NO: "",
        INV_NO: "",
        SO_NO: "",
        TRANSPORTER: "",
        LR_NO: "",
        WORKORDER_NO: "",
        SALES_PERSON: "",
        LOCATION: "",
        ODN_NO: "",
        VEHICLE_NO: "",
        FREIGHT_BILLNO: "",
        PRODUCT: "",
        ROUTE: "",
        NATURE_DAMAGE: "",
        CLAIM_STATUS: "",
      },
    };

    const apiField = searchTypeMap[searchType];

    if (apiField) {
      payload.data[apiField] = searchValue.trim();
    }

    console.log("Search Payload", payload);

    try {
      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      console.log("Search Response", res);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        Swal.fire({
          icon: "warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res?.HEADER || res.HEADER.length === 0) {
        Swal.fire({
          icon: "info",
          text: "No records found",
        });
        return;
      }

      const header = res.HEADER[0];

      const items = (res.ITEMS || []).map((item: any) => ({
        ...item,
        selected: false,
      }));

      setHeaderData(header);
      setItemData(items);
      setShowForm(true);
      setRevealed(true);

      Swal.fire({
        icon: "success",
        text: "Data fetched successfully!",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error fetching data",
      });
    }
  };


  const fetchInvoiceDetailsNonSap = async () => {
    // Validation
    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter DC Reference Number",
      });
      return;
    }

    // Get selected reference row
    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    // Payload
    const payload = {
      VBELN: lookupValue.trim(),
      ZREFNO: selectedRow.REF_NO || "",
      ZMAPID: selectedRow.MAPID || "",
    };

    console.log("Non-SAP Payload:", payload);

    try {
      const res: any = await service.TransitDamageinfofetchNonsap(payload);

      console.log("Non-SAP Response:", res);

      if (!res || res.STATUS === "False") {
        Swal.fire({
          icon: "info",
          title: "Info",
          text: res?.MESSAGE || "No Data Found",
        });
        return;
      }

      const header = res?.[0]?.HEADER || {};
      const items = res?.[0]?.ITEM || [];

      // Header
      setHeaderData({
        ...header,
        INV_NO: header.INV_NO || lookupValue,
        REFNO: selectedRow.REF_NO,
        LINE_NO: selectedRow.LINE_NO,
      });

      // Item Table
      const updatedItems = items.map((item: any) => ({
        ...item,

        selected: false,

        // Reference Details
        ZMAPID: selectedRow.MAPID,
        REFNO: selectedRow.REF_NO,
        ZLINE_NO: selectedRow.LINE_NO,

        // Display Columns (Only API values)
        VEHICLE_NO: item.TRUCK_NO ?? "",
        LR_NO: item.LR_NO ?? "",
        TRANSPORTER: item.TRANSPORTER ?? "",
        WORK_ORDER: item.WORK_ORDER ?? "",

        PRODUCT: item.PRODUCT ?? "",
        BILLNO: item.BILLNO ?? "",
        INV_NO: lookupValue,
      }));

      console.log("Updated Items:", updatedItems);

      setItemData(updatedItems);

      setShowForm(true);
      setRevealed(true);
      setIsGlobalSearch(true);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Invoice Details fetched successfully.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Non-SAP Fetch Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch Invoice Details.",
      });
    }
  };

  const handleSaveNonSap = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {

    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter DC Reference Number",
      });
      return;
    }

    const header = {
      ...headerData,

      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: selectedRow.LINE_NO,

      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",

      ZDIMAGES: imagesBase64 || "",
      ZDIMG_PATH: imagesPath || "",

      ZFSRREP: fsrReportBase64 || "",
      ZFSRREP_PATH: fsrReportPath || "",

      ZFIRREP: firReportBase64 || "",
      ZFIRREP_PATH: firReportPath || "",

      ZCOF: cofBase64 || "",
      ZCOF_PATH: cofPath || "",
    };

    const items = itemData
      .filter((item: any) => item.selected)
      .map((item: any) => ({
        ...item,

        INV_NO: lookupValue,
        REFNO: selectedRow.REF_NO,

        ZUSER: getLoggedInUser(),
        ZUSER_CH: "",

        ZLINE_NO: selectedRow.LINE_NO,
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one item",
      });
      return;
    }

    const payload = {
      HEADER: header,
      ITEM: items,
    };

    console.log("Non-SAP SAVE Payload:", payload);

    try {
      const res: any = await service.withoutsapSave(payload);

      if (res?.STATUS === true || res?.STATUS === "TRUE") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data Saved Successfully",
        });

        // reset form if required
        // resetForm();

        if (action === "next") {
          // navigate next
        } else if (action === "previous") {
          // navigate previous
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: "Save Failed",
          text: res?.MESSAGE || "",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Save Failed",
      });
    }
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
          <div className="flex items-end gap-2 max-w-md">
            <div className="w-full max-w-xs">
              <label className={LABEL}>
                {isWithout ? "DC Reference Number" : "Invoice Number"}
              </label>

              <input
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (isWithout) {
                      fetchInvoiceDetailsNonSap();
                    } else {
                      fetchInvoiceDetails();
                      setRevealed(true);
                    }
                  }
                }}
                className={GREEN_INPUT}
                placeholder={
                  isWithout
                    ? "Enter DC Reference Number"
                    : "Enter Invoice Number"
                }
              />
            </div>

            {!isWithout && (
              <button
                onClick={() => {
                  fetchInvoiceDetails();
                  setRevealed(true);
                }}
                disabled={!lookupValue.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            )}
          </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearchReference();
                }
              }}
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

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && (
        <>

          {showForm && Object.keys(headerData).length > 0 && (
            <div className="max-h-[500px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant">
              <div className="p-2 font-semibold">Header Details</div>

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Ref No", "Line No", "Invoice No", "ODN No", "SO No",
                      "Invoice Date", "FSR Report Date", "Base Value", "Incident Date",
                      "Customer", "C/nee Name", "Damage Remarks", "Settlement",
                      "Closing Date", "Images", "FSR Report", "FIR Report", "COF",
                      "Sales Person", "Location", "Route", "Plant", "Division",
                      "Created Date", "Vehicle Type", "Action"
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  <tr className="bg-surface hover:bg-muted/50">
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZREFNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZLINE_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZINV_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZODN_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZSONO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZINV_DATE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZFSR_RPT_DT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZBASIC_VALUE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZINC_DATE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZCUSTOMER}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZCONSIGN_NAME}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZDAMAGE_RMK}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZSETTLEMENT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZCLOSING_DT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZDIMAGES || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZFSRREP || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZFIRREP || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZCOF || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZSALE_PERSON}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZLOCATION}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZROUTE}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZPLANT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZDIVISION}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZCREATED_DT}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{headerData.ZVEH_TYPE}</td>

                    <td className="px-2 py-0.5 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <svg
                            className="size-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        <button
                          className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <svg
                            className="size-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {showForm && itemData.length > 0 && (
            <div className="max-h-[400px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant mt-3">
              <div className="p-2 font-semibold">Line Items</div>

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Map ID",
                      "Ref No",
                      "Line No",
                      "Invoice No",
                      "Vehicle No",
                      "Bill No",
                      "Product",
                      "Work Order",
                      "LR No",
                      "Transporter",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  {itemData.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-surface hover:bg-muted/50"
                          : "bg-surface-2/40 hover:bg-muted/50"
                      }
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZMAPID}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZINV_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZTRUCK_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZBILLNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZPRODUCT}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZWORK_ORDER}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLRNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZTRANSPORTER}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Field grid */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              {fields.map((f) => (
                <SapField
                  key={f.label}
                  field={f}
                  onChange={handleHeaderChange}
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
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;

                        const updated = itemData.map((item) => ({
                          ...item,
                          selected: checked,
                        }));

                        setItemData(updated);
                      }}
                      className="size-4 accent-sky-600"
                    />
                  </th>
                  <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
                  <th className="px-3 py-0.5 text-center">Map ID</th>
                  <th className="px-3 py-0.5 text-center">Vehicle Number</th>
                  <th className="px-3 py-0.5 text-center">LR Number</th>
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
                        onChange={(e) => {
                          const checked = e.target.checked;

                          const updated = itemData.map((item) => ({
                            ...item,
                            selected: checked,
                          }));

                          setItemData(updated);
                        }}
                        className="size-4 accent-sky-600"
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      {index + 1}
                    </td>

                    <td className="px-3 py-0.5">
                      <select
                        value={row.ZMAPID || ""}
                        onChange={(e) => onchangeMAPID(index, e.target.value)}
                        className={GREEN_INPUT}
                      >
                        <option value="">Select</option>

                        {selectedItems.map((item) => (
                          <option key={item.MAPID} value={item.MAPID}>
                            {item.MAPID}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.VEHICLE_NO || ""}
                        className={GREEN_INPUT + " text-center"}
                        readOnly
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.LR_NO || ""}
                        className={GREEN_INPUT + " text-center"}
                        readOnly
                      />
                    </td>

                    <td className="px-3 py-0.5">
                      <input
                        value={row.TRANSPORTER || ""}
                        className={GREEN_INPUT + " text-center"}
                        readOnly
                      />
                    </td>

                    <td className="px-3 py-0.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
                          <Plus className="size-3.5" />
                        </button>

                        <button className="inline-grid place-items-center size-7 rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow-sm">
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
              onClick={() =>
                isWithout
                  ? handleSaveNonSap("stay")
                  : handleSave("stay")
              }
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
            >
              <Save className="size-3.5" />
              Save
            </button>
            <button
              onClick={() =>
                isWithout
                  ? handleSaveNonSap("next")
                  : handleSave("next")
              }
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm"
            >
              Save and Next
              <ChevronRight className="size-3.5" />
            </button>
            <button
              onClick={() =>
                isWithout
                  ? handleSaveNonSap("previous")
                  : handleSave("previous")
              }
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm"
            >
              <ChevronLeft className="size-3.5" />
              Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function SapField({
  field,
  onChange,
}: {
  field: FieldSpec;
  onChange: (key: string, value: any) => void;
}) {
  const {
    label,
    value = "",
    type = "text",
    options = [],
    placeholder,
  } = field;

  const key = labelToKey(label);

  return (
    <div>
      <label className={LABEL}>{label}</label>

      {type === "select" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(key, e.target.value)}
          className={GREEN_INPUT}
        >
          <option value="">
            {placeholder || "Select"}
          </option>

          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(key, e.target.value)}
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
          value={value || ""}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder || `Enter ${label}`}
          className={GREEN_INPUT}
        />
      )}
    </div>
  );
}
