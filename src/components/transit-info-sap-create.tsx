import { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  Save,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X
} from "lucide-react";
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

type FieldSpec = {
  label: string;
  value?: string;
  type?: "text" | "select" | "date" | "datetime" | "file";
  options?: string[];
  placeholder?: string;
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
const FIELDS: FieldSpec[] = [
  { label: "Invoice Number" },
  { label: "Physical arrived at destination date", type: "datetime" },
  { label: "Unloading date and time", type: "datetime" },
  { label: "POD scan received date", type: "date" },
  {
    label: "SIT/SALE",
    type: "select",
    options: ["SIT", "SALE"],
  },
  { label: "POD Scan", type: "file" },
];

export function TransitInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {

  const isWithout = mode === "without";
  const isSap = !isWithout;

  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [physicalArrivedDate, setPhysicalArrivedDate] = useState("");
  const [unloadingDate, setUnloadingDate] = useState("");
  const [podScanDate, setPodScanDate] = useState("");
  const [sitSale, setSitSale] = useState("");
  const [headerData, setHeaderData] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [referenceItems, setReferenceItems] = useState([
    {
      referenceNumber: "",
      workOrderNumber: "",
      lrNumber: "",
      transporter: "",
      lineNumber: "",
    },
  ]);

  useEffect(() => {
    // Reset search fields
    setSearchType("");
    setSearchValue("");

    // Reset form fields
    setInvoiceNumber("");
    setPhysicalArrivedDate("");
    setUnloadingDate("");
    setPodScanDate("");
    setSitSale("");

    // Reset table data
    setHeaderData([]);
    setItemsList([]);
    setShowTable(false);
    setTableData([EMPTY_ROW()]);

    // Reset reference items
    setReferenceItems([
      {
        referenceNumber: "",
        workOrderNumber: "",
        lrNumber: "",
        transporter: "",
        lineNumber: "",
      },
    ]);
  }, [mode]);
  const handleInputChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...referenceItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setReferenceItems(updated);
  };
  const populateReferenceRows = (data: any[]) => {
    if (Array.isArray(data)) {
      const rows = data.map((item) => ({
        referenceNumber: item.REF_NO?.toString() || "",
        workOrderNumber: item.WORK_ORDER_NO || "",
        lrNumber: item.LR_NO || "",
        transporter: item.TRANSPORTER || "",
        lineNumber: item.LINE_NO?.toString() || "",
      }));

      setReferenceItems(rows);
    }
  };

  useEffect(() => {
    if (unloadingDate || podScanDate) {
      setSitSale("SALE");
    } else if (physicalArrivedDate) {
      setSitSale("SIT");
    } else {
      setSitSale("");
    }
  }, [physicalArrivedDate, unloadingDate, podScanDate]);

  const resetAll = () => {
    setSearchType("");
    setSearchValue("");

    setInvoiceNumber("");
    setPhysicalArrivedDate("");
    setUnloadingDate("");
    setPodScanDate("");
    setSitSale("");

    setHeaderData([]);
    setItemsList([]);
    setShowTable(false);

    setTableData([EMPTY_ROW()]);

    setReferenceItems([
      {
        referenceNumber: "",
        workOrderNumber: "",
        lrNumber: "",
        transporter: "",
        lineNumber: "",
      },
    ]);
  };

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

  const saveTransitInfo = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {
    try {
      const HEAD = {
        REFNO: tableData[0]?.REF_NO || "",
        INV_NO: invoiceNumber,

        PY_ARRIVED_DEST: physicalArrivedDate,
        UNLOADING_DT: unloadingDate,
        POD_SCAN: podScanDate,

        SIT_SALE: sitSale,
      };

      console.log("REFERENCE ITEMS BEFORE SAVE:", referenceItems);
      const ITEM = tableData.map((item, idx) => ({
        REFNO: item.REF_NO,
        INV_NO: invoiceNumber,
        POSNR: (idx + 1) * 10,
        VEH_LINE: idx + 1,
        VEH_NUM: "",
        LRNO: item.LR_NO,
        WORK_ORDER: item.WORK_ORDER_NO,
        TRANSPORTER: item.TRANSPORTER,
        LINE_NO: item.LINE_NO,
      }));

      const payload = {
        HEAD,
        ITEM,
      };

      console.log("TRANSIT PAYLOAD", payload);

      let response: any;

      if (isSap) {
        // With SAP
        response = await service.TransitInfoSave(payload);
      } else {
        // Without SAP
        response = await service.TransitInfoNonSap(payload);
      }

      console.log(response);

      if (
        response?.STATUS?.toUpperCase() === "TRUE" ||
        response?.NUMBER === "200"
      ) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data saved successfully",
          confirmButtonText: "OK",
        });

        // Clear all fields after clicking OK
        resetAll();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.MESSAGE || "Save Failed",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error while saving",
        confirmButtonText: "OK",
      });
    }
  };

  const onSearchReference = async () => {
    console.log("SEARCH BUTTON CLICKED");

    // Reset old data
    setHeaderData([]);
    setItemsList([]);
    setShowTable(false);

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
        icon: "warning",
        title: "Warning",
        text: "Please select a search type",
      });
      return;
    }

    const payload = {
      global: "TRANSIT INFO",
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

    const typeMap: Record<string, keyof typeof payload.data> = {
      Reference: "ref_no",
      Invoice: "inv_no",
      ODN: "odn_no",
      "SO Number": "so_no",
      "Work Order": "workorder_no",
      "LR Number": "lr_no",
    };

    const selectedField = typeMap[searchType];

    if (selectedField) {
      payload.data[selectedField] = searchValue.trim();
    }

    try {

      let res: any;

      if (isSap) {
        // WITH SAP
        res = await service.global_Fields_SearchOption(payload);
      } else {
        // WITHOUT SAP
        res = await service.global_Fields_SearchOption_WithoutSap(payload);
      }

      console.log("SEARCH RESPONSE", res);

      if (
        res?.NUMBER === "100" &&
        res?.STATUS === "FALSE"
      ) {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res?.HEADER || res.HEADER.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
        });
        return;
      }

      setHeaderData(res.HEADER);
      setItemsList(res.ITEMS || []);
      setShowTable(true);

      const firstHeader = res.HEADER[0];

      setInvoiceNumber(firstHeader.ZINV_NO || "");
      setPhysicalArrivedDate(firstHeader.ZPY_ARRIVED_DEST || "");
      setUnloadingDate(firstHeader.ZUNLOADING_DT || "");
      setPodScanDate(firstHeader.ZPOD_SCAN || "");
      setSitSale(firstHeader.ZSIT_SALE || "");

      const rows = (res.ITEMS || []).map((item: any) => ({
        referenceNumber: item.ZREFNO || "",
        workOrderNumber: item.ZWORK_ORDER || "",
        lrNumber: item.ZLRNO || "",
        transporter: item.ZTRANSPORTER || "",
        lineNumber: item.ZLINE_NO || "",
      }));

      setReferenceItems(rows);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data fetched successfully",
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

  const editSearchRow = (type: "header" | "item", index: number) => {
    if (type === "header") {
      const updated = [...headerData];
      updated[index].isEdit = !updated[index].isEdit;
      setHeaderData(updated);
    } else {
      const updated = [...itemsList];
      updated[index].isEdit = !updated[index].isEdit;
      setItemsList(updated);
    }
  };
  const sapType = "SAP";

  const updateSearchRow = async (
    headerRow: any,
    itemRows: any[]
  ) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this transit record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    if (!headerRow.ZREFNO) {
      Swal.fire("Error", "Missing mandatory ZREFNO in header", "error");
      return;
    }

    const invalidItems = itemRows.filter(
      (item) => !item.ZREFNO || !item.ZLINE_NO
    );

    if (invalidItems.length > 0) {
      Swal.fire(
        "Error",
        "Missing mandatory keys in items (ZREFNO/ZLINE_NO)",
        "error"
      );
      return;
    }

    const headerPayload = {
      ZREFNO: headerRow.ZREFNO,
      ZINV_NO: headerRow.ZINV_NO || "",
      ZODN_NO: headerRow.ZODN_NO || "",
      ZSONO: headerRow.ZSONO || "",
      ZSALE_PERSON: headerRow.ZSALE_PERSON || "",
      ZPY_ARRIVED_DEST: headerRow.ZPY_ARRIVED_DEST || "",
      ZUNLOADING_DT: headerRow.ZUNLOADING_DT || "",
      ZSIT_SALE: headerRow.ZSIT_SALE || "",
      ZPOD_FNAME: headerRow.ZPOD_FNAME || "",
      ZLOCATION: headerRow.ZLOCATION || "",
      ZCREATED_DT: headerRow.ZCREATED_DT || "",
      ZPLANT: headerRow.ZPLANT || "",
      ZDIVISION: headerRow.ZDIVISION || "",
      ZVEH_TYPE: headerRow.ZVEH_TYPE || "",
      ZUSER: headerRow.ZUSER || "",
      ZUSER_CH: getLoggedInUser,
    };

    const itemPayload = itemRows.map((item: any) => ({
      ZREFNO: String(item.ZREFNO),
      ZLINE_NO: String(item.ZLINE_NO),
      ZINV_NO: item.ZINV_NO || "",
      POSNR: item.POSNR || "",
      ZVEH_LINE: item.ZVEH_LINE || "",
      ZVEH_NUM: item.ZVEH_NUM || "",
      ZLRNO: item.ZLRNO || "",
      ZWORK_ORDER: item.ZWORK_ORDER || "",
      ZTRANSPORTER: item.ZTRANSPORTER || "",
      ZUSER: item.ZUSER || "",
      ZUSER_CH: getLoggedInUser,
    }));

    const payload = {
      ZPOD_FNAME: "",
      ZPATH: "",
      HEADER: headerPayload,
      ITEM: itemPayload,
    };

    console.log("TRANSIT UPDATE PAYLOAD", payload);

    try {
      const response =
        sapType === "SAP"
          ? await service.TransitInfoChangeWithSap(payload)
          : await service.TransitInfoChangeWithoutSap(payload);

      if (
        response.STATUS === "TRUE" ||
        response.NUMBER === "200"
      ) {
        Swal.fire(
          "Success",
          response.MESSAGE || "Transit data updated successfully",
          "success"
        );

        setHeaderData((prev) =>
          prev.map((h) => ({
            ...h,
            isEdit: false,
          }))
        );

        setItemsList((prev) =>
          prev.map((i) => ({
            ...i,
            isEdit: false,
          }))
        );

        onSearchReference();
      } else {
        Swal.fire(
          "Error",
          response.MESSAGE || "Update failed",
          "error"
        );
      }
    } catch (err) {
      Swal.fire("Error", "Internal Server Error", "error");
    }
  };

  const cancelSearchEdit = (type: "header" | "item", index: number) => {
    if (type === "header") {
      const updated = [...headerData];
      updated[index].isEdit = false;
      setHeaderData(updated);
    } else {
      const updated = [...itemsList];
      updated[index].isEdit = false;
      setItemsList(updated);
    }
  };


  const deleteRow = (type: "header" | "item", index: number) => {
    Swal.fire({
      title: "Delete?",
      text: "Are you sure you want to delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        if (type === "header") {
          setHeaderData(headerData.filter((_, i) => i !== index));
        } else {
          setItemsList(itemsList.filter((_, i) => i !== index));
        }
      }
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
                  <input type="checkbox" />
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
              type="button"
              onClick={() => {
                console.log("BUTTON CLICK");
                onSearchReference();
              }}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Field grid */}
      {searchType === "" && (
        <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">

            <SapField
              field={FIELDS[0]}
              value={invoiceNumber}
              onChange={setInvoiceNumber}
            />

            <SapField
              field={FIELDS[1]}
              value={physicalArrivedDate}
              onChange={setPhysicalArrivedDate}
            />

            <SapField
              field={FIELDS[2]}
              value={unloadingDate}
              onChange={setUnloadingDate}
            />

            <SapField
              field={FIELDS[3]}
              value={podScanDate}
              onChange={setPodScanDate}
            />

            <SapField
              field={FIELDS[4]}
              value={sitSale}
              onChange={setSitSale}
            />

            <SapField field={FIELDS[5]} />

          </div>
        </div>
      )}

      {showTable && headerData.length > 0 && (
        <div className="mt-4 rounded-xl border border-hairline bg-surface shadow-elegant overflow-hidden">
          <div className="bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold">
            Header Details
          </div>

          <div className="overflow-x-auto w-full">
            <table className="min-w-[1800px] text-[12px] border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-2 py-2">Ref No</th>
                  <th className="border px-2 py-2">Invoice No</th>
                  <th className="border px-2 py-2">ODN No</th>
                  <th className="border px-2 py-2">SO No</th>
                  <th className="border px-2 py-2">Sales Person</th>
                  <th className="border px-2 py-2">Physical Arrived</th>
                  <th className="border px-2 py-2">Unloading DT</th>
                  <th className="border px-2 py-2">POD Scan</th>
                  <th className="border px-2 py-2">SIT/SALE</th>
                  <th className="border px-2 py-2">Location</th>
                  <th className="border px-2 py-2">Plant</th>
                  <th className="border px-2 py-2">Division</th>
                  <th className="border px-2 py-2">Created Date</th>
                  <th className="border px-2 py-2">Vehicle Type</th>
                  <th className="border px-2 py-2">POD Name</th>
                  <th className="border px-2 py-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {headerData.map((header: any, index: number) => (
                  <tr key={index}>

                    {/* Ref No */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZREFNO || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZREFNO = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-28"
                        />
                      ) : (
                        header.ZREFNO
                      )}
                    </td>

                    {/* Invoice No */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZINV_NO || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZINV_NO = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-32"
                        />
                      ) : (
                        header.ZINV_NO
                      )}
                    </td>

                    {/* ODN No */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZODN_NO || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZODN_NO = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-32"
                        />
                      ) : (
                        header.ZODN_NO
                      )}
                    </td>

                    {/* SO No */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZSONO || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZSONO = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-32"
                        />
                      ) : (
                        header.ZSONO
                      )}
                    </td>

                    {/* Sales Person */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZSALE_PERSON || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZSALE_PERSON = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-36"
                        />
                      ) : (
                        header.ZSALE_PERSON
                      )}
                    </td>

                    {/* Physical Arrived */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="datetime-local"
                          value={header.ZPY_ARRIVED_DEST || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZPY_ARRIVED_DEST = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        header.ZPY_ARRIVED_DEST
                      )}
                    </td>

                    {/* Unloading DT */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="datetime-local"
                          value={header.ZUNLOADING_DT || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZUNLOADING_DT = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        header.ZUNLOADING_DT
                      )}
                    </td>

                    {/* POD Scan */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="datetime-local"
                          value={header.ZPOD_SCAN || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZPOD_SCAN = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        header.ZPOD_SCAN
                      )}
                    </td>

                    {/* SIT / SALE */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZSIT_SALE || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZSIT_SALE = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-24"
                        />
                      ) : (
                        header.ZSIT_SALE
                      )}
                    </td>

                    {/* Location */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZLOCATION || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZLOCATION = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-28"
                        />
                      ) : (
                        header.ZLOCATION
                      )}
                    </td>

                    {/* Plant */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZPLANT || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZPLANT = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-24"
                        />
                      ) : (
                        header.ZPLANT
                      )}
                    </td>

                    {/* Division */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZDIVISION || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZDIVISION = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-24"
                        />
                      ) : (
                        header.ZDIVISION
                      )}
                    </td>

                    {/* Created Date */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="date"
                          value={header.ZCREATED_DT || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZCREATED_DT = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        header.ZCREATED_DT
                      )}
                    </td>

                    {/* Vehicle Type */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="text"
                          value={header.ZVEH_TYPE || ""}
                          onChange={(e) => {
                            const data = [...headerData];
                            data[index].ZVEH_TYPE = e.target.value;
                            setHeaderData(data);
                          }}
                          className="border rounded px-2 py-1 w-24"
                        />
                      ) : (
                        header.ZVEH_TYPE
                      )}
                    </td>

                    {/* POD Name */}
                    <td>
                      {header.isEdit ? (
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          //  onChange={handleFileChange}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        header.ZPODNAME || "-"
                      )}
                    </td>

                    {/* Action */}
                    <td className="border px-2 py-2 text-center">
                      {!header.isEdit ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editSearchRow("header", index)}
                            className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteRow("header", index)}
                            className="rounded bg-red-600 p-1 text-white hover:bg-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => updateSearchRow(header, itemsList)}
                            className="rounded bg-green-600 p-1 text-white hover:bg-green-700"
                          >
                            <Check size={15} />
                          </button>

                          <button
                            onClick={() => cancelSearchEdit("header", index)}
                            className="rounded bg-gray-600 p-1 text-white hover:bg-gray-700"
                          >
                            <X size={15} />
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

      {showTable && itemsList.length > 0 && (
        <div className="mt-4 rounded-xl border border-hairline bg-surface shadow-elegant overflow-hidden">
          <div className="bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold">
            Line Items
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-2 py-2">Ref No</th>
                  <th className="border px-2 py-2">Line No</th>
                  <th className="border px-2 py-2">Invoice No</th>
                  <th className="border px-2 py-2">Vehicle No</th>
                  <th className="border px-2 py-2">Work Order</th>
                  <th className="border px-2 py-2">LR No</th>
                  <th className="border px-2 py-2">Transporter</th>
                  <th className="border px-2 py-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {itemsList.map((item: any, index: number) => (
                  <tr key={index} className={item.isEdit ? "bg-blue-50" : ""}>

                    {/* Ref No */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZREFNO || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZREFNO = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-28 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZREFNO
                      )}
                    </td>

                    {/* Line No (Not Editable) */}
                    <td className="border px-2 py-2 text-center">
                      {item.ZLINE_NO}
                    </td>

                    {/* Invoice No */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZINV_NO || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZINV_NO = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-32 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZINV_NO
                      )}
                    </td>

                    {/* Vehicle No */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZVEH_NUM || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZVEH_NUM = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-32 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZVEH_NUM
                      )}
                    </td>

                    {/* Vehicle Line */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="number"
                          value={item.ZVEH_LINE || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZVEH_LINE = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-24 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZVEH_LINE
                      )}
                    </td>

                    {/* Work Order */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZWORK_ORDER || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZWORK_ORDER = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-32 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZWORK_ORDER
                      )}
                    </td>

                    {/* LR No */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZLRNO || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZLRNO = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-32 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZLRNO
                      )}
                    </td>

                    {/* Transporter */}
                    <td className="border px-2 py-2">
                      {item.isEdit ? (
                        <input
                          type="text"
                          value={item.ZTRANSPORTER || ""}
                          onChange={(e) => {
                            const data = [...itemsList];
                            data[index].ZTRANSPORTER = e.target.value;
                            setItemsList(data);
                          }}
                          className="w-40 rounded border px-2 py-1"
                        />
                      ) : (
                        item.ZTRANSPORTER
                      )}
                    </td>

                    {/* Action */}
                    <td className="border px-2 py-2 text-center">
                      {!item.isEdit ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editSearchRow("item", index)}
                            className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteRow("item", index)}
                            className="rounded bg-red-600 p-1 text-white hover:bg-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => updateSearchRow(headerData[0], itemsList)}
                            className="rounded bg-green-600 p-1 text-white hover:bg-green-700"
                          >
                            <Check size={15} />
                          </button>

                          <button
                            onClick={() => cancelSearchEdit("item", index)}
                            className="rounded bg-gray-600 p-1 text-white hover:bg-gray-700"
                          >
                            <X size={15} />
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

      {/* Footer action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {/* <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
          <Save className="size-3.5" /> Save
        </button> */}
        <button
          onClick={() => saveTransitInfo("stay")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
        >
          <Save className="size-3.5" /> Save
        </button>
        <button
          onClick={() => saveTransitInfo("next")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
        >
          Save and Next
        </button>

        <button
          onClick={() => saveTransitInfo("previous")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
        >
          Save and Previous
        </button>
      </div>
    </div>
  );
}

function SapField({
  field,
  value = "",
  onChange,
}: {
  field: FieldSpec;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const {
    label,
    type = "text",
    options,
    placeholder,
  } = field;

  return (
    <div>
      <label className={LABEL}>{label}</label>

      {type === "datetime" ? (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={GREEN_INPUT}
        />
      ) : type === "date" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={GREEN_INPUT}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={GREEN_INPUT}
        >
          <option value="">Select</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "file" ? (
        <input
          type="file"
          className={GREEN_INPUT + " py-1.5"}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder ?? `Enter ${label}`}
          className={GREEN_INPUT}
        />
      )}
    </div>
  );
}