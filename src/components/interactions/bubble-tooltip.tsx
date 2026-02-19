"use client";

import type { PositionedBubble } from "@/types/wallet-interactions";
import { shortenAddress, formatNumber, formatSol, formatDateTime } from "@/lib/utils/format";

interface BubbleTooltipProps {
  bubble: PositionedBubble;
  x: number;
  y: number;
}

const DIRECTION_LABELS: Record<string, { label: string; color: string }> = {
  BUYER: { label: "You sell to them", color: "text-neon-green" },
  SELLER: { label: "You buy from them", color: "text-blood" },
  MIXED: { label: "Mixed activity", color: "text-toxic-purple" },
};

export function BubbleTooltip({ bubble, x, y }: BubbleTooltipProps) {
  const dir = DIRECTION_LABELS[bubble.direction] ?? DIRECTION_LABELS.MIXED;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -110%)",
      }}
    >
      <div className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 shadow-lg min-w-[200px]">
        {/* Address */}
        <p className="text-xs font-bold text-text-primary font-mono">
          {shortenAddress(bubble.counterpartyAddress, 6)}
          {bubble.isOwnWallet && (
            <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              YOUR WALLET
            </span>
          )}
        </p>

        {/* Stats */}
        <div className="mt-1.5 space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Transactions</span>
            <span className="text-text-primary font-medium">
              {formatNumber(bubble.transactionCount)}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Volume</span>
            <span className="text-text-primary font-medium">
              {formatSol(bubble.totalSolVolume)}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Buys / Sells</span>
            <span className="text-text-primary font-medium">
              {bubble.buyCount} / {bubble.sellCount}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Direction</span>
            <span className={`font-medium ${dir.color}`}>{dir.label}</span>
          </div>
          {bubble.transferCount > 0 && (
            <div className="flex justify-between text-[10px]">
              <span className="text-text-muted">Transfers</span>
              <span className="text-text-primary font-medium">
                {bubble.transferCount}
              </span>
            </div>
          )}
        </div>

        {/* Timerange */}
        <div className="mt-1.5 pt-1.5 border-t border-border-default">
          <p className="text-[9px] text-text-muted">
            {formatDateTime(bubble.firstInteraction)} — {formatDateTime(bubble.lastInteraction)}
          </p>
        </div>
      </div>
    </div>
  );
}
