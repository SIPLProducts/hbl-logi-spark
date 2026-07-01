import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Filter, RefreshCw, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/gate-in-out-process")({
  component: GateInOutProcessPage,
});

type SapMode = "with" | "without";

const FIELDS = [
  "Reference No",
  "Invoice No",
  "Line No",
  "ODN No",
  "Invoice Date",
  "Basic Value",
  "Plant",
  "Division",
  "Transporter",
  "Vehicle Type",
  "Work Order",
  "LR Number",
];

function GateInOutProcessPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);

  return (
    <div className="flex flex-col min-h-full">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[15px] font-semibold text-foreground">Gate In and Out Process</h1>
            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value="create" className="gap-1">
                  <Plus className="size-3" /> Create
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-1">
                  <Filter className="size-3" /> Filter &amp; Download
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="gap-1">
                <RefreshCw className="size-3" /> Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Create tab */}
        <TabsContent value="create" className="px-4 py-3 space-y-3">
          {/* Direction / SAP strip */}
          <div className="rounded border bg-card p-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-[12px]">
              <input
                type="radio"
                name="direction"
                checked={direction === "outward"}
                onChange={() => setDirection("outward")}
              />
              Outward
            </label>

            {direction === "outward" && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="radio"
                    name="sap"
                    checked={sap === "with"}
                    onChange={() => setSap("with")}
                  />
                  With SAP
                </label>
                <label className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="radio"
                    name="sap"
                    checked={sap === "without"}
                    onChange={() => setSap("without")}
                  />
                  Without SAP
                </label>
              </div>
            )}

            {sap === "with" && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Select>
                  <SelectTrigger className="h-7 w-40 text-[12px]">
                    <SelectValue placeholder="Reference Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="odn">ODN</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Invoice Number" className="h-7 w-44" />
                <Button size="sm" variant="outline">Get</Button>
              </div>
            )}
          </div>

          {/* Form grid */}
          {sap && (
            <div className="rounded border bg-card p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {FIELDS.map((label) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <label className="text-[11px] text-muted-foreground">{label}</label>
                    <Input className="h-7" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {sap && (
            <div className="rounded border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sl.No</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>LR Number</TableHead>
                    <TableHead>Transporter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Action buttons */}
          {sap && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="size-3" /> Save &amp; Previous
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Save className="size-3" /> Save
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                Save &amp; Next <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Filter & Download tab */}
        <TabsContent value="search" className="px-4 py-3 space-y-3">
          <div className="rounded border bg-card p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">From Date</label>
                <Input type="date" className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">To Date</label>
                <Input type="date" className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">Plant</label>
                <Input className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">Division</label>
                <Input className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">Transporter</label>
                <Input className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">Vehicle Type</label>
                <Input className="h-7" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-muted-foreground">Status</label>
                <Input className="h-7" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm">Clear Filters</Button>
              <Button variant="outline" size="sm">Execute</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}