import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X, Users } from "lucide-react";

const GREEN_INPUT =
  "h-9 w-full rounded-md bg-white dark:bg-surface border border-emerald-400/70 px-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-300 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30";
const LABEL =
  "block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1";

const SEARCH_OPTIONS = ["User ID", "Name", "Email", "Role"];

type FieldSpec = {
  label: string;
  value?: string;
  type?: "text" | "select" | "date" | "file" | "email" | "password";
  options?: string[];
  placeholder?: string;
};

const FIELDS: FieldSpec[] = [
  { label: "User ID" },
  { label: "Full Name" },
  { label: "Employee Code" },
  { label: "Email", type: "email" },
  { label: "Mobile Number" },
  { label: "Designation" },
  {
    label: "Department",
    type: "select",
    options: ["Logistics", "Finance", "Sales", "Plant Ops", "IT"],
    placeholder: "Select Department",
  },
  {
    label: "Role",
    type: "select",
    options: ["Admin", "LE Operator", "Approver", "Viewer"],
    placeholder: "Select Role",
  },
  {
    label: "Plant",
    type: "select",
    options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"],
    placeholder: "Select Plant",
  },
  {
    label: "Division",
    type: "select",
    options: ["NCPP", "VSP", "Industrial"],
    placeholder: "Select Division",
  },
  { label: "Reporting Manager" },
  { label: "Joining Date", type: "date" },
  { label: "Valid From", type: "date" },
  { label: "Valid To", type: "date" },
  {
    label: "Status",
    type: "select",
    options: ["Active", "Inactive", "Suspended"],
    placeholder: "Select Status",
  },
  { label: "Username" },
  { label: "Password", type: "password" },
  { label: "Confirm Password", type: "password" },
  { label: "Profile Photo", type: "file" },
];

const MODULES = [
  "Dispatch Orders",
  "Order Info",
  "Shipment Details",
  "Invoice & Load Details",
  "Segment Info",
  "Vehicle Info",
  "Transit Info",
  "Freight Billing",
  "Service Level",
  "Transit Damage Info",
  "Insurance Claim Tracking",
];

export function UserCreationCreate() {
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="space-y-4">
      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[12px] font-semibold border border-indigo-200">
          <Users className="size-3.5" /> Total Users: 1
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Active: 1
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[12px] font-semibold border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" /> Inactive: 0
        </span>
      </div>

      {/* Users list table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
              <th className="px-3 py-2.5 text-center w-16">Select</th>
              <th className="px-3 py-2.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-2.5 text-center">User ID</th>
              <th className="px-3 py-2.5 text-center">Full Name</th>
              <th className="px-3 py-2.5 text-center">Email</th>
              <th className="px-3 py-2.5 text-center">Role</th>
              <th className="px-3 py-2.5 text-center">Plant</th>
              <th className="px-3 py-2.5 text-center">Status</th>
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
                <input defaultValue="USR-0001" placeholder="Enter User ID" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="Harshini Lingutla" placeholder="Enter Full Name" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="harshini@hbl.in" placeholder="Enter Email" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="LE Operator" placeholder="Enter Role" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="HBL NCPP-SHPT" placeholder="Enter Plant" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="Active" placeholder="Status" className={GREEN_INPUT + " text-center"} />
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

      {/* Search bar */}
      <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
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
              placeholder="Search by User ID / Name / Email / Role"
              className="h-9 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12.5px] outline-none focus:border-accent"
            />
            <button className="h-9 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User details form */}
      <div className="bg-surface border border-hairline rounded-xl p-5 shadow-elegant">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          {FIELDS.map((f) => (
            <UserField key={f.label} field={f} />
          ))}
        </div>
      </div>

      {/* Permissions table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
              <th className="px-3 py-2.5 text-center w-12">
                <input type="checkbox" className="size-4 accent-white" />
              </th>
              <th className="px-3 py-2.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-2.5 text-center">Module</th>
              <th className="px-3 py-2.5 text-center w-20">View</th>
              <th className="px-3 py-2.5 text-center w-20">Create</th>
              <th className="px-3 py-2.5 text-center w-20">Edit</th>
              <th className="px-3 py-2.5 text-center w-20">Delete</th>
              <th className="px-3 py-2.5 text-center w-20">Approve</th>
              <th className="px-3 py-2.5 text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" defaultChecked className="size-4 accent-sky-600" />
              </td>
              <td className="px-3 py-2 text-center">1</td>
              <td className="px-3 py-2">
                <select defaultValue="Order Info" className={GREEN_INPUT}>
                  <option value="" disabled>Select Module</option>
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" defaultChecked className="size-4 accent-emerald-600" />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" defaultChecked className="size-4 accent-emerald-600" />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" className="size-4 accent-emerald-600" />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" className="size-4 accent-emerald-600" />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" className="size-4 accent-emerald-600" />
              </td>
              <td className="px-3 py-2 text-center">
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
          </tbody>
        </table>
      </div>

      {/* Footer */}
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
    </div>
  );
}

function UserField({ field }: { field: FieldSpec }) {
  const { label, value = "", type = "text", options, placeholder } = field;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {type === "select" ? (
        <select defaultValue="" className={GREEN_INPUT}>
          <option value="" disabled>
            {placeholder ?? "Select"}
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input type="date" defaultValue={value} className={GREEN_INPUT} />
      ) : type === "file" ? (
        <input type="file" className={GREEN_INPUT + " py-1.5"} />
      ) : type === "password" ? (
        <input type="password" placeholder={placeholder ?? `Enter ${label}`} className={GREEN_INPUT} />
      ) : type === "email" ? (
        <input type="email" defaultValue={value} placeholder={placeholder ?? `Enter ${label}`} className={GREEN_INPUT} />
      ) : (
        <input defaultValue={value} placeholder={placeholder ?? `Enter ${label}`} className={GREEN_INPUT} />
      )}
    </div>
  );
}