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

