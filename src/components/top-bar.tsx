import { Bell, Search, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-[10px] font-bold uppercase tracking-widest">Plant</span>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-50 ring-1 ring-zinc-200 text-zinc-900 text-[12.5px] font-medium hover:bg-zinc-100"
          >
            HYD-PLANT-04
            <ChevronDown className="size-3.5 text-zinc-500" />
          </button>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search delivery, shipment, batch…"
            className="bg-zinc-50 ring-1 ring-zinc-200 rounded-sm pl-8 pr-3 py-1.5 w-80 text-[12.5px] focus:ring-blue-500 outline-none transition-shadow"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[11px] text-zinc-500 font-mono">
          Shift A · 06:00–14:00
        </div>
        <button
          type="button"
          className="relative p-2 text-zinc-500 hover:text-zinc-900 rounded-sm hover:bg-zinc-100"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}