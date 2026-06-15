import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];
const MAP_IDS: string[] = [];
const SHIPMENT_TYPES: string[] = [];
const TRANSPORTER_TYPES: string[] = [];
const VEHICLE_TYPES: string[] = [];

type VRow = {
  id: number;
  checked: boolean;
  mapId: string;
  shipmentType: string;
  transporterType: string;
  lrNo: string;
  vehicleType: string;
  passingWeight: string;
  volume: string;
  vehicleNumber: string;
  noOfVehicles: string;
  driverName: string;
  driverMobile: string;
  salesEmail: string;
  customerEmail: string;
  gpsLocation: string;
};

const newRow = (id: number): VRow => ({
  id,
  checked: false,
  mapId: "101",
  shipmentType: "",
  transporterType: "",
  lrNo: "",
  vehicleType: "",
  passingWeight: "",
  volume: "",
  vehicleNumber: "",
  noOfVehicles: "",
  driverName: "",
  driverMobile: "",
  salesEmail: "",
  customerEmail: "",
  gpsLocation: "",
});

export function VehicleInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [dcRef, setDcRef] = useState("");
  const [rows, setRows] = useState<VRow[]>([newRow(1)]);
  const [nextId, setNextId] = useState(2);

  const showFields = isWithout || revealed;

  const addRow = () => {
    setRows((prev) => [...prev, newRow(nextId)]);
    setNextId((n) => n + 1);
  };
  const removeRow = (id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };
  const updateRow = (id: number, patch: Partial<VRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
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
              <th className="px-3 py-0.5 text-center">Map ID</th>
              <th className="px-3 py-0.5 text-center">Reference Number</th>
              <th className="px-3 py-0.5 text-center">Work Order Number</th>
              <th className="px-3 py-0.5 text-center">LR Number</th>
              <th className="px-3 py-0.5 text-center">Transporter</th>
              <th className="px-3 py-0.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-0.5 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-0.5 text-center">1</td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Map ID"
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Ref. No."
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter LR No."
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lookup bar */}
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

          {isWithout && (
            <div className="w-full">
              <label className={LABEL}>DC Reference Number</label>
              <input
                value={dcRef}
                onChange={(e) => setDcRef(e.target.value)}
                placeholder="Enter DC Reference Number"
                className={GREEN_INPUT}
              />
              {!dcRef.trim() && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">DC Reference Number is required</p>
              )}
            </div>
          )}
        </div>
      </div>

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && (
        <>
          {/* Vehicle details table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] min-w-[1800px]">
                <thead>
                  <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                    <th className="px-2 py-1.5 text-center w-10">
                      <input type="checkbox" className="size-4 accent-white" />
                    </th>
                    <th className="px-2 py-1.5 text-center w-14">Sl.No</th>
                    <th className="px-2 py-1.5 text-center">Map ID</th>
                    <th className="px-2 py-1.5 text-center">Type of Shipment</th>
                    <th className="px-2 py-1.5 text-center">Type of transporter</th>
                    <th className="px-2 py-1.5 text-center">LR No</th>
                    <th className="px-2 py-1.5 text-center">Type of Vehicle</th>
                    <th className="px-2 py-1.5 text-center">
                      Passing Weight
                      <br />
                      (Tons)
                    </th>
                    <th className="px-2 py-1.5 text-center">Volume of Truck</th>
                    <th className="px-2 py-1.5 text-center">Vehicle Number</th>
                    <th className="px-2 py-1.5 text-center">No of Vehicles</th>
                    <th className="px-2 py-1.5 text-center">Driver Name</th>
                    <th className="px-2 py-1.5 text-center">Driver Mobile No</th>
                    <th className="px-2 py-1.5 text-center">salesperson E-mail ID</th>
                    <th className="px-2 py-1.5 text-center">Customer e-mail ID</th>
                    <th className="px-2 py-1.5 text-center">GPS live location</th>
                    <th className="px-2 py-1.5 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={(e) => updateRow(row.id, { checked: e.target.checked })}
                          className="size-4 accent-sky-600"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">{idx + 1}</td>
                      <td className="px-2 py-1">
                        <select
                          value={row.mapId}
                          onChange={(e) => updateRow(row.id, { mapId: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {MAP_IDS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.shipmentType}
                          onChange={(e) => updateRow(row.id, { shipmentType: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="">Select</option>
                          {SHIPMENT_TYPES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.transporterType}
                          onChange={(e) => updateRow(row.id, { transporterType: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="">Select</option>
                          {TRANSPORTER_TYPES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.lrNo}
                          onChange={(e) => updateRow(row.id, { lrNo: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.vehicleType}
                          onChange={(e) => updateRow(row.id, { vehicleType: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="">Select</option>
                          {VEHICLE_TYPES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row.passingWeight}
                          onChange={(e) => updateRow(row.id, { passingWeight: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.volume}
                          onChange={(e) => updateRow(row.id, { volume: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.vehicleNumber}
                          onChange={(e) => updateRow(row.id, { vehicleNumber: e.target.value })}
                          placeholder="Enter Vehicle Number"
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={row.noOfVehicles}
                          onChange={(e) => updateRow(row.id, { noOfVehicles: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.driverName}
                          onChange={(e) => updateRow(row.id, { driverName: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.driverMobile}
                          onChange={(e) => updateRow(row.id, { driverMobile: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="email"
                          value={row.salesEmail}
                          onChange={(e) => updateRow(row.id, { salesEmail: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="email"
                          value={row.customerEmail}
                          onChange={(e) => updateRow(row.id, { customerEmail: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={row.gpsLocation}
                          onChange={(e) => updateRow(row.id, { gpsLocation: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={addRow}
                            aria-label="Add row"
                            className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            aria-label="Delete row"
                            className="inline-grid place-items-center size-7 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
