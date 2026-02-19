"use client";

import type { MaskColor } from "@/types/nft";
import { getMaskHexColor } from "@/lib/domain/traits";
import { cn } from "@/lib/utils/cn";

interface TraitBadgeProps {
  maskColor: MaskColor;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TraitBadge({
  maskColor,
  size = "sm",
  showLabel = true,
  className,
}: TraitBadgeProps) {
  const hexColor = getMaskHexColor(maskColor);

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium uppercase tracking-wider",
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${hexColor}40`,
        backgroundColor: `${hexColor}10`,
        color: hexColor,
      }}
    >
      <span
        className={cn("rounded-full shrink-0", dotSizes[size])}
        style={{ backgroundColor: hexColor }}
      />
      {showLabel && <span>{maskColor}</span>}
    </span>
  );
}
