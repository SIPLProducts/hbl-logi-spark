import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";
const REQ = <span className="text-rose-500 ml-0.5">*</span>;

export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [active, setActive] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden max-w-[760px] w-[95vw] border-0 [&>button]:hidden"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-5 py-3.5 flex items-center justify-between">
          <DialogTitle className="text-white font-semibold text-[15px] tracking-tight">
            Create New User
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/90 hover:text-white p-1 rounded-md hover:bg-white/10"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 bg-surface">
          <Field label={<>User ID{REQ}</>}>
            <input defaultValue="2424" className={INPUT} />
          </Field>
          <Field label={<>First Name{REQ}</>}>
            <input placeholder="Enter first name" className={INPUT} />
          </Field>
          <Field label="Last Name">
            <input placeholder="Enter last name" className={INPUT} />
          </Field>

          <Field label={<>Contact{REQ}</>}>
            <input placeholder="Enter contact number" className={INPUT} />
          </Field>
          <Field label={<>Email{REQ}</>}>
            <input type="email" placeholder="Enter email address" className={INPUT} />
          </Field>
          <Field label="Category">
            <select defaultValue="Internal" className={INPUT}>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </Field>

          <Field label={<>Password{REQ}</>}>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                defaultValue="password12"
                className={INPUT + " pr-9"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label={<>Confirm Password{REQ}</>}>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Enter password"
                className={INPUT + " pr-9"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label={<>Employee Code{REQ}</>}>
            <input placeholder="Enter employee code" className={INPUT} />
          </Field>

          <Field label={<>In/Out Type{REQ}</>}>
            <select defaultValue="" className={INPUT}>
              <option value="" disabled></option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
              <option value="Contract">Contract</option>
            </select>
          </Field>
          <Field label="Plants">
            <input placeholder="Select Plants" className={INPUT} />
          </Field>
          <Field label="Divisions">
            <input placeholder="Select Divisions" className={INPUT} />
          </Field>

          <Field label="Role">
            <select defaultValue="" className={INPUT}>
              <option value="" disabled></option>
              <option value="Admin">Admin</option>
              <option value="LE Operator">LE Operator</option>
              <option value="Approver">Approver</option>
              <option value="Viewer">Viewer</option>
            </select>
          </Field>
          <Field label="Activities (Screens)">
            <button
              type="button"
              className="h-9 px-4 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-[12.5px] font-semibold shadow-sm"
            >
              Select Screens (0)
            </button>
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2 h-9">
              <span
                className={
                  "px-2.5 py-1 rounded text-[11px] font-semibold " +
                  (!active ? "bg-muted text-foreground" : "text-muted-foreground")
                }
              >
                Inactive
              </span>
              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors " +
                  (active ? "bg-emerald-500" : "bg-muted")
                }
                aria-pressed={active}
              >
                <span
                  className={
                    "inline-block size-4 transform rounded-full bg-white shadow transition-transform " +
                    (active ? "translate-x-[18px]" : "translate-x-0.5")
                  }
                />
              </button>
              <span
                className={
                  "px-2.5 py-1 rounded text-[11px] font-semibold " +
                  (active ? "bg-emerald-500 text-white" : "text-muted-foreground")
                }
              >
                Active
              </span>
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline flex justify-end bg-surface">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-6 rounded-md bg-[#7a1325] hover:bg-[#92172d] text-white text-[12.5px] font-semibold shadow-sm"
          >
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}