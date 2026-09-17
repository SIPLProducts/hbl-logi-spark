"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function parseDateValue(val?: Date | string | null): { year: number; month: number; day: number } | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return { year: val.getFullYear(), month: val.getMonth(), day: val.getDate() };
  }
  if (typeof val === "string" && val.trim()) {
    const s = val.trim();
    // YYYY-MM-DD or ISO
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return { year: Number(isoMatch[1]), month: Number(isoMatch[2]) - 1, day: Number(isoMatch[3]) };
    }
    // DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      return { year: Number(dmyMatch[3]), month: Number(dmyMatch[2]) - 1, day: Number(dmyMatch[1]) };
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
  }
  return null;
}

export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | string | null;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean | ((date: Date) => boolean);
  fromDate?: Date;
  toDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  initialFocus?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

/**
 * Calendar component designed to match the Gate In/Out screen's Required Date field calendar design.
 * Features:
 * - Month & Year header with smooth Chevron navigation
 * - Weekday headers (Mo, Tu, We, Th, Fr, Sa, Su)
 * - 7-column day grid with modern rounded day buttons (size-7.5 rounded-lg)
 * - Active day highlighted in blue (bg-blue-600 text-white shadow-sm font-semibold)
 * - Quick Action buttons at bottom: Clear & Today
 * - Date selection only (no time selection UI)
 */
export function Calendar({
  selected,
  onSelect,
  className,
  disabled,
  fromDate,
  toDate,
  minDate,
  maxDate,
  onClose,
}: CalendarProps) {
  const parsed = React.useMemo(() => parseDateValue(selected), [selected]);
  const now = new Date();

  const [viewYear, setViewYear] = React.useState<number>(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = React.useState<number>(parsed?.month ?? now.getMonth());

  // Sync view when selected prop changes externally
  React.useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [parsed?.year, parsed?.month]);

  const effectiveMin = minDate || fromDate;
  const effectiveMax = maxDate || toDate;

  const isCellDisabled = (year: number, month: number, day: number) => {
    if (disabled === true) return true;
    const cellDate = new Date(year, month, day, 12, 0, 0);

    if (effectiveMin) {
      const minD = new Date(effectiveMin.getFullYear(), effectiveMin.getMonth(), effectiveMin.getDate(), 0, 0, 0);
      if (cellDate < minD) return true;
    }
    if (effectiveMax) {
      const maxD = new Date(effectiveMax.getFullYear(), effectiveMax.getMonth(), effectiveMax.getDate(), 23, 59, 59);
      if (cellDate > maxD) return true;
    }
    if (typeof disabled === "function") {
      return disabled(cellDate);
    }
    return false;
  };

  const calendarDays = React.useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const mondayOffset = (firstDayIndex + 6) % 7;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[] = [];

    // Prev month padding
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: isCellDisabled(y, m, d),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const isSelected =
        Boolean(parsed) &&
        parsed!.year === viewYear &&
        parsed!.month === viewMonth &&
        parsed!.day === d;
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        isSelected,
        isDisabled: isCellDisabled(viewYear, viewMonth, d),
      });
    }

    // Next month padding
    const remaining = (7 - (cells.length % 7)) % 7;
    const totalSlots = cells.length + remaining < 35 ? 35 : cells.length + remaining;
    const nextPadding = totalSlots - cells.length;

    for (let d = 1; d <= nextPadding; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: isCellDisabled(y, m, d),
      });
    }

    return cells;
  }, [viewYear, viewMonth, parsed, disabled, effectiveMin, effectiveMax]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (cell: (typeof calendarDays)[0]) => {
    if (cell.isDisabled) return;
    const selectedDate = new Date(cell.year, cell.month, cell.day, 12, 0, 0);
    onSelect?.(selectedDate);
    if (!cell.isCurrentMonth) {
      setViewYear(cell.year);
      setViewMonth(cell.month);
    }
    onClose?.();
  };

  const handleToday = () => {
    const today = new Date();
    if (!isCellDisabled(today.getFullYear(), today.getMonth(), today.getDate())) {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      const selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
      onSelect?.(selectedDate);
      onClose?.();
    }
  };

  const handleClear = () => {
    onSelect?.(undefined);
    onClose?.();
  };

  return (
    <div
      className={cn(
        "p-3.5 w-[260px] flex flex-col justify-between select-none bg-white dark:bg-surface rounded-2xl",
        className
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAYS.map((wd) => (
            <span key={wd} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5">
              {wd}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1 place-items-center text-[12px]">
          {calendarDays.map((cell, i) => {
            const isCurMonth = cell.isCurrentMonth;
            const isSel = cell.isSelected;
            const isDis = cell.isDisabled;

            return (
              <button
                key={i}
                type="button"
                disabled={isDis}
                onClick={() => handleSelectDay(cell)}
                className={cn(
                  "size-7.5 rounded-lg flex items-center justify-center font-medium transition-all cursor-pointer",
                  isSel
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : isDis
                      ? "text-slate-300 dark:text-slate-700 cursor-not-allowed pointer-events-none"
                      : isCurMonth
                        ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-semibold">
        <button
          type="button"
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// Backward-compatibility export
export function CalendarDayButton(props: any) {
  return null;
}
