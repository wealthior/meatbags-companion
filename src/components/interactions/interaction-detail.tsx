"use client";

import { motion } from "framer-motion";
import { X, ArrowDownRight, ArrowUpRight, Repeat, Sparkles } from "lucide-react";
import type { WalletInteraction } from "@/types/wallet-interactions";
import type { NftTransaction, TransactionType } from "@/types/transaction";
import { shortenAddress, formatSol, formatUsd, formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface InteractionDetailProps {
  interaction: WalletInteraction;
  transactions: NftTransaction[];
  onClose: () => void;
}

const TX_ICON: Record<TransactionType, typeof ArrowDownRight> = {
  BUY: ArrowDownRight,
  SELL: ArrowUpRight,
  TRANSFER: Repeat,
  MINT: Sparkles,
};

const TX_COLOR: Record<TransactionType, string> = {
  BUY: "text-neon-green",
  SELL: "text-blood",
  TRANSFER: "text-text-secondary",
  MINT: "text-toxic-purple",
};

export function InteractionDetail({
  interaction,
  transactions,
  onClose,
}: InteractionDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-bg-surface border border-border-default rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div>
          <p className="text-xs font-bold text-text-primary font-mono">
            {shortenAddress(interaction.counterpartyAddress, 8)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {interaction.transactionCount} transactions ·{" "}
            {formatSol(interaction.totalSolVolume)} volume
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Transaction list */}
      <div className="max-h-[400px] overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs">
            No transactions found with this address.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-text-muted uppercase tracking-wider sticky top-0 bg-bg-surface">
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">NFT</th>
                <th className="text-right px-3 py-2">SOL</th>
                <th className="text-right px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const Icon = TX_ICON[tx.type];
                const color = TX_COLOR[tx.type];
                return (
                  <tr
                    key={tx.signature}
                    className="border-t border-border-default/30 hover:bg-bg-hover/20 transition-colors"
                  >
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <Icon size={10} className={color} />
                        <span className={cn("text-[10px] font-medium", color)}>
                          {tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-[10px] text-text-secondary truncate max-w-[120px]">
                      {tx.nftName || shortenAddress(tx.mintAddress, 4)}
                    </td>
                    <td className="text-right px-3 py-1.5 text-[10px] text-text-primary font-medium">
                      {formatSol(tx.solAmount)}
                    </td>
                    <td className="text-right px-3 py-1.5 text-[9px] text-text-muted">
                      {formatDateTime(tx.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
