export type DispatchOrderRow = {
  id: string;
  invoiceNo: string;
  invoiceDate: string; // ISO yyyy-mm-dd
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

// Tiny seeded PRNG (mulberry32) so server + client produce identical rows.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TX_TYPES = ["ZDOM - Domestic", "ZEXP - Export", "ZSTO - Stock Transfer", "ZRET - Returns"];
const MATERIALS = [
  ["100000123", "Lead Acid Battery 12V 150Ah"],
  ["100000245", "VRLA Battery 2V 1000Ah"],
  ["100000356", "Ni-Cd Battery Pocket Plate"],
  ["100000467", "Lithium-Ion Module 48V"],
  ["100000578", "Tubular Plate Battery 6V"],
  ["100000689", "Industrial UPS Battery 12V 200Ah"],
  ["100000712", "Solar Battery 12V 220Ah"],
  ["100000834", "Defence Application Battery"],
];
const PLANTS = [
  ["1100", "HBL NCPP-SHPT"],
  ["1200", "HBL VSP-SHPT"],
  ["1300", "HBL HYD-PLANT-04"],
  ["1400", "HBL Nandigaon"],
  ["1500", "HBL Shameerpet"],
];
const DIVISIONS = [
  ["10", "NCPP"],
  ["20", "VSP"],
  ["30", "Industrial"],
  ["40", "Defence"],
  ["50", "Telecom"],
];
const INCOTERMS = ["FOR", "EXW", "CIF", "FOB", "DAP", "DDP"];

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

function dateFromOffset(daysAgo: number): string {
  // Anchor on a fixed date so SSR + client agree.
  const anchor = new Date(Date.UTC(2026, 5, 11)); // 2026-06-11
  const d = new Date(anchor.getTime() - daysAgo * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

let cache: DispatchOrderRow[] | null = null;

export function getAllDispatchOrders(): DispatchOrderRow[] {
  if (cache) return cache;
  const rnd = mulberry32(20260611);
  const rows: DispatchOrderRow[] = [];
  for (let i = 0; i < 120; i++) {
    const mat = MATERIALS[Math.floor(rnd() * MATERIALS.length)];
    const plant = PLANTS[Math.floor(rnd() * PLANTS.length)];
    const div = DIVISIONS[Math.floor(rnd() * DIVISIONS.length)];
    const basic = Math.round((50000 + rnd() * 950000) * 100) / 100;
    const gst = Math.round(basic * 1.18 * 100) / 100;
    rows.push({
      id: String(i + 1),
      invoiceNo: `90021${pad(5000 + i, 4)}`,
      invoiceDate: dateFromOffset(Math.floor(rnd() * 180)),
      billingTransactionType: TX_TYPES[Math.floor(rnd() * TX_TYPES.length)],
      material: mat[0],
      description: mat[1],
      plant: plant[0],
      plantName: plant[1],
      division: div[0],
      divisionText: div[1],
      basicShipmentValue: basic,
      invoiceValueWithGst: gst,
      incoterms: INCOTERMS[Math.floor(rnd() * INCOTERMS.length)],
    });
  }
  cache = rows;
  return rows;
}

export function queryDispatchOrders(fromDate: string, toDate: string): DispatchOrderRow[] {
  const all = getAllDispatchOrders();
  return all.filter((r) => r.invoiceDate >= fromDate && r.invoiceDate <= toDate);
}