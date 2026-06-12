import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X, Calendar } from "lucide-react";

const GREEN_INPUT =
  "h-9 w-full rounded-md bg-white dark:bg-surface border border-emerald-400/70 px-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-300 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30";
const LABEL = "block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

const MAP_IDS = ["101", "102", "200"];
const TRUCK_TYPES = ["Open Body", "Container", "Trailer", "Mini Truck"];
const WEEKS = ["Week1", "Week2", "Week3", "Week4", "Week5"];

type LoadRow = {
  id: number;
  checked: boolean;
  mapId: string;
  truckType: string;
  passingWeight: string;
  actualLoad: string;
  loadingFactorWeight: string;
  actualVolume: string;
  loadingFactorVolume: string;
  week: string;
  ewayBillNo: string;
  ewayBillExpiry: string;
};

const newRow = (id: number): LoadRow => ({
  id,
  checked: false,
  mapId: "101",
  truckType: "",
  passingWeight: "",
  actualLoad: "",
  loadingFactorWeight: "",
  actualVolume: "",
  loadingFactorVolume: "",
  week: "Week3",
  ewayBillNo: "",
  ewayBillExpiry: "",
});

export function InvoiceLoadDetailsSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [dcRef, setDcRef] = useState("");
  const [rows, setRows] = useState<LoadRow[]>([newRow(1)]);
  const [nextId, setNextId] = useState(2);

  const showFields = isWithout || revealed;

  const addRow = () => {
    setRows((prev) => [...prev, newRow(nextId)]);
    setNextId((n) => n + 1);
  };
  const removeRow = (id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };
  const updateRow = (id: number, patch: Partial<LoadRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-4">
      {/* Status chips */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[12px] font-semibold border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" /> Pending: {isWithout ? 2 : 1}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Completed: 0
        </span>
      </div>

      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
              <th className="px-3 py-2.5 text-center w-16">Select</th>
              <th className="px-3 py-2.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-2.5 text-center">Map ID</th>
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
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Map ID"
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Ref. No."
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-2">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input
                  defaultValue={isWithout ? "" : "1234"}
                  placeholder="Enter LR No."
                  className={GREEN_INPUT + " text-center"}
                />
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

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant">
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
                className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </>
          )}
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-[12.5px] outline-none focus:border-accent"
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
              className="h-9 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12.5px] outline-none focus:border-accent"
            />
            <button className="h-9 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
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
          {/* Load details table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] min-w-[1400px]">
                <thead>
                  <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
                    <th className="px-2 py-2.5 text-center w-10">
                      <input type="checkbox" className="size-4 accent-white" />
                    </th>
                    <th className="px-2 py-2.5 text-center w-14">Sl.No</th>
                    <th className="px-2 py-2.5 text-center">Map ID</th>
                    <th className="px-2 py-2.5 text-center">Truck Type</th>
                    <th className="px-2 py-2.5 text-center">
                      Passing Weight
                      <br />
                      (Tons)
                    </th>
                    <th className="px-2 py-2.5 text-center">
                      Actual Load
                      <br />
                      (Tons)
                    </th>
                    <th className="px-2 py-2.5 text-center">
                      Loading factor%
                      <br />
                      (w.r.t weight)
                    </th>
                    <th className="px-2 py-2.5 text-center">Actual Volume Occupied</th>
                    <th className="px-2 py-2.5 text-center">Loading Factor w.r.t Volume</th>
                    <th className="px-2 py-2.5 text-center">Week Wise Shipment Flow</th>
                    <th className="px-2 py-2.5 text-center">Eway Bill Number</th>
                    <th className="px-2 py-2.5 text-center">Eway Bill Expiry Date</th>
                    <th className="px-2 py-2.5 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={(e) => updateRow(row.id, { checked: e.target.checked })}
                          className="size-4 accent-sky-600"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">{idx + 1}</td>
                      <td className="px-2 py-2">
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
                      <td className="px-2 py-2">
                        <select
                          value={row.truckType}
                          onChange={(e) => updateRow(row.id, { truckType: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="">-- Select Vehicle Type</option>
                          {TRUCK_TYPES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={row.passingWeight}
                          onChange={(e) => updateRow(row.id, { passingWeight: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={row.actualLoad}
                          onChange={(e) => updateRow(row.id, { actualLoad: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.loadingFactorWeight}
                          onChange={(e) => updateRow(row.id, { loadingFactorWeight: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.actualVolume}
                          onChange={(e) => updateRow(row.id, { actualVolume: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.loadingFactorVolume}
                          onChange={(e) => updateRow(row.id, { loadingFactorVolume: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.week}
                          onChange={(e) => updateRow(row.id, { week: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          {WEEKS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.ewayBillNo}
                          onChange={(e) => updateRow(row.id, { ewayBillNo: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="relative">
                          <input
                            type="date"
                            value={row.ewayBillExpiry}
                            onChange={(e) => updateRow(row.id, { ewayBillExpiry: e.target.value })}
                            className={GREEN_INPUT + " pr-7"}
                          />
                          <Calendar className="size-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-2 py-2">
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
            <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
              <Save className="size-3.5" /> Save
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm">
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm">
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}
