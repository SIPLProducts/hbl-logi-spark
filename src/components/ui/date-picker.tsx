"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function toDateObj(val?: Date | string | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === "string" && val.trim()) {
    const s = val.trim();
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }
    const dmyMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export interface GateDatePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined, dateStr: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: Date | string;
  max?: Date | string;
  isDateDisabled?: (date: Date) => boolean;
}

/**
 * GateDatePicker
 * Implements the exact same Date Picker design as the Gate In/Out screen's Required Date field:
 * - Trigger: Input container with formatted text display ('dd-MM-yyyy') and calendar icon on the right
 * - Calendar: Custom Gate In/Out calendar popup (month/year header, Mo-Su weekdays, rounded days, Clear & Today buttons)
 * - Date selection only (no time selection UI)
 */
export function GateDatePicker({
  value,
  onChange,
  label,
  placeholder = "dd-mm-yyyy",
  disabled = false,
  className,
  min,
  max,
  isDateDisabled,
}: GateDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const dateObj = React.useMemo(() => toDateObj(value), [value]);

  const displayFormatted = React.useMemo(() => {
    if (!dateObj) return "";
    return format(dateObj, "dd-MM-yyyy");
  }, [dateObj]);

  const handleSelect = (selectedDate: Date | undefined) => {
    const str = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    onChange?.(selectedDate, str);
    setOpen(false);
  };

  const picker = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "relative flex items-center h-8 w-full rounded-md border border-input bg-white dark:bg-surface text-[12px] transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
            disabled && "opacity-60 cursor-not-allowed",
            className
          )}
        >
          <input
            type="text"
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            value={displayFormatted}
            onClick={() => !disabled && setOpen((prev) => !prev)}
            className="h-full w-full bg-transparent px-2.5 text-[12px] text-foreground font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal cursor-pointer"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="h-full px-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              aria-label="Open Calendar"
            >
              <CalendarIcon className="size-3.5 opacity-70 hover:opacity-100" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
        className="w-auto p-0 bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <Calendar
          selected={dateObj}
          onSelect={handleSelect}
          minDate={toDateObj(min)}
          maxDate={toDateObj(max)}
          disabled={isDateDisabled}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );

  if (label) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </label>
        {picker}
      </div>
    );
  }

  return picker;
}

export { GateDatePicker as DatePicker };

/**
 * Universal DateField component that provides the exact Gate In/Out screen date picker design
 * (input with calendar icon on right + popover calendar) across all screens.
 * Supports both Date objects and YYYY-MM-DD strings.
 */
export function DateField({
  label,
  value,
  onChange,
  className,
  error,
}: {
  label: string;
  value?: Date | string;
  onChange: any;
  className?: string;
  error?: string;
}) {
  return (
    <div className="w-full">
      <GateDatePicker
        label={label}
        value={value}
        onChange={(d, str) => {
          if (typeof value === "string") {
            onChange?.(str);
          } else {
            onChange?.(d);
          }
        }}
        className={className}
      />
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
