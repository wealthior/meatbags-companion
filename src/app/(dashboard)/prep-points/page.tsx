"use client";

import { useMemo } from "react";
import { Zap, TrendingUp, Calendar, Target } from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useWalletStore } from "@/stores/wallet-store";
import { calculateWalletPrepPoints, aggregateAcrossWallets } from "@/lib/domain/prep-points";
import { MASK_COLOR_CONFIG } from "@/lib/utils/constants";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { TraitBadge } from "@/components/nft/trait-badge";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber } from "@/lib/utils/format";
import type { MaskColor } from "@/types/nft";

export default function PrepPointsPage() {
  const { data, isLoading } = useAllNfts();
  const wallets = useWalletStore((s) => s.wallets);

  const aggregated = useMemo(() => {
    if (!data?.byWallet) return null;

    const walletResults = wallets.map((w) => {
      const nfts = data.byWallet[w.address] ?? [];
      return {
        walletAddress: w.address,
        walletName: w.name,
        points: calculateWalletPrepPoints(nfts),
      };
    });

    return aggregateAcrossWallets(walletResults);
  }, [data, wallets]);

  if (isLoading) return <PageLoadingSkeleton />;
  if (!aggregated) {
    return (
      <div className="text-center py-20 text-text-muted text-sm">
        Add wallets to calculate Prep Points.
      </div>
    );
  }

  const { projections, byMaskColor, byWallet } = aggregated;

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
      {Object.keys(byWallet).length > 1 && (
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
                  <th className="text-right px-4 py-2">Daily Yield</th>
                  <th className="text-right px-4 py-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byWallet).map(([name, daily]) => (
                  <tr
                    key={name}
                    className="border-b border-border-default/50 hover:bg-bg-hover/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      {name}
                    </td>
                    <td className="text-right px-4 py-2 text-xs text-neon-green font-medium">
                      {formatNumber(daily)}
                    </td>
                    <td className="text-right px-4 py-2 text-xs text-text-muted">
                      {projections.daily > 0
                        ? ((daily / projections.daily) * 100).toFixed(1)
                        : "0"}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
