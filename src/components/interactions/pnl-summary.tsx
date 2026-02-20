"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowUpDown, Hash } from "lucide-react";
import type { NftTransaction } from "@/types/transaction";
import { StatCard } from "@/components/shared/stat-card";
import { formatSol } from "@/lib/utils/format";

interface PnlSummaryProps {
  transactions: NftTransaction[];
  trackedAddresses: Set<string>;
}

interface PnlData {
  totalSpentSol: number;
  totalEarnedSol: number;
  netPnlSol: number;
  buyCount: number;
  sellCount: number;
}

/**
 * Calculate P&L from transaction history.
 * Buys = user spent SOL (toWallet is tracked), Sells = user earned SOL (fromWallet is tracked).
 */
const calculatePnl = (
  transactions: NftTransaction[],
  trackedAddresses: Set<string>,
): PnlData => {
  let totalSpentSol = 0;
  let totalEarnedSol = 0;
  let buyCount = 0;
  let sellCount = 0;

  for (const tx of transactions) {
    if (tx.type !== "BUY" && tx.type !== "SELL") continue;
    if (tx.solAmount <= 0) continue;

    // If the tracked wallet is the buyer (toWallet), it's a buy (spent SOL)
    if (trackedAddresses.has(tx.toWallet)) {
      totalSpentSol += tx.solAmount;
      buyCount++;
    }
    // If the tracked wallet is the seller (fromWallet), it's a sell (earned SOL)
    if (trackedAddresses.has(tx.fromWallet)) {
      totalEarnedSol += tx.solAmount;
      sellCount++;
    }
  }

  return {
    totalSpentSol,
    totalEarnedSol,
    netPnlSol: totalEarnedSol - totalSpentSol,
    buyCount,
    sellCount,
  };
};

export function PnlSummary({ transactions, trackedAddresses }: PnlSummaryProps) {
  const pnl = useMemo(
    () => calculatePnl(transactions, trackedAddresses),
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
