import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

const inputClass =
  "w-full rounded border border-[#ccc] p-2 text-[14px] text-slate-900 focus:outline-none";

/** Password input with its label sitting on the border, like the IML dialog. */
function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        type="password"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={inputClass + " h-12 focus:border-[#4f46e5] focus:border-2"}
      />
      <span className="pointer-events-none absolute -top-2 left-2 bg-white px-1 text-[12px] text-slate-600">
        {label}
      </span>
    </div>
  );
}

/**
 * Change Password popup: same fields, messages and buttons as the IML dialog.
 * Like IML, it only closes with Cancel (not by clicking outside or pressing Esc).
 */
export function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [userName, setUserName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Start with empty passwords and the logged-in user every time it opens
  useEffect(() => {
    if (!open) return;

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    try {
      const user = JSON.parse(localStorage.getItem("userData") ?? "null");
      setUserName(String(user?.USER ?? ""));
    } catch {
      setUserName("");
    }
  }, [open]);

  if (!open) return null;

  const resetPassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire("Error", "All fields required", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match", "error");
      return;
    }

    // TODO(API): save the new password here. The password is not changed yet.
    Swal.fire({ icon: "info", text: "Change Password API is not connected yet." });
  };

  // Rendered on the page body so the header's blur effect cannot trap the overlay inside it
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change Password"
        className="w-[300px] max-w-full rounded bg-white p-6 shadow-xl"
      >
        <h2
          className="mb-2.5 p-2 text-[16px] font-medium text-white"
          style={{
            backgroundImage: "linear-gradient(to right, rgb(0, 212, 255), rgb(2, 0, 36))",
          }}
        >
          Change Password
        </h2>

        <div className="flex flex-col gap-[18px] pt-[5px]">
          <div>
            <label htmlFor="change-password-user" className="mb-[5px] block text-[14px] font-semibold text-slate-900">
              User Name
            </label>
            <input id="change-password-user" className={inputClass} value={userName} readOnly />
          </div>

          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="new-password"
          />
          <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
          <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
        </div>

        <div className="mt-2.5 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 cursor-pointer rounded border border-slate-300 bg-white px-4 text-[14px] font-medium text-[#dc2626] hover:bg-red-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={resetPassword}
            className="h-9 cursor-pointer rounded bg-[#4f46e5] px-4 text-[14px] font-medium text-white shadow hover:brightness-110"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
