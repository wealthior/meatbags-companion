"use client";

import type { GeocacheTier, GeocacheSeries } from "@/types/geocache";
import { cn } from "@/lib/utils/cn";

interface GeocacheTraitBreakdownProps {
  byTier: Record<GeocacheTier, number>;
  bySeries: Record<GeocacheSeries, number>;
  totalHeld: number;
  burnedByTier?: Record<GeocacheTier, number>;
  burnedBySeries?: Record<GeocacheSeries, number>;
  totalBurned?: number;
}

/** Tier display config: label + color */
const TIER_CONFIG: Record<GeocacheTier, { label: string; color: string; bgColor: string }> = {
  Common: { label: "Common", color: "text-text-secondary", bgColor: "bg-text-secondary/20" },
  Rare: { label: "Rare", color: "text-gold", bgColor: "bg-gold/20" },
};

/** Series display config: label + color */
const SERIES_CONFIG: Record<GeocacheSeries, { label: string; color: string; bgColor: string }> = {
  "Bounty Box I": { label: "Bounty Box I", color: "text-neon-green", bgColor: "bg-neon-green/20" },
  "Bounty Box II": { label: "Bounty Box II", color: "text-rust", bgColor: "bg-rust/20" },
  "Shit Box": { label: "Shit Box", color: "text-toxic-purple", bgColor: "bg-toxic-purple/20" },
};

/**
 * Bar row showing a trait count with percentage bar.
 * Optionally shows a second "burned" count stacked below.
 */
function TraitBar({
  label,
  count,
  total,
  color,
  bgColor,
  burnedCount,
  burnedTotal,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  bgColor: string;
  burnedCount?: number;
  burnedTotal?: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const hasBurned = burnedCount !== undefined && burnedTotal !== undefined && burnedTotal > 0;
  const burnedPct = hasBurned ? (burnedCount / burnedTotal!) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-medium uppercase tracking-wider", color)}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {hasBurned && (
            <span className="text-[9px] text-rust/70">
              {burnedCount} opened ({burnedPct.toFixed(0)}%)
            </span>
          )}
          <span className="text-[10px] text-text-muted">
            {count} held ({pct.toFixed(0)}%)
          </span>
        </div>
      </div>
      {/* Stacked bars: held on top, burned below */}
      <div className="space-y-0.5">
        <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", bgColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        {hasBurned && (
          <div className="h-1 rounded-full bg-bg-hover overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-rust/30"
              style={{ width: `${burnedPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Trait breakdown component showing Tier and Series distribution
 * of currently held AND opened/burned GeoCaches.
 */
export function GeocacheTraitBreakdown({
  byTier,
  bySeries,
  totalHeld,
  burnedByTier,
  burnedBySeries,
  totalBurned = 0,
}: GeocacheTraitBreakdownProps) {
  if (totalHeld === 0 && totalBurned === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tier Distribution */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
            Tier Distribution
          </h4>
          {totalBurned > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-1.5 rounded-full bg-text-secondary/20" />
                <span className="text-[8px] text-text-muted uppercase">Held</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 rounded-full bg-rust/30" />
                <span className="text-[8px] text-text-muted uppercase">Opened</span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {(Object.keys(TIER_CONFIG) as GeocacheTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            return (
              <TraitBar
                key={tier}
                label={config.label}
                count={byTier[tier]}
                total={totalHeld}
                color={config.color}
                bgColor={config.bgColor}
                burnedCount={burnedByTier?.[tier]}
                burnedTotal={totalBurned}
              />
            );
          })}
        </div>
      </div>

      {/* Series Distribution */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
            Series Distribution
          </h4>
          {totalBurned > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-1.5 rounded-full bg-neon-green/20" />
                <span className="text-[8px] text-text-muted uppercase">Held</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 rounded-full bg-rust/30" />
                <span className="text-[8px] text-text-muted uppercase">Opened</span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {(Object.keys(SERIES_CONFIG) as GeocacheSeries[]).map((series) => {
            const config = SERIES_CONFIG[series];
            return (
              <TraitBar
                key={series}
                label={config.label}
                count={bySeries[series]}
                total={totalHeld}
                color={config.color}
                bgColor={config.bgColor}
                burnedCount={burnedBySeries?.[series]}
                burnedTotal={totalBurned}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
