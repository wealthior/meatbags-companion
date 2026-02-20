"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowUpDown, Hash } from "lucide-react";
import type { NftTransaction } from "@/types/transaction";
import { StatCard } from "@/components/shared/stat-card";
import { formatSol } from "@/lib/utils/format";
import { calculateGeocachePnl } from "@/lib/domain/geocache-stats";

interface GeocachePnlSummaryProps {
  transactions: NftTransaction[];
  trackedAddresses: Set<string>;
}

/**
 * P&L summary for GeoCaches trades.
 * Shows 4 stat cards: Total Spent, Total Earned, Net P&L, Total Trades.
 */
export function GeocachePnlSummary({ transactions, trackedAddresses }: GeocachePnlSummaryProps) {
  const pnl = useMemo(
    () => calculateGeocachePnl(transactions, trackedAddresses),
    [transactions, trackedAddresses],
  );

  if (pnl.buyCount === 0 && pnl.sellCount === 0) return null;

  const isProfitable = pnl.netPnlSol >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Total Spent"
        value={formatSol(pnl.totalSpentSol)}
        subValue={`${pnl.buyCount} buys`}
        icon={TrendingDown}
        accent="rust"
      />
      <StatCard
        label="Total Earned"
        value={formatSol(pnl.totalEarnedSol)}
        subValue={`${pnl.sellCount} sells`}
        icon={TrendingUp}
        accent="green"
      />
      <StatCard
        label="Net P&L"
        value={`${isProfitable ? "+" : ""}${formatSol(pnl.netPnlSol)}`}
        subValue={isProfitable ? "Profit" : "Loss"}
        icon={ArrowUpDown}
        accent={isProfitable ? "green" : "rust"}
      />
      <StatCard
        label="Total Trades"
        value={String(pnl.buyCount + pnl.sellCount)}
        subValue={`${pnl.buyCount}B / ${pnl.sellCount}S`}
        icon={Hash}
        accent="purple"
      />
    </div>
  );
}
