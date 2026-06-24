import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
// @ts-ignore
import service from "../services/generalservice_service.js";
import { Plus } from "lucide-react";
import { CreateUserDialog, type UserFormValues } from "@/components/create-user-dialog";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/user-creation")({
  component: UserCreationPage,
});

function UserCreationPage() {
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    values?: UserFormValues;
  }>({ open: false, mode: "create" });
  const [users, setUsers] = useState<any[]>([]);
  const [viewPopup, setViewPopup] = useState(false);

  const [popupData, setPopupData] = useState<{
    title: string;
    items: string[];
  }>({
    title: "",
    items: [],
  });

  const getUsers = async () => {
    try {
      const res = await service.UserCreationDisplayTable();

      console.log("Display API Response:", res);

      const data = res.map((u: any) => ({
        USER: u.USER,
        FIRST_NAME: u.FIRST_NAME,
        LAST_NAME: u.LAST_NAME,
        EMAIL: u.EMAIL,
        CONTACT: u.CONTACT,
        EMP_CODE: u.EMP_CODE,
        INOUT_TYPE: u.INOUT_TYPE,
        CATEGORY: u.CATEGORY,
        STATUS: u.STATUS,
        ROLES: u.TYUSER,
        PLANTS: u.PLANTS || [],
        DIVISIONS: u.DIVISIONS || [],
        ACTIVITIES: u.ACTIVITY?.map((a: any) => a.ACT) || [],
      }));

      setUsers(data);
    } catch (error) {
      console.error("Display API Error:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const payload = {
        DEL_USER: userId,
      };

      const res = await service.UserCreationDelete(payload);

      if (res.STATUS === "TRUE") {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: res.MESSAGE,
        });

        // Refresh table
        getUsers();

        // OR remove from state directly
        // setUsers(users.filter((u) => u.USER !== userId));
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: res.MESSAGE,
        });
      }
    } catch (error) {
      console.error("Delete API Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Something went wrong while deleting user.",
      });
    }
  };

  const handleEdit = (user: any) => {
    setDialog({
      open: true,
      mode: "edit",
      values: {
        userId: user.USER,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        contact: user.CONTACT,
        email: user.EMAIL,
        category: user.CATEGORY,
        employeeCode: user.EMP_CODE,
        inOutType: user.INOUT_TYPE,

        plants: user.PLANTS?.map((p: any) => p.WERKS).join(",") || "",

        divisions:
          user.DIVISIONS?.map((d: any) => d.DIVISION).join(",") || "",

        role: user.ROLES,
        screensCount: user.ACTIVITIES?.length || 0,
        active: user.STATUS === "ACTIVE",
      },
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  const openPopup = (title: string, items: string[]) => {
    setPopupData({
      title,
      items,
    });

    setViewPopup(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
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
              <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
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
              {users.length > 0 ? (
                users.map((user: any, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2">{user.USER}</td>
                    <td className="px-3 py-2">{user.FIRST_NAME}</td>
                    <td className="px-3 py-2">{user.LAST_NAME}</td>
                    <td className="px-3 py-2">{user.EMAIL}</td>
                    <td className="px-3 py-2">{user.CONTACT}</td>
                    <td className="px-3 py-2">{user.EMP_CODE}</td>
                    <td className="px-3 py-2">{user.INOUT_TYPE}</td>
                    <td className="px-3 py-2">{user.CATEGORY}</td>
                    <td className="px-3 py-2">{user.ROLES}</td>
                    <td className="px-3 py-2">{user.STATUS}</td>
                    {/* <td className="text-center"> */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() =>
                          openPopup(
                            "Plants",
                            user.PLANTS?.map((p: any) => p.WERKS) || []
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                          {user.PLANTS?.length || 0}
                        </span>
                        <span className="text-blue-700 font-medium">
                          Plants
                        </span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() =>
                          openPopup(
                            "Divisions",
                            user.DIVISIONS?.map((d: any) => d.DIVISION) || []
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 hover:bg-green-100 transition"
                      >
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                          {user.DIVISIONS?.length || 0}
                        </span>

                        <span className="text-green-700 font-medium">
                          Divisions
                        </span>
                      </button>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() =>
                          openPopup(
                            "Activities",
                            user.ACTIVITIES || []
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 hover:bg-purple-100 transition"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                          {user.ACTIVITIES?.length || 0}
                        </span>

                        <span className="text-purple-700 font-medium">
                          Activities
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(user.USER)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="px-3 py-10 text-center">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-hairline flex justify-between text-[12px] text-muted-foreground">
          <span>
            Total Users:{" "}
            <span className="font-semibold text-foreground">
              {users.length}
            </span>
          </span>
        </div>
      </div>

      {/* <CreateUserDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        mode={dialog.mode}
        initialValues={dialog.values}
      /> */}
      <CreateUserDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        mode={dialog.mode}
        initialValues={dialog.values}
        onSuccess={getUsers}
      />
      <Dialog open={viewPopup} onOpenChange={setViewPopup}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogTitle className="text-xl font-bold text-slate-800 border-b pb-3">
            {popupData.title}
          </DialogTitle>

          <div className="mt-4 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {popupData.items.map((item, index) => (
                <div
                  key={index}
                  className="
              flex items-center gap-2
              p-3
              rounded-xl
              border
              bg-slate-50
              hover:bg-slate-100
              transition
            "
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </div>

                  <span className="text-sm font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}