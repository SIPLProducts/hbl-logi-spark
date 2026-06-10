export type Priority = "Critical" | "High" | "Standard" | "Low";

export type InboundDelivery = {
  id: string;
  vendor: string;
  vendorCode: string;
  items: string;
  itemCount: number;
  dock: string;
  status:
    | "Expected"
    | "Arrived"
    | "Gate-In"
    | "Unloaded"
    | "Putaway Complete"
    | "Exception";
  priority: Priority;
  eta: string;
  plant: string;
};

export const inboundDeliveries: InboundDelivery[] = [
  {
    id: "DEL-900210",
    vendor: "Exide Components Ltd.",
    vendorCode: "V-100245",
    items: "Lead Plates (24 ea)",
    itemCount: 24,
    dock: "D-04",
    status: "Arrived",
    priority: "Standard",
    eta: "14:20",
    plant: "HYD-PLANT-04",
  },
  {
    id: "DEL-900215",
    vendor: "HBL Chemical Division",
    vendorCode: "V-100100",
    items: "Electrolyte (4000 L)",
    itemCount: 1,
    dock: "D-12",
    status: "Gate-In",
    priority: "Critical",
    eta: "15:45",
    plant: "HYD-PLANT-04",
  },
  {
    id: "DEL-900218",
    vendor: "Reliance Power Inc.",
    vendorCode: "V-100410",
    items: "Battery casings (200)",
    itemCount: 200,
    dock: "D-01",
    status: "Exception",
    priority: "Critical",
    eta: "EXP",
    plant: "HYD-PLANT-04",
  },
  {
    id: "DEL-900221",
    vendor: "Shree Metals",
    vendorCode: "V-100502",
    items: "Copper terminals (1200)",
    itemCount: 1200,
    dock: "D-07",
    status: "Expected",
    priority: "Low",
    eta: "16:45",
    plant: "HYD-PLANT-04",
  },
  {
    id: "DEL-900225",
    vendor: "Tata AutoComp",
    vendorCode: "V-100610",
    items: "Plastic separators (45)",
    itemCount: 45,
    dock: "D-02",
    status: "Unloaded",
    priority: "High",
    eta: "11:00",
    plant: "HYD-PLANT-04",
  },
  {
    id: "DEL-900233",
    vendor: "Indus Cables Pvt.",
    vendorCode: "V-100712",
    items: "Connector cables (840)",
    itemCount: 840,
    dock: "D-09",
    status: "Putaway Complete",
    priority: "Standard",
    eta: "09:15",
    plant: "HYD-PLANT-04",
  },
];

export type AsnRecord = {
  id: string;
  poRef: string;
  vendor: string;
  expectedDate: string;
  items: number;
  status: "Expected" | "Arrived" | "Cancelled";
};

export const asnRecords: AsnRecord[] = [
  {
    id: "ASN-44012",
    poRef: "PO-7842910",
    vendor: "Exide Components Ltd.",
    expectedDate: "2026-06-10",
    items: 12,
    status: "Expected",
  },
  {
    id: "ASN-44018",
    poRef: "PO-7842935",
    vendor: "Tata AutoComp",
    expectedDate: "2026-06-10",
    items: 45,
    status: "Arrived",
  },
  {
    id: "ASN-44022",
    poRef: "PO-7842950",
    vendor: "Shree Metals",
    expectedDate: "2026-06-11",
    items: 200,
    status: "Expected",
  },
  {
    id: "ASN-44028",
    poRef: "PO-7842962",
    vendor: "Indus Cables Pvt.",
    expectedDate: "2026-06-09",
    items: 840,
    status: "Arrived",
  },
  {
    id: "ASN-44031",
    poRef: "PO-7842970",
    vendor: "Reliance Power Inc.",
    expectedDate: "2026-06-11",
    items: 200,
    status: "Cancelled",
  },
];

export type PutawayTask = {
  id: string;
  sourceBin: string;
  destBin: string;
  material: string;
  batch: string;
  qty: number;
  status: "Open" | "In Progress" | "Completed" | "Blocked";
};

export const putawayTasks: PutawayTask[] = [
  {
    id: "PUT-55100",
    sourceBin: "GR-DOCK-04",
    destBin: "RM-A-12-04",
    material: "Lead Plate 12V",
    batch: "B-2026-0410",
    qty: 24,
    status: "Open",
  },
  {
    id: "PUT-55104",
    sourceBin: "GR-DOCK-02",
    destBin: "RM-B-04-02",
    material: "Plastic Separator A",
    batch: "B-2026-0411",
    qty: 45,
    status: "In Progress",
  },
  {
    id: "PUT-55109",
    sourceBin: "GR-DOCK-09",
    destBin: "RM-C-08-01",
    material: "Connector Cable 6mm",
    batch: "B-2026-0405",
    qty: 840,
    status: "Completed",
  },
  {
    id: "PUT-55112",
    sourceBin: "GR-DOCK-01",
    destBin: "RM-A-02-06",
    material: "Battery Casing 150Ah",
    batch: "B-2026-0412",
    qty: 200,
    status: "Blocked",
  },
];

export type OutboundDelivery = {
  id: string;
  customer: string;
  customerCode: string;
  destination: string;
  items: number;
  etd: string;
  status: "Created" | "Picking" | "Picked" | "Packed" | "Goods Issued" | "Shipped";
  priority: Priority;
  shippingPoint: string;
  route: string;
};

export const outboundDeliveries: OutboundDelivery[] = [
  {
    id: "DLV-882910",
    customer: "Titan Energy Grid",
    customerCode: "C-30121",
    destination: "Hyderabad Hub · Gate 4",
    items: 12,
    etd: "Today, 16:00",
    status: "Picking",
    priority: "Critical",
    shippingPoint: "SP-HYD-01",
    route: "RT-SOUTH-04",
  },
  {
    id: "DLV-882914",
    customer: "Reliance Power Infra",
    customerCode: "C-30188",
    destination: "Mumbai Port · Terminal 2",
    items: 48,
    etd: "Tomorrow, 09:00",
    status: "Created",
    priority: "Standard",
    shippingPoint: "SP-HYD-01",
    route: "RT-WEST-02",
  },
  {
    id: "DLV-882921",
    customer: "Indus Towers Ltd.",
    customerCode: "C-30222",
    destination: "Delhi NCR Distribution",
    items: 6,
    etd: "Today, 18:30",
    status: "Packed",
    priority: "High",
    shippingPoint: "SP-HYD-02",
    route: "RT-NORTH-01",
  },
  {
    id: "DLV-882928",
    customer: "Adani Defence",
    customerCode: "C-30310",
    destination: "Ahmedabad Yard",
    items: 24,
    etd: "Today, 20:00",
    status: "Picked",
    priority: "High",
    shippingPoint: "SP-HYD-01",
    route: "RT-WEST-04",
  },
  {
    id: "DLV-882935",
    customer: "Indian Railways",
    customerCode: "C-30401",
    destination: "Chennai Depot",
    items: 120,
    etd: "2026-06-11, 06:00",
    status: "Goods Issued",
    priority: "Standard",
    shippingPoint: "SP-HYD-02",
    route: "RT-SOUTH-02",
  },
  {
    id: "DLV-882942",
    customer: "BSNL Networks",
    customerCode: "C-30502",
    destination: "Pune Distribution",
    items: 18,
    etd: "Today, 22:00",
    status: "Shipped",
    priority: "Low",
    shippingPoint: "SP-HYD-01",
    route: "RT-WEST-02",
  },
];

export type PickTask = {
  id: string;
  warehouseTask: string;
  sourceBin: string;
  material: string;
  materialCode: string;
  batch: string;
  qty: number;
  confirmedQty: number;
  status: "Open" | "In Progress" | "Completed" | "Blocked";
};

export const pickTasks: PickTask[] = [
  {
    id: "PCK-99101",
    warehouseTask: "WT-44021",
    sourceBin: "FG-A-12-04",
    material: "Lead-Acid 12V 150Ah Industrial",
    materialCode: "BATT-LA12-150X",
    batch: "B-2026-0501",
    qty: 4,
    confirmedQty: 0,
    status: "Open",
  },
  {
    id: "PCK-99104",
    warehouseTask: "WT-44021",
    sourceBin: "FG-A-12-05",
    material: "Lead-Acid 12V 200Ah Industrial",
    materialCode: "BATT-LA12-200X",
    batch: "B-2026-0502",
    qty: 2,
    confirmedQty: 2,
    status: "Completed",
  },
  {
    id: "PCK-99107",
    warehouseTask: "WT-44024",
    sourceBin: "FG-B-06-01",
    material: "Lithium-Ion 48V Rack",
    materialCode: "BATT-LI48-RACK",
    batch: "B-2026-0480",
    qty: 6,
    confirmedQty: 3,
    status: "In Progress",
  },
  {
    id: "PCK-99115",
    warehouseTask: "WT-44028",
    sourceBin: "FG-C-04-02",
    material: "Nickel-Cadmium 110V Modular",
    materialCode: "BATT-NC110-M",
    batch: "B-2026-0492",
    qty: 12,
    confirmedQty: 0,
    status: "Blocked",
  },
];

export type PackingTask = {
  id: string;
  delivery: string;
  hu: string;
  packedQty: number;
  grossWeight: string;
  status: "Open" | "In Progress" | "Complete";
};

export const packingTasks: PackingTask[] = [
  {
    id: "PAK-30021",
    delivery: "DLV-882910",
    hu: "HU-7842091",
    packedQty: 12,
    grossWeight: "428 kg",
    status: "In Progress",
  },
  {
    id: "PAK-30025",
    delivery: "DLV-882921",
    hu: "HU-7842108",
    packedQty: 6,
    grossWeight: "112 kg",
    status: "Complete",
  },
  {
    id: "PAK-30028",
    delivery: "DLV-882928",
    hu: "HU-7842121",
    packedQty: 24,
    grossWeight: "612 kg",
    status: "Open",
  },
];

export type GoodsIssue = {
  id: string;
  delivery: string;
  giDate: string;
  material: string;
  batch: string;
  qty: number;
  status: "Pending" | "Posted" | "Blocked";
};

export const goodsIssues: GoodsIssue[] = [
  {
    id: "GI-77001",
    delivery: "DLV-882935",
    giDate: "2026-06-10 12:14",
    material: "Lead-Acid 12V 150Ah",
    batch: "B-2026-0501",
    qty: 120,
    status: "Posted",
  },
  {
    id: "GI-77004",
    delivery: "DLV-882942",
    giDate: "2026-06-10 13:45",
    material: "Lithium-Ion 48V Rack",
    batch: "B-2026-0480",
    qty: 18,
    status: "Posted",
  },
  {
    id: "GI-77011",
    delivery: "DLV-882921",
    giDate: "—",
    material: "Nickel-Cadmium 110V",
    batch: "B-2026-0492",
    qty: 6,
    status: "Pending",
  },
  {
    id: "GI-77014",
    delivery: "DLV-882928",
    giDate: "—",
    material: "Lead-Acid 12V 200Ah",
    batch: "B-2026-0502",
    qty: 24,
    status: "Blocked",
  },
];

export type Shipment = {
  id: string;
  route: string;
  carrier: string;
  vehicle: string;
  driver: string;
  stops: number;
  status:
    | "Planned"
    | "Checked-In"
    | "Loaded"
    | "Departed"
    | "In Transit"
    | "Delivered";
  departure: string;
  arrival: string;
};

export const shipments: Shipment[] = [
  {
    id: "SHP-22011",
    route: "Hyderabad → Mumbai",
    carrier: "TCI Express",
    vehicle: "TS-09-EX-4421",
    driver: "M. Ramesh",
    stops: 4,
    status: "In Transit",
    departure: "2026-06-10 06:20",
    arrival: "2026-06-11 22:00",
  },
  {
    id: "SHP-22014",
    route: "Hyderabad → Delhi",
    carrier: "Safexpress",
    vehicle: "TS-09-SX-1190",
    driver: "A. Kumar",
    stops: 6,
    status: "Loaded",
    departure: "2026-06-10 14:00",
    arrival: "2026-06-12 18:00",
  },
  {
    id: "SHP-22017",
    route: "Hyderabad → Chennai",
    carrier: "Gati Ltd.",
    vehicle: "TS-09-GT-7711",
    driver: "P. Murugan",
    stops: 3,
    status: "Planned",
    departure: "2026-06-11 05:00",
    arrival: "2026-06-11 21:00",
  },
  {
    id: "SHP-22020",
    route: "Hyderabad → Pune",
    carrier: "BlueDart Logistics",
    vehicle: "TS-09-BD-3349",
    driver: "S. Patil",
    stops: 2,
    status: "Delivered",
    departure: "2026-06-09 23:00",
    arrival: "2026-06-10 18:30",
  },
  {
    id: "SHP-22023",
    route: "Hyderabad → Ahmedabad",
    carrier: "VRL Logistics",
    vehicle: "TS-09-VR-8821",
    driver: "K. Patel",
    stops: 4,
    status: "Departed",
    departure: "2026-06-10 10:30",
    arrival: "2026-06-12 06:00",
  },
];

export type Stop = {
  seq: number;
  location: string;
  planned: string;
  actual: string;
  status: "Pending" | "Arrived" | "Departed" | "Delivered";
};

export const stopsForShipment: Record<string, Stop[]> = {
  "SHP-22011": [
    { seq: 1, location: "Hyderabad Plant 04", planned: "06:20", actual: "06:18", status: "Departed" },
    { seq: 2, location: "Solapur Hub", planned: "16:00", actual: "16:42", status: "Departed" },
    { seq: 3, location: "Pune Cross-Dock", planned: "23:30", actual: "—", status: "Pending" },
    { seq: 4, location: "Mumbai Terminal 2", planned: "22:00", actual: "—", status: "Pending" },
  ],
};

// Inbound delivery line items (for detail)
export const inboundLineItems = [
  {
    id: "10",
    item: "10",
    material: "PLT-LEAD-12V-OEM",
    description: "Lead Plate, 12V grade A",
    batch: "B-2026-0410",
    orderQty: 24,
    grQty: 24,
    uom: "EA",
    status: "Posted",
  },
  {
    id: "20",
    item: "20",
    material: "ELEC-H2SO4-4K",
    description: "Electrolyte H2SO4, 4000 L IBC",
    batch: "B-2026-0411",
    orderQty: 1,
    grQty: 0,
    uom: "IBC",
    status: "Pending",
  },
  {
    id: "30",
    item: "30",
    material: "CASE-PP-150AH",
    description: "Battery Casing, PP, 150Ah",
    batch: "B-2026-0412",
    orderQty: 200,
    grQty: 186,
    uom: "EA",
    status: "Exception",
  },
];

export const outboundLineItems = [
  {
    id: "10",
    item: "10",
    material: "BATT-LA12-150X",
    description: "Lead-Acid 12V 150Ah Industrial",
    batch: "B-2026-0501",
    orderQty: 4,
    pickQty: 4,
    giQty: 4,
    uom: "EA",
    status: "Posted",
  },
  {
    id: "20",
    item: "20",
    material: "BATT-LA12-200X",
    description: "Lead-Acid 12V 200Ah Industrial",
    batch: "B-2026-0502",
    orderQty: 6,
    pickQty: 6,
    giQty: 0,
    uom: "EA",
    status: "Picked",
  },
  {
    id: "30",
    item: "30",
    material: "BATT-LI48-RACK",
    description: "Lithium-Ion 48V Rack",
    batch: "B-2026-0480",
    orderQty: 2,
    pickQty: 1,
    giQty: 0,
    uom: "EA",
    status: "Picking",
  },
];