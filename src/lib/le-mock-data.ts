export type Mode = "with-sap" | "without-sap";

export type WorklistRow = {
  id: string;
  slNo: number;
  mapId?: string;
  reference: string;
  workOrder: string;
  lrNumber: string;
  transporter: string;
  vehicleType?: string;
  noOfTrucks?: number;
  noOfInvoices?: number;
  vendorCode?: string;
  plant?: string;
  division?: string;
  noOfLRs?: number;
  loadingPoints?: string;
  unloadingPoints?: string;
  remarks?: string;
  status?: "Pending" | "Completed" | "In Progress";
};

export const sampleRows: WorklistRow[] = [
  {
    id: "1",
    slNo: 1,
    mapId: "200",
    reference: "1000000038",
    workOrder: "2346789",
    lrNumber: "6756557",
    transporter: "SAFEXPRESS PRIVATE LTD",
    vehicleType: "32 FT MXL",
    noOfTrucks: 2,
    noOfInvoices: 4,
    vendorCode: "V10024",
    plant: "HBL NCPP-SHPT",
    division: "NCPP",
    noOfLRs: 2,
    loadingPoints: "Shameerpet WH",
    unloadingPoints: "Jamnagar Refinery",
    remarks: "Priority despatch",
    status: "Pending",
  },
  {
    id: "2",
    slNo: 2,
    mapId: "201",
    reference: "1000000052",
    workOrder: "7676876",
    lrNumber: "75693",
    transporter: "ASSOCIATED ROAD CARRIERS",
    vehicleType: "20 FT Container",
    noOfTrucks: 1,
    noOfInvoices: 2,
    vendorCode: "V10112",
    plant: "HBL NCPP-SHPT",
    division: "NCPP",
    noOfLRs: 1,
    loadingPoints: "Nandigaon Plant",
    unloadingPoints: "Mundra Port",
    remarks: "Export",
    status: "Completed",
  },
  {
    id: "3",
    slNo: 3,
    mapId: "202",
    reference: "1000000056",
    workOrder: "435678",
    lrNumber: "76565454",
    transporter: "MRC LOGISTICS (INDIA) P LTD",
    vehicleType: "32 FT MXL HCV",
    noOfTrucks: 1,
    noOfInvoices: 3,
    vendorCode: "V10301",
    plant: "HBL VSP-SHPT",
    division: "VSP",
    noOfLRs: 1,
    loadingPoints: "Vizag Yard",
    unloadingPoints: "Bangalore DC",
    remarks: "Multi-drop",
    status: "Pending",
  },
  {
    id: "4",
    slNo: 4,
    mapId: "203",
    reference: "1000000061",
    workOrder: "9988770",
    lrNumber: "98832110",
    transporter: "TCI FREIGHT",
    vehicleType: "14 FT LCV",
    noOfTrucks: 1,
    noOfInvoices: 1,
    vendorCode: "V10455",
    plant: "HBL HYD-PLANT-04",
    division: "Industrial",
    noOfLRs: 1,
    loadingPoints: "Hyderabad WH",
    unloadingPoints: "Pune DC",
    remarks: "",
    status: "Pending",
  },
];

export const counts = { pending: 18, completed: 16 };