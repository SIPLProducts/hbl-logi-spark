import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

const INCOTERMS = ["FOR", "FOB", "CIF", "EXW", "DAP"];
const INSURANCE_SCOPE = ["Buyer", "Supplier"];
const MAP_IDS = ["101", "102", "200"];
const PRODUCTS = ["OPTIMUZ SMF BATTERY", "POWER BACKUP UPS", "DEFENCE BATTERY"];
const MATERIAL_TYPES = ["Finished Goods", "Raw Material", "Semi-Finished"];
const BATTERY_CONDITIONS = ["New", "Refurbished", "Used"];

export function ShipmentDetailsSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  type LineItem = {
    id: number;
    checked: boolean;
    mapId: string;
    product: string;
    materialType: string;
    description: string;
    qty: string;
    ahLoaded: string;
    weight: string;
    batteryCondition: string;
  };
  const newLineItem = (id: number): LineItem => ({
    id,
    checked: false,
    mapId: "",
    product: "",
    materialType: "",
    description: "",
    qty: "",
    ahLoaded: "",
    weight: "0",
    batteryCondition: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem(1)]);
  const [nextId, setNextId] = useState(2);
  const addLineItem = () => {
    setLineItems((prev) => [...prev, newLineItem(nextId)]);
    setNextId((n) => n + 1);
  };
  const removeLineItem = (id: number) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };
  const updateLineItem = (id: number, patch: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const showFields = isWithout || revealed;

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
                <input defaultValue="" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input defaultValue="" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input defaultValue="" className={GREEN_INPUT + " text-center"} />
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
          {/* Top fields */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              <div>
                <label className={LABEL}>Incoterms</label>
                <select defaultValue="" className={GREEN_INPUT}>
                  <option value="" disabled>
                    Select
                  </option>
                  {INCOTERMS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Insurance Scope</label>
                <select defaultValue="" className={GREEN_INPUT}>
                  <option value="" disabled>
                    Select
                  </option>
                  {INSURANCE_SCOPE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Kilometres</label>
                <input type="number" placeholder="0" className={GREEN_INPUT} />
              </div>
              {isWithout && (
                <div>
                  <label className={LABEL}>DC Reference Number</label>
                  <input placeholder="Enter DC Reference Number" className={GREEN_INPUT} />
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                  <th className="px-2 py-1.5 text-center w-10">
                    <input type="checkbox" className="size-4 accent-white" />
                  </th>
                  <th className="px-2 py-1.5 text-center w-14">Sl.No</th>
                  <th className="px-2 py-1.5 text-center">Map ID</th>
                  <th className="px-2 py-1.5 text-center">Product</th>
                  <th className="px-2 py-1.5 text-center">Type of Material</th>
                  <th className="px-2 py-1.5 text-center">Material Description</th>
                  <th className="px-2 py-1.5 text-center">No of Sets/No (Qty)</th>
                  <th className="px-2 py-1.5 text-center">Ah Loaded</th>
                  <th className="px-2 py-1.5 text-center">Shipment Weight (kg)</th>
                  <th className="px-2 py-1.5 text-center">Battery Condition</th>
                  <th className="px-2 py-1.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) => updateLineItem(row.id, { checked: e.target.checked })}
                        className="size-4 accent-sky-600"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <select
                        value={row.mapId}
                        onChange={(e) => updateLineItem(row.id, { mapId: e.target.value })}
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
                        value={row.product}
                        onChange={(e) => updateLineItem(row.id, { product: e.target.value })}
                        className={GREEN_INPUT}
                      >
                        <option value="" disabled>
                          Select Product
                        </option>
                        {PRODUCTS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.materialType}
                        onChange={(e) => updateLineItem(row.id, { materialType: e.target.value })}
                        className={GREEN_INPUT}
                      >
                        <option value="" disabled>
                          Select Type
                        </option>
                        {MATERIAL_TYPES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={row.description}
                        onChange={(e) => updateLineItem(row.id, { description: e.target.value })}
                        placeholder="Enter Description"
                        className={GREEN_INPUT}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => updateLineItem(row.id, { qty: e.target.value })}
                        placeholder="0"
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={row.ahLoaded}
                        onChange={(e) => updateLineItem(row.id, { ahLoaded: e.target.value })}
                        placeholder="Ah"
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.weight}
                        onChange={(e) => updateLineItem(row.id, { weight: e.target.value })}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.batteryCondition}
                        onChange={(e) => updateLineItem(row.id, { batteryCondition: e.target.value })}
                        className={GREEN_INPUT}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {BATTERY_CONDITIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={addLineItem}
                          aria-label="Add row"
                          className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                        >
                          <Plus className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLineItem(row.id)}
                          disabled={lineItems.length === 1}
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
