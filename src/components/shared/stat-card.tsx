"use client";

import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

type AccentColor = "green" | "gold" | "rust" | "purple";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  accent?: AccentColor;
  /** Override accent with a custom hex color (used for tier colors etc.) */
  customColor?: string;
  className?: string;
}

const accentBarClasses: Record<AccentColor, string> = {
  green: "bg-neon-green",
  gold: "bg-gold",
  rust: "bg-rust",
  purple: "bg-toxic-purple",
};

const accentTextClasses: Record<AccentColor, string> = {
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
  customColor,
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
      {customColor ? (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: customColor }}
        />
      ) : (
        <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", accentBarClasses[accent])} />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">
            {label}
          </p>
          {customColor ? (
            <p className="text-xl font-bold" style={{ color: customColor }}>
              {value}
            </p>
          ) : (
            <p className={cn("text-xl font-bold", accentTextClasses[accent])}>
              {value}
            </p>
          )}
          {subValue && (
            <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>
          )}
        </div>
        {Icon && (
          customColor ? (
            <Icon size={18} style={{ color: customColor, opacity: 0.4 }} />
          ) : (
            <Icon
              size={18}
              className={cn("opacity-40", accentTextClasses[accent])}
            />
          )
        )}
      </div>
    </div>
  );
}
