"use client";

import { useMemo } from "react";
import { Trophy, Star, Shield, Skull } from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { calculateLoserboardStats, BADGE_DEFINITIONS } from "@/lib/domain/loserboard";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber } from "@/lib/utils/format";
import { TIER_CONFIGS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { LoserboardTier } from "@/types/loserboard";

const TIER_ICONS: Record<LoserboardTier, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Immortal: "💀",
};

export default function LoserboardPage() {
  const { data, isLoading } = useAllNfts();

  const stats = useMemo(() => {
    if (!data?.nfts) return null;
    return calculateLoserboardStats(data.nfts);
  }, [data]);

  if (isLoading) return <PageLoadingSkeleton />;
  if (!stats) {
    return (
      <div className="text-center py-20 text-text-muted text-sm">
        Add wallets to view your Loserboard stats.
      </div>
    );
  }

  const earnedBadges = stats.badges.filter((b) => b.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Loserboard" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Dead Points & badge tracker
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Dead Points"
          value={formatNumber(stats.deadPoints)}
          icon={Skull}
          accent="green"
        />
        <StatCard
          label="Current Tier"
          value={`${TIER_ICONS[stats.currentTier]} ${stats.currentTier}`}
          icon={Trophy}
          accent="gold"
        />
        <StatCard
          label="Badges Earned"
          value={String(earnedBadges.length)}
          subValue={`of ${BADGE_DEFINITIONS.length}`}
          icon={Star}
          accent="purple"
        />
        <StatCard
          label="To Next Tier"
          value={stats.pointsToNextTier > 0 ? formatNumber(stats.pointsToNextTier) : "MAX"}
          icon={Shield}
          accent="rust"
        />
      </div>

      {/* Tier Progress */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
          Tier Progress
        </h3>

        <div className="space-y-3">
          {TIER_CONFIGS.map((tier) => {
            const isCurrentTier = tier.tier === stats.currentTier;
            const isAchieved = stats.deadPoints >= tier.minPoints;
            let progress = 0;

            if (isCurrentTier) {
              progress = stats.tierProgress * 100;
            } else if (isAchieved) {
              progress = 100;
            }

            return (
              <div key={tier.tier} className="flex items-center gap-3">
                <span className="text-lg w-8">{TIER_ICONS[tier.tier]}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isCurrentTier ? "text-text-primary" : "text-text-muted"
                      )}
                    >
                      {tier.tier}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatNumber(tier.minPoints)}
                      {tier.maxPoints !== Infinity ? ` - ${formatNumber(tier.maxPoints)}` : "+"}
                    </span>
                  </div>
                  <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: tier.color,
                        boxShadow: isCurrentTier ? `0 0 8px ${tier.color}60` : "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Earned Badges */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Earned Badges ({earnedBadges.length})
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {earnedBadges.map(({ badge, count }) => (
            <div
              key={badge.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-neon-green/5 border border-neon-green/20"
            >
              <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
                <Star size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {badge.name}
                  {count > 1 && (
                    <span className="text-neon-green ml-1">x{count}</span>
                  )}
                </p>
                <p className="text-[10px] text-text-muted truncate">
                  {badge.description}
                </p>
              </div>
              <span className="text-xs text-neon-green font-medium">
                +{formatNumber(badge.points * count)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All Badges Reference */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            All Badges ({BADGE_DEFINITIONS.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-[10px] text-text-muted uppercase tracking-wider">
                <th className="text-left px-4 py-2">Badge</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-right px-4 py-2">Points</th>
                <th className="text-center px-4 py-2">Type</th>
                <th className="text-center px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {BADGE_DEFINITIONS.map((badge) => {
                const earned = earnedBadges.find(
                  (eb) => eb.badge.id === badge.id
                );
                return (
                  <tr
                    key={badge.id}
                    className={cn(
                      "border-b border-border-default/50 transition-colors",
                      earned
                        ? "bg-neon-green/[0.02]"
                        : "opacity-50"
                    )}
                  >
                    <td className="px-4 py-2 text-xs text-text-primary font-medium">
                      {badge.name}
                    </td>
                    <td className="px-4 py-2 text-[10px] text-text-muted">
                      {badge.description}
                    </td>
                    <td className="text-right px-4 py-2 text-xs text-text-secondary">
                      {formatNumber(badge.points)}
                    </td>
                    <td className="text-center px-4 py-2">
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                          badge.isStackable
                            ? "bg-toxic-purple/10 text-toxic-purple border border-toxic-purple/20"
                            : "bg-rust/10 text-rust border border-rust/20"
                        )}
                      >
                        {badge.isStackable ? "Stack" : "Once"}
                      </span>
                    </td>
                    <td className="text-center px-4 py-2 text-xs">
                      {earned ? (
                        <span className="text-neon-green">
                          {earned.count > 1 ? `x${earned.count}` : "✓"}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
