"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Repeat,
  Sparkles,
  ExternalLink,
  Tag,
  XCircle,
  Gavel,
  Flame,
} from "lucide-react";
import { useAllTransactions } from "@/hooks/use-transaction-history";
import { useSolPrice } from "@/hooks/use-sol-price";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatSol, formatUsd, formatDateTime, shortenAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { TransactionType } from "@/types/transaction";

const TX_TYPE_CONFIG: Record<TransactionType, { icon: typeof ArrowDownRight; label: string; color: string }> = {
  BUY: { icon: ArrowDownRight, label: "Buy", color: "text-neon-green" },
  SELL: { icon: ArrowUpRight, label: "Sell", color: "text-blood" },
  TRANSFER: { icon: Repeat, label: "Transfer", color: "text-text-secondary" },
  MINT: { icon: Sparkles, label: "Mint", color: "text-gold" },
  LIST: { icon: Tag, label: "List", color: "text-rust" },
  DELIST: { icon: XCircle, label: "Delist", color: "text-text-muted" },
  BID: { icon: Gavel, label: "Bid", color: "text-toxic-purple" },
  BURN: { icon: Flame, label: "Burn", color: "text-blood" },
};

export default function HistoryPage() {
  const { data: transactions, isLoading } = useAllTransactions();
  const { data: solPrice } = useSolPrice();

  if (isLoading) return <PageLoadingSkeleton />;

  const txns = transactions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="History" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Transaction history across all vaults
        </p>
      </div>

      {/* Current SOL price */}
      {solPrice && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Current SOL:</span>
          <span className="text-neon-green font-medium">{formatUsd(solPrice.usd)}</span>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-[10px] text-text-secondary uppercase tracking-wider">
                <th className="text-left px-2 sm:px-4 py-3">Type</th>
                <th className="text-left px-2 sm:px-4 py-3">NFT</th>
                <th className="text-right px-2 sm:px-4 py-3">SOL</th>
                <th className="text-right px-2 sm:px-4 py-3 hidden sm:table-cell">USD</th>
                <th className="text-left px-2 sm:px-4 py-3 hidden md:table-cell">From</th>
                <th className="text-left px-2 sm:px-4 py-3 hidden md:table-cell">To</th>
                <th className="text-left px-2 sm:px-4 py-3 hidden lg:table-cell">Marketplace</th>
                <th className="text-right px-2 sm:px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 sm:py-12 text-text-muted text-sm">
                    No transactions found in the wasteland.
                  </td>
                </tr>
              ) : (
                txns.map((tx) => {
                  const config = TX_TYPE_CONFIG[tx.type];
                  const Icon = config.icon;
                  const usdValue = tx.solPriceUsd > 0
                    ? tx.solAmount * tx.solPriceUsd
                    : solPrice
                      ? tx.solAmount * solPrice.usd
                      : 0;

                  return (
                    <tr
                      key={tx.signature}
                      className="border-b border-border-default/50 hover:bg-bg-hover/30 transition-colors group cursor-pointer"
                      onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, "_blank")}
                    >
                      <td className="px-2 sm:px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} className={config.color} />
                          <span className={cn("text-[10px] sm:text-xs font-medium", config.color)}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs text-text-secondary truncate max-w-[100px] sm:max-w-none">
                        {tx.nftName || shortenAddress(tx.mintAddress, 6)}
                      </td>
                      <td className="text-right px-2 sm:px-4 py-2 text-[10px] sm:text-xs text-text-primary font-medium">
                        {formatSol(tx.solAmount)}
                      </td>
                      <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-muted hidden sm:table-cell">
                        {usdValue > 0 ? formatUsd(usdValue) : "—"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] text-text-muted font-mono hidden md:table-cell">
                        {tx.fromWallet ? shortenAddress(tx.fromWallet) : "—"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] text-text-muted font-mono hidden md:table-cell">
                        {tx.toWallet ? shortenAddress(tx.toWallet) : "—"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-[10px] text-text-muted hidden lg:table-cell">
                        {tx.marketplace}
                      </td>
                      <td className="text-right px-2 sm:px-4 py-2 text-[10px] text-text-muted">
                        <span className="flex items-center justify-end gap-1">
                          {formatDateTime(tx.timestamp)}
                          <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 text-neon-green transition-opacity" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
