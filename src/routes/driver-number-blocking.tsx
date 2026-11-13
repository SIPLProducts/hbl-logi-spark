import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, RefreshCw, X } from "lucide-react";
import Swal from "sweetalert2";
// @ts-ignore  (TIP: add a services/generalservice_service.d.ts to remove this)
import service from "../services/generalservice_service.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/driver-number-blocking")({
  component: DriverNumberBlockingPage,
});

// NOTE: kept non-exported so the route file only exports `Route` (fast-refresh safe).
// If other files need it, move to e.g. src/types/driver.ts
type DriverBlockRecord = {
  id: string;
  driverName: string;
  driverNumber: string;
  isBlocked: boolean; // true = Blocked, false = Unblocked
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Set this to the ZDNAME field length in SAP (DDIC)
const DRIVER_NAME_MAX_LENGTH = 40;

// Indian 10-digit mobile number (starts with 6-9)
const MOBILE_REGEX = /^[6-9]\d{9}$/;

// Extract array from API response dynamically
const extractItems = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  for (const key of ["data", "DATA", "ITEMS", "items", "result", "RESULT"]) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  return res && typeof res === "object" && (res.ZDNAME || res.zdname) ? [res] : [];
};

const showWarning = (title: string, text: string) =>
  Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#0b2249" });

// Shared validation for Create & Update. Returns clean number or null if invalid.
const validateDriver = (name: string, number: string): string | null => {
  if (!name.trim()) {
    showWarning("Required Field", "Please enter the Driver Name.");
    return null;
  }
  const cleanNumber = number.trim().replace(/[^0-9]/g, "");
  if (!cleanNumber) {
    showWarning("Required Field", "Please enter the Driver Number.");
    return null;
  }
  if (!MOBILE_REGEX.test(cleanNumber)) {
    showWarning("Invalid Number", "Driver Number must be a valid 10-digit mobile number.");
    return null;
  }
  return cleanNumber;
};

// Block / Unblock Toggle Switch (same design for main form & edit popup)
function BlockToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 h-[34px]">
      <span
        className={
          "px-2.5 py-1 rounded text-[11px] font-semibold transition-colors " +
          (!value ? "bg-emerald-500 text-white" : "text-muted-foreground")
        }
      >
        Unblock
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60 " +
          (value ? "bg-rose-500" : "bg-emerald-500")
        }
        aria-pressed={value}
        title={value ? "Currently Blocked" : "Currently Unblocked"}
      >
        <span
          className={
            "inline-block size-4 transform rounded-full bg-white shadow transition-transform " +
            (value ? "translate-x-[18px]" : "translate-x-0.5")
          }
        />
      </button>
      <span
        className={
          "px-2.5 py-1 rounded text-[11px] font-semibold transition-colors " +
          (value ? "bg-rose-500 text-white" : "text-muted-foreground")
        }
      >
        Block
      </span>
    </div>
  );
}

// Blocking Type radio option (pill style: selected option gets a light-blue background)
function BlockingTypeRadio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={
        "inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 text-[12.5px] font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
        (checked ? "bg-accent/10 text-foreground" : "text-muted-foreground hover:text-foreground")
      }
    >
      <span
        className={
          "grid place-items-center size-4 rounded-full border-2 transition-colors " +
          (checked ? "border-accent" : "border-muted-foreground/40")
        }
        aria-hidden
      >
        <span
          className={
            "size-2 rounded-full transition-all " + (checked ? "bg-accent scale-100" : "bg-transparent scale-0")
          }
        />
      </span>
      {label}
    </button>
  );
}

function DriverNumberBlockingPage() {
  // Blocking Type: "driver" shows the Driver Number Blocking section (default), "vehicle" the Vehicle one
  const [blockingType, setBlockingType] = useState<"driver" | "vehicle">("driver");

  // ── Vehicle Number Blocking (design only — APIs will be connected later) ──
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleReason, setVehicleReason] = useState("");
  const [vehicleIsBlocked, setVehicleIsBlocked] = useState(true); // default to Blocked, same as Driver
  // Table records: Populated strictly and solely via the DisplayVehicleNumberBlocking API
  const [vehicles, setVehicles] = useState<{ id: string; vehicleNumber: string; reason: string; isBlocked: boolean }[]>([]);
  const [isVehicleTableLoading, setIsVehicleTableLoading] = useState(false);
  const [vehicleFetchError, setVehicleFetchError] = useState(false);

  // Fetch vehicle blocking details via DisplayVehicleNumberBlocking API
  const fetchVehicles = async () => {
    try {
      setIsVehicleTableLoading(true);
      setVehicleFetchError(false);
      const res: any = await service.DisplayVehicleNumberBlocking();
      console.log("Vehicle Number Blocking - DisplayVehicleNumberBlocking Response:", res);

      // Response is an array of rows; a single row object is also accepted
      const items: any[] = Array.isArray(res)
        ? res
        : res && typeof res === "object" && (res.ZVEH_NUM || res.zveh_num)
          ? [res]
          : extractItems(res);

      // Field Mapping:
      // ZVEH_NUM -> Vehicle Number
      // ZREMARKS -> Reason
      // ZBLK_IND -> "X" for Block, empty value for Unblock
      // MANDT is not displayed in the table
      const mapped = items.map((item: any, idx: number) => {
        const number = String(item?.ZVEH_NUM ?? item?.zveh_num ?? "").trim();
        const reason = String(item?.ZREMARKS ?? item?.zremarks ?? "").trim();
        const blkInd = String(item?.ZBLK_IND ?? item?.zblk_ind ?? "").trim().toUpperCase();
        return {
          // Vehicle number is the unique key; fall back to reason+idx only if number is empty
          id: number || `${reason}-${idx}`,
          vehicleNumber: number,
          reason,
          isBlocked: blkInd === "X",
        };
      });

      setVehicles(mapped);
    } catch (error) {
      console.error("DisplayVehicleNumberBlocking API Error:", error);
      // On error, keep table empty — never inject fallback dummy data
      setVehicles([]);
      setVehicleFetchError(true);
    } finally {
      setIsVehicleTableLoading(false);
    }
  };

  // Call the DisplayVehicleNumberBlocking API whenever the Vehicle Number Blocking tab is opened
  useEffect(() => {
    if (blockingType === "vehicle") fetchVehicles();
  }, [blockingType]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehiclePageSize, setVehiclePageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [vehiclePage, setVehiclePage] = useState(1);

  const filteredVehicles = vehicles.filter((v) => {
    const query = vehicleSearch.trim().toLowerCase();
    if (!query) return true;
    const statusText = v.isBlocked ? "blocked" : "unblocked";
    return (
      v.vehicleNumber.toLowerCase().includes(query) ||
      v.reason.toLowerCase().includes(query) ||
      statusText.includes(query)
    );
  });
  const vehicleTotalPages = Math.max(1, Math.ceil(filteredVehicles.length / vehiclePageSize));
  const vehicleCurrentPage = Math.min(vehiclePage, vehicleTotalPages);
  const vehicleStartIndex = (vehicleCurrentPage - 1) * vehiclePageSize;
  const pagedVehicles = filteredVehicles.slice(vehicleStartIndex, vehicleStartIndex + vehiclePageSize);

  // Delete in-progress (vehicle number being deleted) — prevents double-click
  const [deletingVehicleNumber, setDeletingVehicleNumber] = useState<string | null>(null);

  // Handle Vehicle Delete action: Call DeleteVehicleNumberBlocking API
  const handleVehicleDelete = async (record: { id: string; vehicleNumber: string }) => {
    if (deletingVehicleNumber) return; // block double-click / parallel deletes

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${record.vehicleNumber ? `vehicle "${record.vehicleNumber}"` : "this vehicle record"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#0b2249",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    // Dynamic payload mapping: DEL_VEH bound to Vehicle Number (ZVEH_NUM)
    const payload = {
      DEL_VEH: record.vehicleNumber,
    };

    try {
      setDeletingVehicleNumber(record.id);
      console.log("Vehicle Number Blocking - DeleteVehicleNumberBlocking Payload:", payload);
      const res: any = await service.DeleteVehicleNumberBlocking(payload);
      console.log("Vehicle Number Blocking - DeleteVehicleNumberBlocking Response:", res);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // If STATUS is "TRUE", display the success MESSAGE from the API response in Swal
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: res?.MESSAGE || "Vehicle record deleted successfully.",
          confirmButtonColor: "#0b2249",
        });

        // After successful deletion, refresh the table by calling DisplayVehicleNumberBlocking API
        fetchVehicles();
      } else {
        // If STATUS is "FALSE", display the failure MESSAGE from the API response in Swal (row is kept)
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to delete vehicle record.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("DeleteVehicleNumberBlocking API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setDeletingVehicleNumber(null);
    }
  };

  const [isVehicleSubmitting, setIsVehicleSubmitting] = useState(false);

  // Handle Vehicle Form Submit: Call SaveVehicleNumberBlocking API
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      showWarning("Required Field", "Please enter the Vehicle Number.");
      return;
    }
    if (!vehicleReason.trim()) {
      showWarning("Required Field", "Please enter the Reason.");
      return;
    }

    // Dynamic payload mapping:
    // zveh_num: Vehicle Number
    // zremarks: Reason
    // zblk_ind: "X" if Block, "" if Unblock
    const payload = {
      VEH_UPDATE: {
        zveh_num: vehicleNumber.trim(),
        zremarks: vehicleReason.trim(),
        zblk_ind: vehicleIsBlocked ? "X" : "",
      },
    };

    try {
      setIsVehicleSubmitting(true);
      console.log("Vehicle Number Blocking - SaveVehicleNumberBlocking Payload:", payload);
      const res: any = await service.SaveVehicleNumberBlocking(payload);
      console.log("Vehicle Number Blocking - SaveVehicleNumberBlocking Response:", res);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // Display the MESSAGE from the API response in a SweetAlert popup
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Vehicle details saved successfully.",
          confirmButtonColor: "#0b2249",
        });

        // Reset form inputs
        setVehicleNumber("");
        setVehicleReason("");
        setVehicleIsBlocked(true);

        // Refresh the vehicle list strictly from the API
        fetchVehicles();
      } else {
        // Treat STATUS === "FALSE" as failure and display error MESSAGE
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to save vehicle details.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("SaveVehicleNumberBlocking API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setIsVehicleSubmitting(false);
    }
  };

  // Vehicle Edit Popup Modal inputs & state (Vehicle Number is read-only, Reason is editable)
  const [isVehicleEditModalOpen, setIsVehicleEditModalOpen] = useState(false);
  const [editVehicleNumber, setEditVehicleNumber] = useState("");
  const [editVehicleReason, setEditVehicleReason] = useState("");
  const [editVehicleIsBlocked, setEditVehicleIsBlocked] = useState(true);
  const [isVehicleUpdating, setIsVehicleUpdating] = useState(false);

  // Open the Vehicle Edit popup with the selected row's existing data
  const handleVehicleEdit = (record: { vehicleNumber: string; reason: string; isBlocked: boolean }) => {
    setEditVehicleNumber(record.vehicleNumber);
    setEditVehicleReason(record.reason);
    setEditVehicleIsBlocked(record.isBlocked);
    setIsVehicleEditModalOpen(true);
  };

  // Handle Update action inside the Vehicle Edit Popup Modal:
  // Calls the existing SaveVehicleNumberBlocking general service API
  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reason is editable in the popup — it must not be left empty
    if (!editVehicleReason.trim()) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please enter the Reason" });
      return;
    }

    // zveh_num: Vehicle Number (read-only, existing value)
    // zremarks: Reason (edited value from the popup)
    // zblk_ind: "X" if Block, "" if Unblock
    const payload = {
      VEH_UPDATE: {
        zveh_num: editVehicleNumber,
        zremarks: editVehicleReason,
        zblk_ind: editVehicleIsBlocked ? "X" : "",
      },
    };

    try {
      setIsVehicleUpdating(true);
      console.log("Vehicle Number Blocking - SaveVehicleNumberBlocking (Update) Payload:", payload);
      const res: any = await service.SaveVehicleNumberBlocking(payload);
      console.log("Vehicle Number Blocking - SaveVehicleNumberBlocking (Update) Response:", res);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // Close the popup modal
        setIsVehicleEditModalOpen(false);

        // Display the MESSAGE from the API response in a SweetAlert popup
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Vehicle details updated successfully.",
          confirmButtonColor: "#0b2249",
        });

        // After successful update, refresh the table using the DisplayVehicleNumberBlocking API
        fetchVehicles();
      } else {
        // If STATUS is "FALSE", display the failure message from the API response in Swal
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to update vehicle details.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("SaveVehicleNumberBlocking Update API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setIsVehicleUpdating(false);
    }
  };

  // Table records: Populated strictly and solely via the DisplayDriverNumberBlockingScreen API
  const [drivers, setDrivers] = useState<DriverBlockRecord[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Main Form inputs (Create / Submit)
  const [driverName, setDriverName] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [isBlocked, setIsBlocked] = useState(true); // default to Blocked when submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Popup Modal inputs & state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverNumber, setEditDriverNumber] = useState("");
  const [editIsBlocked, setEditIsBlocked] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete in-progress (driver number being deleted) — prevents double-click
  const [deletingNumber, setDeletingNumber] = useState<string | null>(null);

  // Table search & pagination state
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  // 1. Fetch driver blocking details strictly via DisplayDriverNumberBlockingScreen API
  // No mock data or hardcoded rows are added from our side.
  const fetchDrivers = async () => {
    try {
      setIsTableLoading(true);
      setFetchError(false);
      const res: any = await service.DisplayDriverNumberBlockingScreen();

      const items = extractItems(res);

      // Field Mapping as specified:
      // ZDNAME   -> Driver Name
      // ZDNUMBER -> Driver Number
      // ZBLK_IND -> "X" for Block, empty value for Unblock
      // MANDT is not displayed in the table
      const mapped: DriverBlockRecord[] = items.map((item: any, idx: number) => {
        const name = String(item?.ZDNAME ?? item?.zdname ?? "").trim();
        const number = String(item?.ZDNUMBER ?? item?.zdnumber ?? "").trim();
        const blkInd = String(item?.ZBLK_IND ?? item?.zblk_ind ?? "").trim().toUpperCase();

        return {
          // Driver number is the unique key; fall back to name+idx only if number is empty
          id: number || `${name}-${idx}`,
          driverName: name,
          driverNumber: number,
          isBlocked: blkInd === "X",
        };
      });

      // Strictly set the records returned by the API
      setDrivers(mapped);
    } catch (error) {
      console.error("DisplayDriverNumberBlockingScreen API Error:", error);
      // On error, keep table empty — never inject fallback dummy data
      setDrivers([]);
      setFetchError(true);
    } finally {
      setIsTableLoading(false);
    }
  };

  // Call the DisplayDriverNumberBlockingScreen API whenever the screen is opened
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Filtered drivers based on search input
  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return drivers;
    return drivers.filter((d) => {
      const statusText = d.isBlocked ? "block" : "unblock";
      return (
        d.driverName.toLowerCase().includes(query) ||
        d.driverNumber.toLowerCase().includes(query) ||
        statusText.includes(query)
      );
    });
  }, [drivers, search]);

  // Pagination calculation
  const totalEntries = filteredDrivers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const pagedDrivers = filteredDrivers.slice(startIndex, startIndex + pageSize);
  const rangeStart = totalEntries === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, totalEntries);

  // Handle Edit action: Opens the Edit popup modal and populates it with row data
  const handleEdit = (record: DriverBlockRecord) => {
    setEditDriverName(record.driverName);
    setEditDriverNumber(record.driverNumber);
    setEditIsBlocked(record.isBlocked);
    setIsEditModalOpen(true);
  };

  // Handle Update action inside the Edit Popup Modal:
  // Calls the existing SaveDriverNumberBlockingScreen general service API
  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNumber = validateDriver(editDriverName, editDriverNumber);
    if (!cleanNumber) return;
    const cleanName = editDriverName.trim();

    // Reuse existing SaveDriverNumberBlockingScreen API with same payload structure:
    // zdname: Updated Driver Name
    // zdnumber: Driver Number (read-only in edit, it is the key)
    // zblk_ind: "X" if Block, "" if Unblock
    const payload = {
      CON_UPDATE: {
        zdname: cleanName,
        zdnumber: cleanNumber,
        zblk_ind: editIsBlocked ? "X" : "",
      },
    };

    try {
      setIsUpdating(true);
      const res: any = await service.SaveDriverNumberBlockingScreen(payload);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // Close the popup modal
        setIsEditModalOpen(false);

        // Display the MESSAGE from the API response in a SweetAlert popup
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Driver details updated successfully.",
          confirmButtonColor: "#0b2249",
        });

        // After successful update, refresh the table using existing DisplayDriverNumberBlockingScreen API
        fetchDrivers();
      } else {
        // If STATUS is "FALSE", display the failure message from the API response in Swal
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to update driver details.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("SaveDriverNumberBlockingScreen Update API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete action: Call DeleteDriverNumberBlockingScreen API
  const handleDelete = async (record: DriverBlockRecord) => {
    if (deletingNumber) return; // block double-click / parallel deletes

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${record.driverName ? `driver "${record.driverName}"` : "this driver record"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#0b2249",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    // Dynamic payload mapping: DEL_CON bound to Driver Number (ZDNUMBER)
    const payload = {
      DEL_CON: record.driverNumber,
    };

    try {
      setDeletingNumber(record.id);
      const res: any = await service.DeleteDriverNumberBlockingScreen(payload);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // If STATUS is "TRUE", display the success MESSAGE from the API response in Swal
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: res?.MESSAGE || "Driver record deleted successfully.",
          confirmButtonColor: "#0b2249",
        });

        // After successful deletion, refresh the table by calling DisplayDriverNumberBlockingScreen API
        fetchDrivers();
      } else {
        // If STATUS is "FALSE", display the failure MESSAGE from the API response in Swal
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to delete driver record.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("DeleteDriverNumberBlockingScreen API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setDeletingNumber(null);
    }
  };

  // Handle Main Form Submit: Call SaveDriverNumberBlockingScreen API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNumber = validateDriver(driverName, driverNumber);
    if (!cleanNumber) return;
    const cleanName = driverName.trim();

    // Duplicate check: number already exists -> saving would overwrite that record
    const existing = drivers.find((d) => d.driverNumber === cleanNumber);
    if (existing) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Number already exists",
        text: `Driver Number ${cleanNumber} already exists${existing.driverName ? ` for "${existing.driverName}"` : ""
          }. Do you want to overwrite it?`,
        showCancelButton: true,
        confirmButtonColor: "#0b2249",
        cancelButtonColor: "#e11d48",
        confirmButtonText: "Yes, overwrite",
        cancelButtonText: "Cancel",
      });
      if (!confirm.isConfirmed) return;
    }

    // Dynamic payload mapping:
    // zdname: Driver Name
    // zdnumber: Driver Number
    // zblk_ind: "X" if Block, "" if Unblock
    const payload = {
      CON_UPDATE: {
        zdname: cleanName,
        zdnumber: cleanNumber,
        zblk_ind: isBlocked ? "X" : "",
      },
    };

    try {
      setIsSubmitting(true);
      const res: any = await service.SaveDriverNumberBlockingScreen(payload);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE";

      if (isSuccess) {
        // Display the MESSAGE from the API response in a SweetAlert popup
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Driver details saved successfully.",
          confirmButtonColor: "#0b2249",
        });

        // Reset form inputs
        setDriverName("");
        setDriverNumber("");
        setIsBlocked(true);

        // Refresh the driver list strictly from the API
        fetchDrivers();
      } else {
        // Treat STATUS === "FALSE" as failure and display error MESSAGE
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MESSAGE || "Failed to save driver details.",
          confirmButtonColor: "#0b2249",
        });
      }
    } catch (error) {
      console.error("SaveDriverNumberBlockingScreen API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "An error occurred while connecting to the server. Please try again.",
        confirmButtonColor: "#0b2249",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Screen Page Header (Standard across all LE screens) ── */}
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
              <ShieldAlert className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                Blocking Master
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={blockingType === "vehicle" ? fetchVehicles : fetchDrivers}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted cursor-pointer transition-colors"
            >
              <RefreshCw className={`size-3.5 ${(blockingType === "vehicle" ? isVehicleTableLoading : isTableLoading) ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Screen Body ── */}
      <div className="flex-1 p-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* ── Blocking Type Card ── */}
        <div className="bg-surface border border-hairline rounded-lg shadow-sm px-5 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[12.5px] font-semibold text-foreground">
              Blocking Type <span className="text-rose-500">*</span>
            </span>
            <div role="radiogroup" className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/60">
              <BlockingTypeRadio
                label="Driver Number Blocking"
                checked={blockingType === "driver"}
                onSelect={() => setBlockingType("driver")}
              />
              <BlockingTypeRadio
                label="Vehicle Number Blocking"
                checked={blockingType === "vehicle"}
                onSelect={() => setBlockingType("vehicle")}
              />
            </div>
          </div>
        </div>

        {/* ── Vehicle Number Blocking section (same design as Driver; APIs will be connected later) ── */}
        {blockingType === "vehicle" && (
        <>
        {/* ── Vehicle Form Card ── */}
        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-5">
          <form onSubmit={handleVehicleSubmit}>
            {/* Input Fields Row: Vehicle Number, Reason, Blocking Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Vehicle Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="Enter vehicle number"
                  disabled={isVehicleSubmitting}
                  className="h-[34px] w-full rounded border border-input bg-background px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleReason}
                  onChange={(e) => setVehicleReason(e.target.value)}
                  placeholder="Enter reason"
                  disabled={isVehicleSubmitting}
                  className="h-[34px] w-full rounded border border-input bg-background px-3 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              </div>

              {/* Block / Unblock Toggle Switch (same as Driver) */}
              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <BlockToggle value={vehicleIsBlocked} onChange={setVehicleIsBlocked} disabled={isVehicleSubmitting} />
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-2">
              <button
                type="submit"
                disabled={isVehicleSubmitting}
                className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isVehicleSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Vehicle Data Table Card ── */}
        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-4">
          {/* Controls row: Show entries dropdown & Search input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-[12px] text-foreground">
              <span>Show</span>
              <select
                value={vehiclePageSize}
                onChange={(e) => {
                  setVehiclePageSize(Number(e.target.value));
                  setVehiclePage(1);
                }}
                className="h-7 px-2 rounded border border-hairline bg-surface text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-foreground">
              <span className="font-medium">Search:</span>
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => {
                  setVehicleSearch(e.target.value);
                  setVehiclePage(1);
                }}
                className="h-8 w-48 sm:w-56 px-2.5 rounded border border-hairline bg-surface text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-elegant">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b-2 border-[#7a1325] text-[#7a1325]">
                  <th className="py-2.5 px-3 text-left font-bold whitespace-nowrap">Vehicle Number</th>
                  <th className="py-2.5 px-3 text-left font-bold whitespace-nowrap">Reason</th>
                  <th className="py-2.5 px-3 text-center font-bold whitespace-nowrap w-36">Status</th>
                  <th className="py-2.5 px-3 text-center font-bold whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isVehicleTableLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-[12.5px]">
                      Loading vehicle records...
                    </td>
                  </tr>
                ) : pagedVehicles.length > 0 ? (
                  pagedVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-hairline hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-foreground font-semibold">
                        {vehicle.vehicleNumber || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{vehicle.reason || "—"}</td>

                      {/* Status indicator badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {vehicle.isBlocked ? (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Unblocked
                          </span>
                        )}
                      </td>

                      {/* Actions column with Edit & Delete buttons (same as Driver) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={!!deletingVehicleNumber}
                            onClick={() => handleVehicleEdit(vehicle)}
                            className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={!!deletingVehicleNumber}
                            onClick={() => handleVehicleDelete(vehicle)}
                            className="px-2.5 py-0.5 rounded bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                          >
                            {deletingVehicleNumber === vehicle.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : vehicleFetchError ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-rose-600 text-[12.5px]">
                      Failed to load vehicle records. Please click Refresh to try again.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-[12.5px]">
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-2 text-[12px] text-muted-foreground">
            <div>
              Showing {filteredVehicles.length === 0 ? 0 : vehicleStartIndex + 1} to{" "}
              {vehicleStartIndex + pagedVehicles.length} of {filteredVehicles.length} entries
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={vehicleCurrentPage <= 1}
                onClick={() => setVehiclePage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                Previous
              </button>
              <span className="text-[12px] px-1 font-medium">
                Page {vehicleCurrentPage} of {vehicleTotalPages}
              </span>
              <button
                type="button"
                disabled={vehicleCurrentPage >= vehicleTotalPages}
                onClick={() => setVehiclePage((p) => Math.min(vehicleTotalPages, p + 1))}
                className="px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </>
        )}

        {/* ── Driver Number Blocking section of the Blocking Master screen (existing, unchanged) ── */}
        {blockingType === "driver" && (
        <>
        {/* ── Top Form Card ── */}
        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-5">
          <form onSubmit={handleSubmit}>
            {/* Input Fields Row: Driver Name, Driver Number, Blocking Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Driver Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={DRIVER_NAME_MAX_LENGTH}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  disabled={isSubmitting}
                  className="h-[34px] w-full rounded border border-input bg-background px-3 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Driver Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={driverNumber}
                  onChange={(e) => setDriverNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter driver number"
                  disabled={isSubmitting}
                  className="h-[34px] w-full rounded border border-input bg-background px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
              </div>

              {/* Block / Unblock Toggle Switch */}
              <div>
                <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <BlockToggle value={isBlocked} onChange={setIsBlocked} disabled={isSubmitting} />
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Bottom Data Table Card (Populated only via API) ── */}
        <div className="bg-surface border border-hairline rounded-lg shadow-sm p-4">
          {/* Controls row: Show entries dropdown & Search input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-[12px] text-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 px-2 rounded border border-hairline bg-surface text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-foreground">
              <span className="font-medium">Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder=""
                className="h-8 w-48 sm:w-56 px-2.5 rounded border border-hairline bg-surface text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-elegant">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b-2 border-[#7a1325] text-[#7a1325]">
                  <th className="py-2.5 px-3 text-left font-bold whitespace-nowrap w-20">Sl.No</th>
                  <th className="py-2.5 px-3 text-left font-bold whitespace-nowrap">Driver Name</th>
                  <th className="py-2.5 px-3 text-left font-bold whitespace-nowrap">Driver Number</th>
                  <th className="py-2.5 px-3 text-center font-bold whitespace-nowrap w-36">Status</th>
                  <th className="py-2.5 px-3 text-center font-bold whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-[12.5px]">
                      Loading driver records...
                    </td>
                  </tr>
                ) : pagedDrivers.length > 0 ? (
                  pagedDrivers.map((driver, index) => {
                    const slNo = startIndex + index + 1;
                    const isDeleting = deletingNumber === driver.id;
                    return (
                      <tr
                        key={driver.id}
                        className="border-b border-hairline hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-muted-foreground font-mono">{slNo}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {driver.driverName || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-foreground font-semibold">
                          {driver.driverNumber || "—"}
                        </td>

                        {/* Status indicator badge */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {driver.isBlocked ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Unblocked
                            </span>
                          )}
                        </td>

                        {/* Actions column with Edit & Delete buttons matching reference design */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={!!deletingNumber}
                              onClick={() => handleEdit(driver)}
                              className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={!!deletingNumber}
                              onClick={() => handleDelete(driver)}
                              className="px-2.5 py-0.5 rounded bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : fetchError ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-rose-600 text-[12.5px]">
                      Failed to load driver records. Please click Refresh to try again.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-[12.5px]">
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-2 text-[12px] text-muted-foreground">
            <div>
              Showing {rangeStart} to {rangeEnd} of {totalEntries} entries
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                Previous
              </button>
              <span className="text-[12px] px-1 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* ── Edit Driver Modal / Popup ── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest(".swal2-container")) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Don't close the dialog when Esc is pressed to dismiss a Swal popup
            if (document.querySelector(".swal2-container")) e.preventDefault();
          }}
          className="p-0 overflow-hidden max-w-[500px] w-[95vw] border border-hairline rounded-xl shadow-xl bg-surface [&>button]:hidden"
        >
          {/* Header */}
          <div className="bg-[#0b2249] px-5 py-3.5 flex items-center justify-between text-white">
            <DialogTitle className="text-white font-semibold text-[15px] tracking-tight flex items-center gap-2">
              <ShieldAlert className="size-4 text-white/90" />
              Edit Driver Blocking Details
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleUpdateDriver} className="p-5 space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Driver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={DRIVER_NAME_MAX_LENGTH}
                value={editDriverName}
                readOnly
                title="Driver Name cannot be changed here."
                placeholder="Enter driver name"
                className="h-[34px] w-full rounded border border-input bg-muted px-3 text-[12px] text-foreground placeholder:text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Driver Number <span className="text-rose-500">*</span>
              </label>
              {/* Read-only: Driver Number is the SAP key; editing it would create a duplicate record */}
              <input
                type="tel"
                maxLength={10}
                value={editDriverNumber}
                readOnly
                title="Driver Number cannot be changed. Delete and re-create to change the number."
                placeholder="Enter driver number"
                className="h-[34px] w-full rounded border border-input bg-muted px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>

            {/* Block / Unblock Toggle Switch */}
            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <BlockToggle value={editIsBlocked} onChange={setEditIsBlocked} disabled={isUpdating} />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline mt-4">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-1.5 rounded border border-hairline bg-surface hover:bg-muted text-foreground text-[12px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Vehicle Modal / Popup (same design as Edit Driver) ── */}
      <Dialog open={isVehicleEditModalOpen} onOpenChange={setIsVehicleEditModalOpen}>
        <DialogContent
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest(".swal2-container")) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Don't close the dialog when Esc is pressed to dismiss a Swal popup
            if (document.querySelector(".swal2-container")) e.preventDefault();
          }}
          className="p-0 overflow-hidden max-w-[500px] w-[95vw] border border-hairline rounded-xl shadow-xl bg-surface [&>button]:hidden"
        >
          {/* Header */}
          <div className="bg-[#0b2249] px-5 py-3.5 flex items-center justify-between text-white">
            <DialogTitle className="text-white font-semibold text-[15px] tracking-tight flex items-center gap-2">
              <ShieldAlert className="size-4 text-white/90" />
              Edit Vehicle Blocking Details
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsVehicleEditModalOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleUpdateVehicle} className="p-5 space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              {/* Read-only: Vehicle Number is the key */}
              <input
                type="text"
                value={editVehicleNumber}
                readOnly
                title="Vehicle Number cannot be changed."
                className="h-[34px] w-full rounded border border-input bg-muted px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editVehicleReason}
                // Reason is editable in the Edit popup
                onChange={(e) => setEditVehicleReason(e.target.value)}
                placeholder="Enter reason"
                disabled={isVehicleUpdating}
                className="h-[34px] w-full rounded border border-input bg-background px-3 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
              />
            </div>

            {/* Block / Unblock Toggle Switch (the only editable field) */}
            <div>
              <label className="block text-[11.5px] font-semibold text-foreground mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <BlockToggle value={editVehicleIsBlocked} onChange={setEditVehicleIsBlocked} disabled={isVehicleUpdating} />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline mt-4">
              <button
                type="button"
                disabled={isVehicleUpdating}
                onClick={() => setIsVehicleEditModalOpen(false)}
                className="px-4 py-1.5 rounded border border-hairline bg-surface hover:bg-muted text-foreground text-[12px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVehicleUpdating}
                className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isVehicleUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}