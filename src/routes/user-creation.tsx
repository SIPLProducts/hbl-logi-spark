import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
// @ts-ignore
import service from "../services/generalservice_service.js";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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

// ---------------------------------------------------------------------------
// Users table layout (same as the IML Users table): search filter, sortable
// headers and a paginator with rows-per-page + first/prev/next/last.
// Only changes how the already-loaded `users` list is displayed.
// ---------------------------------------------------------------------------
const PAGE_SIZE_OPTIONS = [5, 10, 25];

// Sortable text columns, in table order
const SORTABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "USER", label: "User ID" },
  { key: "FIRST_NAME", label: "First Name" },
  { key: "LAST_NAME", label: "Last Name" },
  { key: "EMAIL", label: "Email" },
  { key: "CONTACT", label: "Contact" },
  { key: "EMP_CODE", label: "Employee Code" },
  { key: "INOUT_TYPE", label: "In/Out" },
  { key: "CATEGORY", label: "Category" },
  { key: "ROLES", label: "Roles" },
  { key: "STATUS", label: "Status" },
];

// Fields the search box looks in
const SEARCH_FIELDS = SORTABLE_COLUMNS.map((c) => c.key);

const pagerButtonClass =
  "size-7 grid place-items-center rounded-md border border-hairline bg-surface text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed";

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
        PASSWORD: u.PASSWORD,
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
        password: user.PASSWORD,
        category: user.CATEGORY,
        employeeCode: user.EMP_CODE,
        inOutType: user.INOUT_TYPE,

        plants: user.PLANTS?.map((p: any) => p.WERKS).join(",") || "",

        divisions:
          user.DIVISIONS?.map((d: any) => d.DIVISION).join(",") || "",

        role: user.ROLES,
        screensCount: user.ACTIVITIES?.length || 0,
        activities: user.ACTIVITIES || [],
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

  // ---- Table view state: search, sort, pagination (display only) ----
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // 1. Filter by the search text
  const filteredUsers = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return users;
    return users.filter((user) =>
      SEARCH_FIELDS.some((field) =>
        String(user[field] ?? "").toLowerCase().includes(text)
      )
    );
  }, [users, search]);

  // 2. Sort by the clicked column
  const sortedUsers = useMemo(() => {
    if (!sortKey) return filteredUsers;
    const sorted = [...filteredUsers].sort((a, b) =>
      String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [filteredUsers, sortKey, sortDir]);

  // 3. Cut out the current page
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);
  const rangeStart = sortedUsers.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, sortedUsers.length);

  // Go back to page 1 whenever the search or page size changes
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // Click a header: ascending -> descending -> no sort
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-hairline">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            User Management
          </h1>
          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users"
                aria-label="Search users"
                className="h-9 w-56 pl-8 pr-3 rounded-lg border border-hairline bg-surface text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              onClick={() => setDialog({ open: true, mode: "create" })}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform"
            >
              <Plus className="size-3.5" /> Create New User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-elegant">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                {/* Column headers — names only (no sort/filter icons) */}
                {SORTABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2.5 text-left whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center">Plants</th>
                <th className="px-3 py-2.5 text-center">Divisions</th>
                <th className="px-3 py-2.5 text-center">Activities</th>
                <th className="px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length > 0 ? (
                pagedUsers.map((user: any, index) => (
                  <tr
                    key={startIndex + index}
                    className="border-b border-hairline hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-3 py-2">{user.USER}</td>
                    <td className="px-3 py-2">{user.FIRST_NAME}</td>
                    <td className="px-3 py-2">{user.LAST_NAME}</td>
                    <td className="px-3 py-2">{user.EMAIL}</td>
                    <td className="px-3 py-2">{user.CONTACT}</td>
                    <td className="px-3 py-2">{user.EMP_CODE}</td>
                    <td className="px-3 py-2">{user.INOUT_TYPE}</td>
                    <td className="px-3 py-2">{user.CATEGORY}</td>
                    <td className="px-3 py-2">{user.ROLES}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          String(user.STATUS).toUpperCase() === "ACTIVE"
                            ? "font-medium text-green-600"
                            : "font-medium text-red-500"
                        }
                      >
                        {user.STATUS}
                      </span>
                    </td>
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
                  <td colSpan={14} className="px-3 py-10 text-center text-muted-foreground">
                    {users.length > 0 && search.trim()
                      ? "No users match your search."
                      : "No users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: total + paginator */}
        <div className="px-5 py-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
          <span>
            Total Users:{" "}
            <span className="font-semibold text-foreground">
              {users.length}
            </span>
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {/* Rows per page */}
            <label className="flex items-center gap-2">
              Rows per page:
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 px-2 rounded-md border border-hairline bg-surface text-foreground text-[12px] focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            {/* Range, e.g. "1 – 5 of 23" */}
            <span>
              <span className="font-semibold text-foreground">
                {rangeStart} – {rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {sortedUsers.length}
              </span>
            </span>

            {/* First / Previous / Next / Last */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
                className={pagerButtonClass}
                aria-label="First page"
              >
                <ChevronsLeft className="size-3.5" />
              </button>
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className={pagerButtonClass}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className={pagerButtonClass}
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage >= totalPages}
                className={pagerButtonClass}
                aria-label="Last page"
              >
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
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