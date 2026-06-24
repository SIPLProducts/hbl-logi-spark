import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";


const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";
const REQ = <span className="text-rose-500 ml-0.5">*</span>;

export type UserFormValues = {
  userId: string;
  firstName: string;
  lastName: string;
  contact: string;
  email: string;
  category: string;
  employeeCode: string;
  inOutType: string;
  plants: string;
  divisions: string;
  role: string;
  screensCount: number;
  active: boolean;
};

const BLANK: UserFormValues = {
  userId: "2424",
  firstName: "",
  lastName: "",
  contact: "",
  email: "",
  category: "Internal",
  employeeCode: "",
  inOutType: "",
  plants: "",
  divisions: "",
  role: "",
  screensCount: 0,
  active: true,
};

export function CreateUserDialog({
  open,
  onOpenChange,
  mode = "create",
  initialValues,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: "create" | "edit";
  initialValues?: UserFormValues;
  onSuccess?: () => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [values, setValues] = useState<UserFormValues>(initialValues ?? BLANK);
  const [changePwd, setChangePwd] = useState(false);
  // const [users, setUsers] = useState([]);
  const [plantList, setPlantList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const isEdit = mode === "edit";
  const [screenPopup, setScreenPopup] = useState(false);
  const [plantPopup, setPlantPopup] = useState(false);
  const [divisionPopup, setDivisionPopup] = useState(false);

  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);



  const allScreens = [
    "Dispatch Orders",
    "Dispatch",
    "Order Info",
    "Shipment Details",
    "Invoice Load Details",
    "Segment Info",
    "Vehicle Info",
    "Transit Info",
    "Freight Billing",
    "Service Level",
    "Transit Damage Info",
    "Insurance Claim Tracking",
    "User Creation",
  ];

  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);


  const fetchPlantCodeList = async () => {
    try {
      const res = await service.fetchVendorCode();

      if (res && res[0]?.PLANT) {
        const plants = res[0].PLANT;

        setPlantList(plants);

        const uniqueDivisions = [
          ...new Map(
            plants.map((item: any) => [item.DIVISION, item])
          ).values(),
        ];

        setDivisionList(uniqueDivisions);
      } else {
        alert("No Plant Found");
      }
    } catch (error) {
      console.error("Error fetching plants:", error);
      alert("Error fetching plants");
    }
  };
  const togglePlantDropdown = () => {
    setShowPlantDropdown(!showPlantDropdown);
  };
  const toggleDivisionDropdown = () => {
    setShowDivisionDropdown(!showDivisionDropdown);
  };
  const onPlantToggle = (plant: string, checked: boolean) => {
    let updatedPlants: string[];

    if (checked) {
      updatedPlants = [...selectedPlants, plant];
    } else {
      updatedPlants = selectedPlants.filter((p) => p !== plant);
    }

    setSelectedPlants(updatedPlants);

    setValues((prev) => ({
      ...prev,
      plants: updatedPlants.join(","),
    }));

    // Division filter
    const divisions = plantList
      .filter((p: any) => updatedPlants.includes(p.PLANT))
      .map((p: any) => ({
        DIVISION: p.DIVISION,
        PLANT: p.PLANT,
      }));

    const uniqueDivisions = [
      ...new Map(
        divisions.map((item: any) => [item.DIVISION, item])
      ).values(),
    ];

    setDivisionList(uniqueDivisions);
  };
  const onDivisionToggle = (
    division: string,
    checked: boolean
  ) => {
    let updatedDivisions: string[];

    if (checked) {
      updatedDivisions = [...selectedDivisions, division];
    } else {
      updatedDivisions = selectedDivisions.filter(
        (d) => d !== division
      );
    }

    setSelectedDivisions(updatedDivisions);

    setValues((prev) => ({
      ...prev,
      divisions: updatedDivisions.join(","),
    }));
  };


  // const getUsers = async () => {
  //   try {
  //     const res = await service.UserCreationDisplayTable();

  //     console.log("Display API Response:", res);

  //     const data = res.map((u: any) => ({
  //       USER: u.USER,
  //       FIRST_NAME: u.FIRST_NAME,
  //       LAST_NAME: u.LAST_NAME,
  //       EMAIL: u.EMAIL,
  //       CONTACT: u.CONTACT,
  //       PASSWORD: u.PASSWORD,
  //       EMP_CODE: String(u.EMP_CODE),
  //       INOUT_TYPE: u.INOUT_TYPE,
  //       CATEGORY: u.CATEGORY,
  //       STATUS: u.STATUS === "ACTIVE" ? "Active" : u.STATUS,
  //       ROLES: u.TYUSER,
  //       PLANTS: u.PLANTS || [],
  //       DIVISIONS: u.DIVISIONS || [],
  //      ACTIVITIES: u.ACTIVITY?.map((a: any) => a.ACT) || [],
  //     }));

  //     setUsers(data);
  //   } catch (error) {
  //     console.error("Display API Error:", error);
  //   }
  // };


  // useEffect(() => {
  //   getUsers();
  //   fetchPlantCodeList();
  //   if (open) {
  //     setValues(initialValues ?? BLANK);
  //     setChangePwd(false);
  //     setShowPwd(false);
  //     setShowConfirm(false);
  //   }
  // }, [open, initialValues]);

  useEffect(() => {
    fetchPlantCodeList();

    if (open) {
      setValues(initialValues ?? BLANK);
      setChangePwd(false);
      setShowPwd(false);
      setShowConfirm(false);
    }
  }, [open, initialValues]);


  const pwdDisabled = isEdit && !changePwd;
  const set = <K extends keyof UserFormValues>(k: K, v: UserFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));
  const CreateUser = async () => {
    const payload = {
      CREATE: {
        USER: values.userId,
        FIRST_NAME: values.firstName,
        LAST_NAME: values.lastName,
        EMAIL: values.email,
        CONTACT: values.contact,
        PASSWORD: "password12",
        EMP_CODE: values.employeeCode,
        INOUT_TYPE: values.inOutType,
        CATEGORY: values.category,
        TYUSER: values.role,
        STATUS: values.active ? "ACTIVE" : "INACTIVE",
        // PLANTS: values.plants
        //   ? [{
        //     WERKS: values.plants
        //   }]
        //   : [],
        PLANTS: selectedPlants.map((plant) => ({
          WERKS: plant,
        })),

        // DIVISIONS: values.divisions
        //   ? values.divisions.split(",").map((d) => ({
        //     WERKS: "",
        //     DIVISIONS: d.trim(),
        //   }))
        //   : [],
        DIVISIONS: selectedDivisions.map((division) => ({
          WERKS: "",
          DIVISIONS: division,
        })),

        ACTIVITY: selectedScreens.map((screen) => ({
          ACT: screen,
        })),
      },
    };

    try {
      console.log("Payload:", payload);

      const response = await service.GlobalUserAuth(payload);
      onSuccess?.();

      console.log("API Response:", response);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: isEdit
          ? "User updated successfully"
          : "User created successfully",
        confirmButtonColor: "#7a1325",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to save user");
    }
  };
  const updateUser = async () => {
    const payload = {
      EDIT: {
        USER: values.userId,
        FIRST_NAME: values.firstName,
        LAST_NAME: values.lastName,
        EMAIL: values.email,
        CONTACT: values.contact,
        PASSWORD: "password12",
        STATUS: values.active ? "ACTIVE" : "INACTIVE",
        EMP_CODE: values.employeeCode,
        INOUT_TYPE: values.inOutType,
        TYUSER: values.role,
        CATEGORY: values.category,

        // PLANTS: values.plants
        //   ? [
        //     {
        //       WERKS: values.plants,
        //     },
        //   ]
        //   : [],
        PLANTS: selectedPlants.map((plant) => ({
          WERKS: plant,
        })),

        // DIVISIONS: values.divisions
        //   ? values.divisions.split(",").map((d) => ({
        //     WERKS: "",
        //     DIVISIONS: d.trim(),
        //   }))
        //   : [],
        DIVISIONS: selectedDivisions.map((division) => ({
          WERKS: "",
          DIVISIONS: division,
        })),

        ACTIVITY: selectedScreens.map((screen) => ({
          ACT: screen,
        })),
      },
    };

    try {
      const res = await service.GlobalUserAuth(payload);

      Swal.fire(
        "Success",
        "User updated successfully",
        "success"
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update user", "error");
    }
  };




  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-visible max-w-[760px] w-[95vw] border-0 [&>button]:hidden"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-5 py-3.5 flex items-center justify-between">
          <DialogTitle className="text-white font-semibold text-[15px] tracking-tight">
            {isEdit ? "Edit User" : "Create New User"}
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
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2 bg-surface overflow-visible">
          <Field label={<>User ID{REQ}</>}>
            <input value={values.userId} onChange={(e) => set("userId", e.target.value)} className={INPUT} />
          </Field>
          <Field label={<>First Name{REQ}</>}>
            <input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Enter first name" className={INPUT} />
          </Field>
          <Field label="Last Name">
            <input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Enter last name" className={INPUT} />
          </Field>

          <Field label={<>Contact{REQ}</>}>
            <input value={values.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Enter contact number" className={INPUT} />
          </Field>
          <Field label={<>Email{REQ}</>}>
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="Enter email address" className={INPUT} />
          </Field>
          <Field label="Category">
            <select value={values.category} onChange={(e) => set("category", e.target.value)} className={INPUT}>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </Field>

          <Field label={<>Password{REQ}</>}>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                defaultValue={isEdit ? "••••••••••" : "password12"}
                disabled={pwdDisabled}
                className={INPUT + " pr-9" + (pwdDisabled ? " bg-muted cursor-not-allowed" : "")}
                key={`pwd-${changePwd}`}
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
                defaultValue={isEdit && !changePwd ? "••••••••••" : ""}
                placeholder="Enter password"
                disabled={pwdDisabled}
                className={INPUT + " pr-9" + (pwdDisabled ? " bg-muted cursor-not-allowed" : "")}
                key={`cpwd-${changePwd}`}
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
            <input value={values.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} placeholder="Enter employee code" className={INPUT} />
          </Field>

          <Field label={<>In/Out Type{REQ}</>}>
            <select value={values.inOutType} onChange={(e) => set("inOutType", e.target.value)} className={INPUT}>
              <option value="" disabled></option>
              <option value="Inward">Inward</option>
              <option value="Outward">Outward</option>
            </select>
          </Field>
          {/* <Field label="Plants">
            <select
              value={values.plants}
              onChange={(e) => set("plants", e.target.value)}
              className={INPUT}
            >
              <option value="">Select Plant</option>

              {plantList.map((plant: any, index) => (
                <option key={index} value={plant.PLANT}>
                  {plant.PLANT}
                </option>
              ))}
            </select>
          </Field> */}
          <Field label="Plants">
            <div className="relative">

              <button
                type="button"
                onClick={togglePlantDropdown}
                className={`${INPUT} flex justify-between items-center text-left`}
              >
                <span>
                  {selectedPlants.length > 0
                    ? `${selectedPlants.length} Plants Selected`
                    : "Select Plants"}
                </span>

                <span>
                  {showPlantDropdown ? "▲" : "▼"}
                </span>
              </button>

              {showPlantDropdown && (
                <div className="absolute top-full left-0 z-[9999] mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">

                  {plantList.map((plant: any, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlants.includes(
                          plant.PLANT
                        )}
                        onChange={(e) =>
                          onPlantToggle(
                            plant.PLANT,
                            e.target.checked
                          )
                        }
                      />

                      {plant.PLANT}
                    </label>
                  ))}

                </div>
              )}

            </div>
          </Field>
          {/* <Field label="Divisions">
            <select
              value={values.divisions}
              onChange={(e) => set("divisions", e.target.value)}
              className={INPUT}
            >
              <option value="">Select Division</option>

              {divisionList.map((division: any, index) => (
                <option key={index} value={division.DIVISION}>
                  {division.DIVISION}
                </option>
              ))}
            </select>
          </Field> */}
          <Field label="Divisions">
            <div className="relative">

              <button
                type="button"
                onClick={toggleDivisionDropdown}
                className={`${INPUT} flex justify-between items-center text-left`}
              >
                <span>
                  {selectedDivisions.length > 0
                    ? `${selectedDivisions.length} Divisions Selected`
                    : "Select Divisions"}
                </span>

                <span>
                  {showDivisionDropdown ? "▲" : "▼"}
                </span>
              </button>

              {showDivisionDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">

                  {divisionList.map(
                    (division: any, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDivisions.includes(
                            division.DIVISION
                          )}
                          onChange={(e) =>
                            onDivisionToggle(
                              division.DIVISION,
                              e.target.checked
                            )
                          }
                        />

                        {division.DIVISION}
                      </label>
                    )
                  )}

                </div>
              )}

            </div>
          </Field>

          <Field label="Role">
            <select value={values.role} onChange={(e) => set("role", e.target.value)} className={INPUT}>
              <option value="" disabled></option>
              <option value="ADMIN">ADMIN</option>
              <option value="LE Operator">LE Operator</option>
              <option value="Approver">Approver</option>
              <option value="Viewer">Viewer</option>
            </select>
          </Field>
          <Field label="Activities (Screens)">
            <button
              type="button"
              onClick={() => setScreenPopup(true)}
              className="h-9 px-4 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-[12.5px] font-semibold shadow-sm"
            >
              Select Screens ({selectedScreens.length})
            </button>
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2 h-9">
              <span
                className={
                  "px-2.5 py-1 rounded text-[11px] font-semibold " +
                  (!values.active ? "bg-muted text-foreground" : "text-muted-foreground")
                }
              >
                Inactive
              </span>
              <button
                type="button"
                onClick={() => set("active", !values.active)}
                className={
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors " +
                  (values.active ? "bg-emerald-500" : "bg-muted")
                }
                aria-pressed={values.active}
              >
                <span
                  className={
                    "inline-block size-4 transform rounded-full bg-white shadow transition-transform " +
                    (values.active ? "translate-x-[18px]" : "translate-x-0.5")
                  }
                />
              </button>
              <span
                className={
                  "px-2.5 py-1 rounded text-[11px] font-semibold " +
                  (values.active ? "bg-emerald-500 text-white" : "text-muted-foreground")
                }
              >
                Active
              </span>
            </div>
          </Field>
        </div>

        {isEdit && (
          <div className="px-6 pb-4 bg-surface">
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={changePwd}
                onChange={(e) => setChangePwd(e.target.checked)}
                className="size-3.5 rounded border-input accent-indigo-600"
              />
              Change Password
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline flex justify-end bg-surface">
          <button
            onClick={isEdit ? updateUser : CreateUser}
            className="h-9 px-6 rounded-md bg-[#7a1325] hover:bg-[#92172d] text-white text-[12.5px] font-semibold shadow-sm"
          >
            {isEdit ? "Update" : "Create"}
          </button>
        </div>

      </DialogContent>
      <Dialog
        open={screenPopup}
        modal={true}
        onOpenChange={(open) => {
          setScreenPopup(open);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-2xl h-[80vh] p-0 overflow-hidden rounded-2xl"
        >

          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <h2 className="text-xl font-bold">Select Screens</h2>
            <p className="text-sm text-indigo-100">
              Choose screens for this user
            </p>
          </div>

          {/* Selected Count */}
          <div className="px-6 py-3 border-b flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Available Screens
            </span>

            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              Selected: {selectedScreens.length}
            </span>
          </div>

          {/* Screen List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3">

              {allScreens.map((screen) => (
                <label
                  key={screen}
                  className={`
              flex items-center gap-3
              p-3 rounded-xl border cursor-pointer
              transition-all duration-200
              ${selectedScreens.includes(screen)
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    }
            `}
                >
                  <input
                    type="checkbox"
                    checked={selectedScreens.includes(screen)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedScreens([...selectedScreens, screen]);
                      } else {
                        setSelectedScreens(
                          selectedScreens.filter((s) => s !== screen)
                        );
                      }
                    }}
                    className="h-4 w-4 accent-indigo-600"
                  />

                  <span className="text-sm font-medium">
                    {screen}
                  </span>
                </label>
              ))}

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50">
            <span className="text-sm text-gray-500">
              {selectedScreens.length} screens selected
            </span>

            <div className="flex gap-3">
              <button
                onClick={() => setScreenPopup(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  console.log("Selected Screens:", selectedScreens);

                  set("screensCount", selectedScreens.length);

                  setTimeout(() => {
                    setScreenPopup(false);
                  }, 100);
                }}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                Save Selection
              </button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
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