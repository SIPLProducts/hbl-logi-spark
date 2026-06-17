export type DispatchRow = {
  id: string;
  slNo: number;
  vehicleType: string;
  workOrder: string;
  noOfTrucks: number;
  noOfInvoices: number;
  vendorCode: string;
  transporter: string;
  plant: string;
  division: string;
  noOfLRs: number;
  lrNumber: string;
  loadingPoints: string;
  unloadingPoints: string;
  remarks: string;
};

export type DispatchResultRow = {
  id: string;
  slNo: number;
  referenceNo: string;
  lineNo: number;
  date: string;
  plant: string;
  division: string;
  vehicleType: string;
  noOfTrucks: number;
  workOrder: string;
  vendorCode: string;
  transporter: string;
  noOfLRs: number;
  lrNumber: string;
  loadingPoint: string;
  unloadingPoint: string;
  noOfInvoices: number;
  createdDate: string;
};

export const PLANTS = ["1100 - Shamirpet", "1200 - Vizag", "1300 - Bhopal", "1400 - Nandigaon"];
export const DIVISIONS = ["10 - Industrial", "20 - Telecom", "30 - Defence", "40 - Solar"];
export const TRANSPORTERS = ["TCI Express", "Safexpress", "VRL Logistics", "Gati KWE", "Delhivery"];
export const VEHICLE_TYPES = [
  "CARGO",
  "RATE CONTRACT",
  "LOCAL TRANSPORTATION",
  "CUSTOMER TRANSPORTER",
  "COMPANY VEHICLE",
  "COURIER",
  "BY HAND",
  "FULL TRUCK LOAD",
];
export const SEARCH_TYPES = ["Search","Reference Number", "LR Number", "Transporter", "Work Order"];

export const emptyDispatchRow = (slNo: number): DispatchRow => ({
  id: `r-${slNo}-${Math.random().toString(36).slice(2, 8)}`,
  slNo,
  vehicleType: "",
  workOrder: "",
  noOfTrucks: 0,
  noOfInvoices: 0,
  vendorCode: "",
  transporter: "",
  plant: "",
  division: "",
  noOfLRs: 0,
  lrNumber: "",
  loadingPoints: "",
  unloadingPoints: "",
  remarks: "",
});

export const sampleDispatchRows: DispatchRow[] = [
  {
    id: "r-1",
    slNo: 1,
    vehicleType: "FULL TRUCK LOAD",
    workOrder: "WO-2026-00412",
    noOfTrucks: 2,
    noOfInvoices: 4,
    vendorCode: "V-1004",
    transporter: "TCI Express",
    plant: "1100 - Shamirpet",
    division: "20 - Telecom",
    noOfLRs: 4,
    lrNumber: "LR-784512",
    loadingPoints: "Shamirpet · Bay 3",
    unloadingPoints: "Pune · DC-2",
    remarks: "Convoy of 2 trucks",
  },
  {
    id: "r-2",
    slNo: 2,
    vehicleType: "CARGO",
    workOrder: "WO-2026-00418",
    noOfTrucks: 1,
    noOfInvoices: 2,
    vendorCode: "V-2210",
    transporter: "Safexpress",
    plant: "1200 - Vizag",
    division: "30 - Defence",
    noOfLRs: 2,
    lrNumber: "LR-784518",
    loadingPoints: "Vizag · Yard 1",
    unloadingPoints: "Chennai · Port",
    remarks: "ODC permit attached",
  },
];

export const sampleResultRows: DispatchResultRow[] = Array.from({ length: 26 }).map((_, i) => {
  const p = PLANTS[i % PLANTS.length];
  const d = DIVISIONS[i % DIVISIONS.length];
  const v = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
  const t = TRANSPORTERS[i % TRANSPORTERS.length];
  const day = ((i % 28) + 1).toString().padStart(2, "0");
  return {
    id: `disp-${i + 1}`,
    slNo: i + 1,
    referenceNo: `REF-2026-${(10045 + i).toString().padStart(5, "0")}`,
    lineNo: (i % 5) + 1,
    date: `2026-06-${day}`,
    plant: p,
    division: d,
    vehicleType: v,
    noOfTrucks: (i % 3) + 1,
    workOrder: `WO-2026-${(412 + i).toString().padStart(5, "0")}`,
    vendorCode: `V-${(1000 + i * 7).toString()}`,
    transporter: t,
    noOfLRs: (i % 4) + 1,
    lrNumber: `LR-${(784512 + i).toString()}`,
    loadingPoint: `${p.split(" - ")[1]} · Bay ${(i % 5) + 1}`,
    unloadingPoint: ["Pune · DC-2", "Chennai · Port", "Delhi · Hub", "Bengaluru · Yard"][i % 4],
    noOfInvoices: (i % 6) + 1,
    createdDate: `2026-05-${day}`,
  };
});