"use client";

import { useMemo } from "react";
import { Zap, TrendingUp, Calendar, Target, Loader2 } from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useWalletStore } from "@/stores/wallet-store";
import { useLoyaltyMultipliers } from "@/hooks/use-loyalty-multiplier";
import { calculateWalletPrepPoints, aggregateAcrossWallets } from "@/lib/domain/prep-points";
import { MASK_COLOR_CONFIG } from "@/lib/utils/constants";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { TraitBadge } from "@/components/nft/trait-badge";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber } from "@/lib/utils/format";
import type { MaskColor, LoyaltyMultiplier } from "@/types/nft";
import { cn } from "@/lib/utils/cn";

const MULTIPLIER_LABELS: Record<number, { label: string; color: string }> = {
  1.2: { label: "Presale 1.2x", color: "text-gold" },
  1.1: { label: "Public Mint 1.1x", color: "text-neon-green" },
  1.0: { label: "Secondary 1.0x", color: "text-text-muted" },
};

export default function PrepPointsPage() {
  const { data, isLoading } = useAllNfts();
  const wallets = useWalletStore((s) => s.wallets);
  const { multipliers, isDetecting } = useLoyaltyMultipliers();

  const aggregated = useMemo(() => {
    if (!data?.byWallet) return null;

    const walletResults = wallets.map((w) => {
      const nfts = data.byWallet[w.address] ?? [];
      const multiplier: LoyaltyMultiplier = multipliers[w.address] ?? 1.0;
      return {
        walletAddress: w.address,
        walletName: w.name,
        multiplier,
        points: calculateWalletPrepPoints(nfts, multiplier),
      };
    });

    return {
      ...aggregateAcrossWallets(walletResults),
      walletDetails: walletResults,
    };
  }, [data, wallets, multipliers]);

  if (isLoading) return <PageLoadingSkeleton />;
  if (!aggregated) {
    return (
      <div className="text-center py-20 text-text-muted text-sm">
        Add wallets to calculate Prep Points.
      </div>
    );
  }

  const { projections, byMaskColor, walletDetails } = aggregated;

  // Sort mask breakdown by total daily yield
  const maskBreakdown = Object.entries(byMaskColor)
    .filter(([_, v]) => v.count > 0)
    .sort((a, b) => b[1].dailyTotal - a[1].dailyTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Prep Points" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Staking yield calculator
          {isDetecting && (
            <span className="inline-flex items-center gap-1 ml-2 text-gold">
              <Loader2 size={9} className="animate-spin" />
              Detecting multipliers...
            </span>
          )}
        </p>
      </div>

      {/* Projection Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Daily Yield"
          value={formatNumber(projections.daily)}
          icon={Zap}
          accent="green"
        />
        <StatCard
          label="Weekly Yield"
          value={formatNumber(projections.weekly)}
          icon={Calendar}
          accent="gold"
        />
        <StatCard
          label="Monthly Yield"
          value={formatNumber(projections.monthly)}
          icon={TrendingUp}
          accent="purple"
        />
        <StatCard
          label="Yearly Yield"
          value={formatNumber(projections.yearly)}
          icon={Target}
          accent="rust"
        />
      </div>

      {/* Breakdown by Mask Color */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Yield by Mask Color
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-[10px] text-text-secondary uppercase tracking-wider">
                <th className="text-left px-2 sm:px-4 py-2">Mask</th>
                <th className="text-right px-2 sm:px-4 py-2">Count</th>
                <th className="text-right px-2 sm:px-4 py-2 hidden sm:table-cell">Base Yield</th>
                <th className="text-right px-2 sm:px-4 py-2">Daily Total</th>
                <th className="text-right px-2 sm:px-4 py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {maskBreakdown.map(([color, { count, dailyTotal }]) => {
                const baseYield = MASK_COLOR_CONFIG[color as MaskColor]?.dailyYield ?? 0;
                const pct = projections.daily > 0
                  ? ((dailyTotal / projections.daily) * 100).toFixed(1)
                  : "0";

                return (
                  <tr
                    key={color}
                    className="border-b border-border-default/50 hover:bg-bg-hover/30 transition-colors"
                  >
                    <td className="px-2 sm:px-4 py-2">
                      <TraitBadge maskColor={color as MaskColor} size="sm" />
                    </td>
                    <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-secondary">
                      {count}
                    </td>
                    <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-secondary hidden sm:table-cell">
                      {formatNumber(baseYield)}
                    </td>
                    <td className="text-right px-2 sm:px-4 py-2 text-xs text-neon-green font-medium">
                      {formatNumber(dailyTotal)}
                    </td>
                    <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-muted">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-bg-hover/20">
                <td className="px-2 sm:px-4 py-2 text-xs font-bold text-text-primary uppercase">
                  Total
                </td>
                <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-primary font-bold">
                  {formatNumber(data?.nfts.length ?? 0)}
                </td>
                <td className="text-right px-2 sm:px-4 py-2 hidden sm:table-cell" />
                <td className="text-right px-2 sm:px-4 py-2 text-xs text-neon-green font-bold text-glow-green">
                  {formatNumber(projections.daily)}
                </td>
                <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-muted">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Breakdown by Wallet */}
      {walletDetails.length > 0 && (
        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Yield by Wallet
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-[10px] text-text-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Wallet</th>
                  <th className="text-center px-4 py-2">Multiplier</th>
                  <th className="text-right px-4 py-2">Daily Yield</th>
                  <th className="text-right px-4 py-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {walletDetails.map((wd) => {
                  const label = MULTIPLIER_LABELS[wd.multiplier] ?? MULTIPLIER_LABELS[1.0];
                  return (
                    <tr
                      key={wd.walletAddress}
                      className="border-b border-border-default/50 hover:bg-bg-hover/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-xs text-text-secondary">
                        {wd.walletName}{" "}
                        <span className="text-text-muted">
                          ({wd.walletAddress.slice(0, 4)}...{wd.walletAddress.slice(-4)})
                        </span>
                      </td>
                      <td className="text-center px-4 py-2">
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded border font-medium",
                            wd.multiplier === 1.2
                              ? "bg-gold/10 text-gold border-gold/20"
                              : wd.multiplier === 1.1
                                ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                                : "bg-bg-hover text-text-muted border-border-default"
                          )}
                        >
                          {label.label}
                        </span>
                      </td>
                      <td className="text-right px-4 py-2 text-xs text-neon-green font-medium">
                        {formatNumber(wd.points.totalDaily)}
                      </td>
                      <td className="text-right px-4 py-2 text-xs text-text-muted">
                        {projections.daily > 0
                          ? ((wd.points.totalDaily / projections.daily) * 100).toFixed(1)
                          : "0"}
                        %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
