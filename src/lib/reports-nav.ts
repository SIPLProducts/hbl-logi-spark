import {
  Layers,
  Clock,
  FileSpreadsheet,
  BarChart3,
  Grid3x3,
  ListChecks,
  Shield,
  Settings,
  Receipt,
  Database,
  ClipboardCheck,
  Package,
  Wallet,
  ShoppingCart,
  Truck,
  AlertTriangle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type ReportNavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

// At present only the Business Share Matrix report is shown. The other reports are commented
// out — uncomment an entry to show that report again in the sidebar and on the Reports page.
export const REPORTS_NAV: ReportNavItem[] = [
  // {
  //   title: "Transit & E-way bill Report",
  //   to: "/reports/transit-eway-bill",
  //   icon: Layers,
  //   description: "Transit movements with linked E-way bill numbers and validity.",
  // },
  // {
  //   title: "Pending PODs",
  //   to: "/reports/pending-pods",
  //   icon: Clock,
  //   description: "Shipments awaiting Proof-of-Delivery confirmation.",
  // },
  // {
  //   title: "Freight Bills",
  //   to: "/reports/freight-bills",
  //   icon: FileSpreadsheet,
  //   description: "Freight billing summary by carrier, plant, and period.",
  // },
  // {
  //   title: "Loading Factor & Cost",
  //   to: "/reports/loading-factor-cost",
  //   icon: BarChart3,
  //   description: "Vehicle loading factor and cost-per-ton trends.",
  // },
  {
    title: "Business Share Matrix",
    to: "/reports/business-share-matrix",
    icon: Grid3x3,
    description: "Share of business by transporter, lane, and division.",
  },
  // New report screens (same layout as Business Share Matrix), in this order
  {
    title: "E-Way Bill Report",
    to: "/reports/e-way-bill-report",
    icon: Receipt,
    description: "E-way bill details by transporter, plant and period.",
  },
  {
    title: "Master Report",
    to: "/reports/master-report",
    icon: Database,
    description: "Consolidated master view of shipments across all stages.",
  },
  {
    title: "POD Status",
    to: "/reports/pod-status",
    icon: ClipboardCheck,
    description: "Proof-of-Delivery status of shipments by transporter and plant.",
  },
  {
    title: "Product Volume Wise",
    to: "/reports/product-volume-wise",
    icon: Package,
    description: "Shipment volumes by product, plant and period.",
  },
  {
    title: "Provision Statement",
    to: "/reports/provision-statement",
    icon: Wallet,
    description: "Freight provision amounts by transporter, plant and period.",
  },
  {
    title: "Sale Report",
    to: "/reports/sale-report",
    icon: ShoppingCart,
    description: "Sales dispatch details by transporter, plant and period.",
  },
  {
    title: "SIT Report",
    to: "/reports/sit-report",
    icon: Truck,
    description: "Stock-in-Transit (SIT) shipments by transporter and plant.",
  },
  {
    title: "Transit Damage Info Report",
    to: "/reports/transit-damage-info-report",
    icon: AlertTriangle,
    description: "In-transit damage details by transporter, plant and period.",
  },
  {
    title: "Insurance Claim Report",
    to: "/reports/insurance-claim-report",
    icon: ShieldCheck,
    description: "Insurance claims raised and their status by plant and period.",
  },
  // {
  //   title: "Damage List",
  //   to: "/reports/damage-list",
  //   icon: ListChecks,
  //   description: "Consolidated list of in-transit damages and resolutions.",
  // },
  // {
  //   title: "Insurance",
  //   to: "/reports/insurance",
  //   icon: Shield,
  //   description: "Insurance coverage, claims raised, and settlement status.",
  // },
  // {
  //   title: "Service Level",
  //   to: "/reports/service-level-report",
  //   icon: Settings,
  //   description: "On-time delivery and service-level adherence by lane.",
  // },
];
