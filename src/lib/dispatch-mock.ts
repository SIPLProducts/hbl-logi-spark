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
  invoiceNo: string;
  invoiceDate: string;
  billingTransactionType: string;
  material: string;
  description: string;
  plant: string;
  plantName: string;
  division: string;
  divisionText: string;
  basicShipmentValue: number;
  invoiceValueWithGst: number;
  incoterms: string;
};

export const PLANTS = ["1100 - Shamirpet", "1200 - Vizag", "1300 - Bhopal", "1400 - Nandigaon"];
export const DIVISIONS = ["10 - Industrial", "20 - Telecom", "30 - Defence", "40 - Solar"];
export const TRANSPORTERS = ["TCI Express", "Safexpress", "VRL Logistics", "Gati KWE", "Delhivery"];
export const VEHICLE_TYPES = ["Tata 407", "Eicher 14ft", "Ashok Leyland 20ft", "Container 32ft", "Trailer 40ft"];
export const SEARCH_TYPES = ["Reference", "Invoice", "ODN", "SO Number", "Work Order"];

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
    vehicleType: "Container 32ft",
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
    vehicleType: "Trailer 40ft",
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
  const plants = PLANTS;
  const divs = DIVISIONS;
  const p = plants[i % plants.length];
  const d = divs[i % divs.length];
  return {
    id: `inv-${i + 1}`,
    invoiceNo: `90021${(5479 + i).toString().padStart(4, "0")}`,
    invoiceDate: `2026-06-${((i % 28) + 1).toString().padStart(2, "0")}`,
    billingTransactionType: i % 3 === 0 ? "ZDOM" : i % 3 === 1 ? "ZEXP" : "ZSTO",
    material: `MAT-${(100200 + i).toString()}`,
    description: ["VRLA Battery 12V/100Ah", "Tubular Battery 2V/1000Ah", "Lithium Pack 48V", "NiCd Pack 24V"][i % 4],
    plant: p.split(" - ")[0],
    plantName: p.split(" - ")[1],
    division: d.split(" - ")[0],
    divisionText: d.split(" - ")[1],
    basicShipmentValue: 125000 + i * 3120,
    invoiceValueWithGst: 147500 + i * 3680,
    incoterms: ["FOR", "EXW", "CIF", "DAP"][i % 4],
  };
});