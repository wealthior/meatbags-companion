"use client";

import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  accent?: "green" | "gold" | "rust" | "purple";
  className?: string;
}

const accentBarClasses = {
  green: "bg-neon-green",
  gold: "bg-gold",
  rust: "bg-rust",
  purple: "bg-toxic-purple",
};

const accentTextClasses = {
  green: "text-neon-green",
  gold: "text-gold",
  rust: "text-rust",
  purple: "text-toxic-purple",
};

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accent = "green",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-border-default rounded-lg p-4 relative overflow-hidden",
        className
      )}
    >
      {/* Accent bar on left */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", accentBarClasses[accent])} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={cn("text-xl font-bold", accentTextClasses[accent])}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>
          )}
        </div>
        {Icon && (
          <Icon
            size={18}
            className={cn("opacity-40", accentTextClasses[accent])}
          />
        )}
      </div>
    </div>
  );
}
