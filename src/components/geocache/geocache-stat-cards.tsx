"use client";

import { MapPin, Flame, ShoppingCart, DollarSign, Tag, TrendingUp } from "lucide-react";
import type { GeocacheStats } from "@/types/geocache";
import { StatCard } from "@/components/shared/stat-card";
import { formatSol, formatNumber } from "@/lib/utils/format";

interface GeocacheStatCardsProps {
  stats: GeocacheStats;
  /** Whether transaction data is still loading (affects Bought/Sold/P&L display) */
  txLoading?: boolean;
}

/**
 * Grid of stat cards showing per-wallet GeoCaches statistics.
 * Displays: Held, Opened/Burned, Bought, Sold, Listed, Net P&L.
 */
export function GeocacheStatCards({ stats, txLoading }: GeocacheStatCardsProps) {
  const isProfitable = stats.netPnlSol >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      <StatCard
        label="Held"
        value={formatNumber(stats.totalHeld)}
        icon={MapPin}
        accent="green"
      />
      <StatCard
        label="Opened / Burned"
        value={formatNumber(stats.totalBurned)}
        icon={Flame}
        accent="rust"
      />
      <StatCard
        label="Bought"
        value={txLoading ? "..." : formatNumber(stats.totalBought)}
        subValue={txLoading ? "Loading..." : stats.totalSpentSol > 0 ? formatSol(stats.totalSpentSol) : undefined}
        icon={ShoppingCart}
        accent="gold"
      />
      <StatCard
        label="Sold"
        value={txLoading ? "..." : formatNumber(stats.totalSold)}
        subValue={txLoading ? "Loading..." : stats.totalEarnedSol > 0 ? formatSol(stats.totalEarnedSol) : undefined}
        icon={DollarSign}
        accent="purple"
      />
      <StatCard
        label="Listed"
        value={formatNumber(stats.totalListed)}
        icon={Tag}
        accent="rust"
      />
      <StatCard
        label="Net P&L"
        value={txLoading ? "..." : stats.tradeCount > 0 ? `${isProfitable ? "+" : ""}${formatSol(stats.netPnlSol)}` : "—"}
        subValue={txLoading ? "Loading..." : stats.tradeCount > 0 ? `${stats.buyCount}B / ${stats.sellCount}S` : "No trades"}
        icon={TrendingUp}
        accent={isProfitable ? "green" : "rust"}
      />
    </div>
  );
}
