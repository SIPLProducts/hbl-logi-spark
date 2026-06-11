import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { CreateUserDialog, type UserFormValues } from "@/components/create-user-dialog";

const SEED_USER: UserFormValues = {
  userId: "2424",
  firstName: "Admin",
  lastName: "User",
  contact: "7337283880",
  email: "inturimounika@sharviinfotech.com",
  category: "Internal",
  employeeCode: "2424",
  inOutType: "Outward",
  plants: "1100, 1101, 1102, 1105, 1106, 1200, 1300",
  divisions: "NCPP, COMMON SERVICE, Corporate",
  role: "ADMIN",
  screensCount: 23,
  active: true,
};

export const Route = createFileRoute("/user-creation")({
  head: () => ({
    meta: [
      { title: "User Creation · HBL LE" },
      { name: "description", content: "Create and manage HBL LE application users, roles, and permissions." },
    ],
  }),
  component: UserCreationPage,
});

function UserCreationPage() {
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    values?: UserFormValues;
  }>({ open: false, mode: "create" });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-hairline">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            User Management
          </h1>
          <button
            onClick={() => setDialog({ open: true, mode: "create" })}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="size-3.5" /> Create New User
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-elegant">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
                <th className="px-3 py-2.5 text-center">User ID</th>
                <th className="px-3 py-2.5 text-center">First Name</th>
                <th className="px-3 py-2.5 text-center">Last Name</th>
                <th className="px-3 py-2.5 text-center">Email</th>
                <th className="px-3 py-2.5 text-center">Contact</th>
                <th className="px-3 py-2.5 text-center">Employee Code</th>
                <th className="px-3 py-2.5 text-center">In/Out</th>
                <th className="px-3 py-2.5 text-center">Category</th>
                <th className="px-3 py-2.5 text-center">Roles</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Plants</th>
                <th className="px-3 py-2.5 text-center">Divisions</th>
                <th className="px-3 py-2.5 text-center">Activities</th>
                <th className="px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-accent/[0.04]">
                <td className="px-3 py-3 text-center">2424</td>
                <td className="px-3 py-3 text-center">Admin</td>
                <td className="px-3 py-3 text-center">User</td>
                <td className="px-3 py-3 text-center">inturimounika@sharviinfotech.com</td>
                <td className="px-3 py-3 text-center">7337283880</td>
                <td className="px-3 py-3 text-center">2424</td>
                <td className="px-3 py-3 text-center">outward</td>
                <td className="px-3 py-3 text-center">Internal</td>
                <td className="px-3 py-3 text-center font-semibold">ADMIN</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    Active
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
                    Plants (10)
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
                    Divisions (10)
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
                    <ShieldCheck className="size-3" /> Screens (23)
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => setDialog({ open: true, mode: "edit", values: SEED_USER })}
                      className="inline-grid place-items-center size-7 rounded-md text-sky-600 hover:bg-sky-50"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button className="inline-grid place-items-center size-7 rounded-md text-rose-600 hover:bg-rose-50">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-hairline text-[12px] text-muted-foreground">
          Items per page: <span className="font-semibold text-foreground">1</span>
        </div>
      </div>

      <CreateUserDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        mode={dialog.mode}
        initialValues={dialog.values}
      />
    </div>
  );
}