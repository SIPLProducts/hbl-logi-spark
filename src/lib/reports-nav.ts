import {
  Layers,
  Clock,
  FileSpreadsheet,
  BarChart3,
  Grid3x3,
  ListChecks,
  Shield,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type ReportNavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

export const REPORTS_NAV: ReportNavItem[] = [
  {
    title: "Transit & E-way bill Report",
    to: "/reports/transit-eway-bill",
    icon: Layers,
    description: "Transit movements with linked E-way bill numbers and validity.",
  },
  {
    title: "Pending PODs",
    to: "/reports/pending-pods",
    icon: Clock,
    description: "Shipments awaiting Proof-of-Delivery confirmation.",
  },
  {
    title: "Freight Bills",
    to: "/reports/freight-bills",
    icon: FileSpreadsheet,
    description: "Freight billing summary by carrier, plant, and period.",
  },
  {
    title: "Loading Factor & Cost",
    to: "/reports/loading-factor-cost",
    icon: BarChart3,
    description: "Vehicle loading factor and cost-per-ton trends.",
  },
  {
    title: "Business Share Matrix",
    to: "/reports/business-share-matrix",
    icon: Grid3x3,
    description: "Share of business by transporter, lane, and division.",
  },
  {
    title: "Damage List",
    to: "/reports/damage-list",
    icon: ListChecks,
    description: "Consolidated list of in-transit damages and resolutions.",
  },
  {
    title: "Insurance",
    to: "/reports/insurance",
    icon: Shield,
    description: "Insurance coverage, claims raised, and settlement status.",
  },
  {
    title: "Service Level",
    to: "/reports/service-level-report",
    icon: Settings,
    description: "On-time delivery and service-level adherence by lane.",
  },
];