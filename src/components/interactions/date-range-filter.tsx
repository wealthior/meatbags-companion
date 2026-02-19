"use client";

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** MeatBags TGE: October 2024 */
const TGE_DATE = new Date("2024-10-01");

const PRESETS = [
  { label: "All Time", getRange: () => ({ start: TGE_DATE, end: new Date() }) },
  {
    label: "30d",
    getRange: () => ({ start: new Date(Date.now() - 30 * 86_400_000), end: new Date() }),
  },
  {
    label: "90d",
    getRange: () => ({ start: new Date(Date.now() - 90 * 86_400_000), end: new Date() }),
  },
  {
    label: "6mo",
    getRange: () => ({ start: new Date(Date.now() - 180 * 86_400_000), end: new Date() }),
  },
] as const;

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

function toInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangeFilter({ startDate, endDate, onRangeChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar size={12} className="text-text-muted" />

      {/* Preset buttons */}
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => {
            const r = preset.getRange();
            onRangeChange(r.start, r.end);
          }}
          className={cn(
            "px-2 py-1 rounded text-[10px] uppercase tracking-wider border transition-colors cursor-pointer",
            "text-text-muted border-border-default hover:text-neon-green hover:border-neon-green/30"
          )}
        >
          {preset.label}
        </button>
      ))}

      {/* Custom date inputs */}
      <div className="flex items-center gap-1 ml-0 sm:ml-2">
        <input
          type="date"
          value={toInputValue(startDate)}
          min={toInputValue(TGE_DATE)}
          max={toInputValue(endDate)}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onRangeChange(d, endDate);
          }}
          className="bg-bg-primary border border-border-default rounded px-1.5 py-0.5 text-[10px] text-text-secondary focus:outline-none focus:border-neon-green/50"
        />
        <span className="text-[10px] text-text-muted">—</span>
        <input
          type="date"
          value={toInputValue(endDate)}
          min={toInputValue(startDate)}
          max={toInputValue(new Date())}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onRangeChange(startDate, d);
          }}
          className="bg-bg-primary border border-border-default rounded px-1.5 py-0.5 text-[10px] text-text-secondary focus:outline-none focus:border-neon-green/50"
        />
      </div>
    </div>
  );
}
