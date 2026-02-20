"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Repeat,
  Sparkles,
  Tag,
  XCircle,
  Gavel,
  Flame,
  ExternalLink,
} from "lucide-react";
import type { NftTransaction, TransactionType } from "@/types/transaction";
import { shortenAddress, formatSol, formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface GeocacheActivityTimelineProps {
  transactions: NftTransaction[];
  maxItems?: number;
}

const TX_CONFIG: Record<TransactionType, {
  icon: typeof ArrowDownRight;
  label: string;
  color: string;
  bgColor: string;
}> = {
  BUY: { icon: ArrowDownRight, label: "Buy", color: "text-neon-green", bgColor: "bg-neon-green/10" },
  SELL: { icon: ArrowUpRight, label: "Sell", color: "text-blood", bgColor: "bg-blood/10" },
  TRANSFER: { icon: Repeat, label: "Transfer", color: "text-text-secondary", bgColor: "bg-bg-hover" },
  MINT: { icon: Sparkles, label: "Mint", color: "text-gold", bgColor: "bg-gold/10" },
  LIST: { icon: Tag, label: "List", color: "text-rust", bgColor: "bg-rust/10" },
  DELIST: { icon: XCircle, label: "Delist", color: "text-text-muted", bgColor: "bg-bg-hover" },
  BID: { icon: Gavel, label: "Bid", color: "text-toxic-purple", bgColor: "bg-toxic-purple/10" },
  BURN: { icon: Flame, label: "Opened", color: "text-blood", bgColor: "bg-blood/10" },
};

/**
 * Activity timeline for GeoCaches transactions.
 * Shows burns as "Opened" to match the geocache lore.
 */
export function GeocacheActivityTimeline({ transactions, maxItems = 50 }: GeocacheActivityTimelineProps) {
  const visible = transactions.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-xs">
        No geocache activity recorded in the wasteland.
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto space-y-1">
      {visible.map((tx) => {
        const config = TX_CONFIG[tx.type] ?? TX_CONFIG.TRANSFER;
        const Icon = config.icon;

        return (
          <div
            key={tx.signature}
            className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover/30 transition-colors cursor-pointer"
            onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, "_blank")}
          >
            {/* Type icon */}
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0", config.bgColor)}>
              <Icon size={12} className={config.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                {tx.marketplace !== "Transfer" && tx.marketplace !== "Unknown" && (
                  <span className="text-[8px] text-text-muted px-1 py-0.5 rounded bg-bg-hover">
                    {tx.marketplace}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted truncate">
                {tx.description ?? (
                  tx.mintAddress
                    ? `${shortenAddress(tx.mintAddress, 4)}`
                    : "Unknown asset"
                )}
              </p>
            </div>

            {/* Amount */}
            {tx.solAmount > 0 && (
              <span className={cn("text-xs font-medium flex-shrink-0", config.color)}>
                {formatSol(tx.solAmount)}
              </span>
            )}

            {/* Timestamp + link */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[9px] text-text-muted">
                {formatDateTime(tx.timestamp)}
              </span>
              <ExternalLink
                size={8}
                className="opacity-0 group-hover:opacity-100 text-neon-green transition-opacity"
              />
            </div>
          </div>
        );
      })}

      {transactions.length > maxItems && (
        <div className="text-center py-2 text-[10px] text-text-muted">
          Showing {maxItems} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
}
