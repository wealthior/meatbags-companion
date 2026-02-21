"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Trophy, Star, Shield, Skull, AlertTriangle, Lock } from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useAllGeocaches } from "@/hooks/use-geocaches";
import { useDeadbruvBadges } from "@/hooks/use-deadbruv-badges";
import { useWalletStore } from "@/stores/wallet-store";
import {
  calculateLoserboardStats,
  calculateLoserboardStatsFromDeadbruv,
  BADGE_DEFINITIONS,
} from "@/lib/domain/loserboard";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton, SectionLoadingIndicator } from "@/components/shared/loading-skeleton";
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

type BadgeTypeFilter = "all" | "stackable" | "once";
type BadgeStatusFilter = "all" | "earned" | "locked";

export default function LoserboardPage() {
  const { data: nftData, isLoading: nftLoading } = useAllNfts();
  const { data: geocacheData, isLoading: geocacheLoading } = useAllGeocaches();
  const {
    data: deadbruvBadges,
    isLoading: deadbruvLoading,
    isError: deadbruvError,
  } = useDeadbruvBadges();
  const wallets = useWalletStore((s) => s.wallets);

  // Filter state for All Badges table
  const [typeFilter, setTypeFilter] = useState<BadgeTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<BadgeStatusFilter>("all");

  // PRIMARY: deadbruv API badges + blockchain supplement → FALLBACK: blockchain only
  const useDeadbruv = !deadbruvError && deadbruvBadges && deadbruvBadges.length > 0;

  const stats = useMemo(() => {
    if (useDeadbruv) {
      return calculateLoserboardStatsFromDeadbruv(
        deadbruvBadges,
        nftData?.nfts ?? [],
        geocacheData?.geocaches ?? [],
      );
    }
    if (!nftData?.nfts) return null;
    return calculateLoserboardStats(
      nftData.nfts,
      [],
      false,
      geocacheData?.geocaches ?? [],
    );
  }, [useDeadbruv, deadbruvBadges, nftData, geocacheData]);

  const isLoading = nftLoading || (deadbruvLoading && !deadbruvError);

  // All hooks MUST be called before any early returns (Rules of Hooks)
  const earnedBadges = useMemo(() => {
    if (!stats) return [];
    return stats.badges.filter((b) => b.count > 0);
  }, [stats]);

  const earnedBadgeIds = useMemo(() => {
    return new Set(earnedBadges.map((eb) => eb.badge.id));
  }, [earnedBadges]);

  const unearnedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.filter((b) => !earnedBadgeIds.has(b.id));
  }, [earnedBadgeIds]);

  // Filtered badges for the All Badges table
  const filteredEarned = useMemo(() => {
    if (statusFilter === "locked") return [];
    return earnedBadges.filter((eb) => {
      if (typeFilter === "stackable" && !eb.badge.isStackable) return false;
      if (typeFilter === "once" && eb.badge.isStackable) return false;
      return true;
    });
  }, [earnedBadges, typeFilter, statusFilter]);

  const filteredUnearned = useMemo(() => {
    if (statusFilter === "earned") return [];
    return unearnedBadges.filter((b) => {
      if (typeFilter === "stackable" && !b.isStackable) return false;
      if (typeFilter === "once" && b.isStackable) return false;
      return true;
    });
  }, [unearnedBadges, typeFilter, statusFilter]);

  const totalBadgeCount = BADGE_DEFINITIONS.length;

  if (isLoading) return <PageLoadingSkeleton />;
  if (!stats) {
    return (
      <div className="text-center py-20 text-text-muted text-sm">
        Add wallets to view your Loserboard stats.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Loserboard" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Dead Points & badge tracker
        </p>
        {geocacheLoading && (
          <SectionLoadingIndicator label="Loading geocache badges..." />
        )}
        {deadbruvLoading && (
          <SectionLoadingIndicator label="Syncing badges from deadbruv..." />
        )}
      </div>

      {/* Fallback indicator */}
      {deadbruvError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rust/10 border border-rust/20 text-[10px] text-rust">
          <AlertTriangle size={12} />
          <span>deadbruv.com unavailable — showing blockchain-estimated badges</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
          subValue={`of ${totalBadgeCount}`}
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
      <div className="bg-bg-surface border border-border-default rounded-lg p-3 sm:p-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 sm:mb-4">
          Tier Progress
        </h3>

        <div className="space-y-2 sm:space-y-3">
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
                        isCurrentTier ? "text-text-primary" : "text-text-muted",
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
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {earnedBadges.map(({ badge, count }) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-neon-green/5 border border-neon-green/20"
            >
              {badge.imageUrl ? (
                <div className="w-8 h-8 shrink-0">
                  <Image
                    src={badge.imageUrl}
                    alt={badge.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(57,255,20,0.3)]"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green shrink-0">
                  <Star size={14} />
                </div>
              )}
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
              <span className="text-xs text-neon-green font-medium shrink-0">
                +{formatNumber(badge.points * count)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All Badges Table — earned + locked with filters */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default space-y-2">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            All Badges ({earnedBadges.length}/{totalBadgeCount})
          </h3>
          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {/* Type filters */}
            {(["all", "stackable", "once"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-medium transition-colors cursor-pointer",
                  typeFilter === f
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "bg-bg-primary text-text-muted border border-border-default hover:border-border-accent",
                )}
              >
                {f === "all" ? "All Types" : f === "stackable" ? "Stackable" : "One-Time"}
              </button>
            ))}
            <span className="w-px h-5 bg-border-default self-center mx-1" />
            {/* Status filters */}
            {(["all", "earned", "locked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-medium transition-colors cursor-pointer",
                  statusFilter === f
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                    : "bg-bg-primary text-text-muted border border-border-default hover:border-border-accent",
                )}
              >
                {f === "all" ? "All Status" : f === "earned" ? "Earned" : "Locked"}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-[10px] text-text-secondary uppercase tracking-wider">
                <th className="text-left px-2 sm:px-4 py-2">Badge</th>
                <th className="text-left px-2 sm:px-4 py-2 hidden sm:table-cell">Description</th>
                <th className="text-right px-2 sm:px-4 py-2">Points</th>
                <th className="text-center px-2 sm:px-4 py-2">Type</th>
                <th className="text-center px-2 sm:px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Earned badges */}
              {filteredEarned.map(({ badge, count }) => (
                <tr
                  key={badge.id}
                  className="border-b border-border-default/50 transition-colors bg-neon-green/[0.02]"
                >
                  <td className="px-2 sm:px-4 py-2 text-xs text-text-primary font-medium">
                    <div className="flex items-center gap-2">
                      {badge.imageUrl ? (
                        <Image
                          src={badge.imageUrl}
                          alt={badge.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 object-contain"
                          unoptimized
                        />
                      ) : (
                        <Star size={14} className="text-neon-green shrink-0" />
                      )}
                      {badge.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-[10px] text-text-muted hidden sm:table-cell">
                    {badge.description}
                  </td>
                  <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-secondary">
                    {badge.isStackable && count > 1
                      ? `${formatNumber(badge.points)} × ${count}`
                      : formatNumber(badge.points)}
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                        badge.isStackable
                          ? "bg-toxic-purple/10 text-toxic-purple border border-toxic-purple/20"
                          : "bg-rust/10 text-rust border border-rust/20",
                      )}
                    >
                      {badge.isStackable ? "Stackable" : "Once"}
                    </span>
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2 text-xs">
                    <span className="text-neon-green">
                      {count > 1 ? `x${count}` : "✓"}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Locked / unearned badges */}
              {filteredUnearned.map((badge) => (
                <tr
                  key={badge.id}
                  className="border-b border-border-default/50 transition-colors opacity-40"
                >
                  <td className="px-2 sm:px-4 py-2 text-xs text-text-muted font-medium">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-text-muted shrink-0" />
                      {badge.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-[10px] text-text-muted hidden sm:table-cell">
                    {badge.description}
                  </td>
                  <td className="text-right px-2 sm:px-4 py-2 text-xs text-text-muted">
                    {formatNumber(badge.points)}
                    {badge.isStackable && <span className="text-[9px]">/ea</span>}
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                        badge.isStackable
                          ? "bg-toxic-purple/10 text-toxic-purple border border-toxic-purple/20"
                          : "bg-rust/10 text-rust border border-rust/20",
                      )}
                    >
                      {badge.isStackable ? "Stackable" : "Once"}
                    </span>
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2 text-xs">
                    <span className="text-text-muted">🔒</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
