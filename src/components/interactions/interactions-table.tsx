"use client";

import type { WalletInteraction } from "@/types/wallet-interactions";
import { shortenAddress, formatNumber, formatSol, formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface InteractionsTableProps {
  interactions: WalletInteraction[];
  selectedAddress?: string | null;
  onSelect?: (interaction: WalletInteraction) => void;
  maxRows?: number;
}

const DIRECTION_BADGE: Record<string, { label: string; className: string }> = {
  BUYER: {
    label: "Buyer",
    className: "bg-neon-green/10 text-neon-green border-neon-green/20",
  },
  SELLER: {
    label: "Seller",
    className: "bg-blood/10 text-blood border-blood/20",
  },
  MIXED: {
    label: "Mixed",
    className: "bg-toxic-purple/10 text-toxic-purple border-toxic-purple/20",
  },
};

export function InteractionsTable({
  interactions,
  selectedAddress,
  onSelect,
  maxRows = 20,
}: InteractionsTableProps) {
  const visible = interactions.slice(0, maxRows);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default text-[10px] text-text-muted uppercase tracking-wider">
            <th className="text-left px-4 py-3">#</th>
            <th className="text-left px-4 py-3">Address</th>
            <th className="text-right px-4 py-3">Transactions</th>
            <th className="text-right px-4 py-3">SOL Volume</th>
            <th className="text-center px-4 py-3">Direction</th>
            <th className="text-center px-4 py-3">Buys / Sells</th>
            <th className="text-right px-4 py-3">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-text-muted text-sm">
                No interactions found in the wasteland.
              </td>
            </tr>
          ) : (
            visible.map((interaction, index) => {
              const badge = DIRECTION_BADGE[interaction.direction] ?? DIRECTION_BADGE.MIXED;
              const isSelected = selectedAddress === interaction.counterpartyAddress;

              return (
                <tr
                  key={interaction.counterpartyAddress}
                  onClick={() => onSelect?.(interaction)}
                  className={cn(
                    "border-b border-border-default/50 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-neon-green/[0.04] border-l-2 border-l-neon-green"
                      : "hover:bg-bg-hover/30"
                  )}
                >
                  <td className="px-4 py-2 text-[10px] text-text-muted font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-primary font-mono">
                        {shortenAddress(interaction.counterpartyAddress, 6)}
                      </span>
                      {interaction.isOwnWallet && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right px-4 py-2 text-xs text-text-primary font-medium">
                    {formatNumber(interaction.transactionCount)}
                  </td>
                  <td className="text-right px-4 py-2 text-xs text-text-secondary">
                    {formatSol(interaction.totalSolVolume)}
                  </td>
                  <td className="text-center px-4 py-2">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider border",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="text-center px-4 py-2 text-xs text-text-muted">
                    <span className="text-neon-green">{interaction.buyCount}</span>
                    {" / "}
                    <span className="text-blood">{interaction.sellCount}</span>
                    {interaction.transferCount > 0 && (
                      <span className="text-text-muted"> +{interaction.transferCount}t</span>
                    )}
                  </td>
                  <td className="text-right px-4 py-2 text-[10px] text-text-muted">
                    {formatDateTime(interaction.lastInteraction)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {interactions.length > maxRows && (
        <div className="px-4 py-2 text-[10px] text-text-muted text-center border-t border-border-default">
          Showing top {maxRows} of {interactions.length} counterparties
        </div>
      )}
    </div>
  );
}
