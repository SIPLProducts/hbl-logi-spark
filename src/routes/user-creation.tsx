import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { CreateUserDialog, type UserFormValues } from "@/components/create-user-dialog";

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
              <tr className="bg-primary text-primary-foreground text-[11px] font-semibold">
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
              <tr>
                <td colSpan={14} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                  No users yet.
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