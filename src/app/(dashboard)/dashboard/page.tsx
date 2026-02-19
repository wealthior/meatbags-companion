"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Grid3X3,
  Zap,
  Trophy,
  Wallet,
  TrendingUp,
  ExternalLink,
  DollarSign,
  Users,
} from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useSolPrice } from "@/hooks/use-sol-price";
import { useCollectionStats } from "@/hooks/use-collection-stats";
import { useWalletStore } from "@/stores/wallet-store";
import { calculateWalletPrepPoints, aggregateAcrossWallets } from "@/lib/domain/prep-points";
import { calculateLoserboardStats } from "@/lib/domain/loserboard";
import { getTraitDistribution } from "@/lib/domain/wallet-aggregator";
import { MASK_COLOR_CONFIG, MAGICEDEN_COLLECTION_URL } from "@/lib/utils/constants";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { TraitBadge } from "@/components/nft/trait-badge";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber, formatSol, formatUsd } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MaskColor } from "@/types/nft";

export default function DashboardPage() {
  const { data: nftData, isLoading: nftsLoading } = useAllNfts();
  const { data: solPrice } = useSolPrice();
  const { data: collectionStats } = useCollectionStats();
  const wallets = useWalletStore((s) => s.wallets);

  const prepPointsAgg = useMemo(() => {
    if (!nftData?.byWallet) return null;
    const walletResults = wallets.map((w) => ({
      walletAddress: w.address,
      walletName: w.name,
      points: calculateWalletPrepPoints(nftData.byWallet[w.address] ?? []),
    }));
    return aggregateAcrossWallets(walletResults);
  }, [nftData, wallets]);

  const loserboardStats = useMemo(() => {
    if (!nftData?.nfts) return null;
    return calculateLoserboardStats(nftData.nfts);
  }, [nftData]);

  const traitDist = useMemo(() => {
    if (!nftData?.nfts) return [];
    return getTraitDistribution(nftData.nfts).slice(0, 10);
  }, [nftData]);

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-3 h-3 rounded-full bg-neon-green rad-pulse" />
        <p className="text-text-muted text-sm text-center">
          The wasteland is empty, survivor.
          <br />
          Connect a vault to begin.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-colors"
        >
          Add Wallet
        </Link>
      </div>
    );
  }

  if (nftsLoading) return <PageLoadingSkeleton />;

  const nfts = nftData?.nfts ?? [];
  const portfolioValueSol = nfts.length * (collectionStats?.floorPrice ?? 0);
  const portfolioValueUsd = portfolioValueSol * (solPrice?.usd ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <GlitchText text="Dashboard" className="text-lg text-text-primary" />
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Wasteland command center
          </p>
        </div>
        {solPrice && (
          <div className="text-right">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              SOL Price
            </p>
            <p className="text-sm text-neon-green font-medium">
              {formatUsd(solPrice.usd)}
            </p>
          </div>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total MeatBags"
          value={formatNumber(nfts.length)}
          icon={Grid3X3}
          accent="green"
        />
        <StatCard
          label="Daily Prep Points"
          value={formatNumber(prepPointsAgg?.projections.daily ?? 0)}
          icon={Zap}
          accent="gold"
        />
        <StatCard
          label="Portfolio Value"
          value={formatSol(portfolioValueSol)}
          subValue={portfolioValueUsd > 0 ? formatUsd(portfolioValueUsd) : undefined}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Tier"
          value={loserboardStats?.currentTier ?? "—"}
          subValue={loserboardStats ? `${formatNumber(loserboardStats.deadPoints)} Dead Points` : undefined}
          icon={Trophy}
          accent="purple"
        />
      </div>

      {/* Collection Stats from MagicEden */}
      {collectionStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Floor Price"
            value={formatSol(collectionStats.floorPrice)}
            accent="green"
          />
          <StatCard
            label="Listed"
            value={formatNumber(collectionStats.listedCount)}
            accent="rust"
          />
          <StatCard
            label="Holders"
            value={formatNumber(collectionStats.uniqueHolders)}
            icon={Users}
            accent="purple"
          />
          <StatCard
            label="Wallets Tracked"
            value={String(wallets.length)}
            icon={Wallet}
            accent="rust"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trait Distribution */}
        {traitDist.length > 0 && (
          <div className="bg-bg-surface border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
              Your Trait Distribution
            </h3>
            <div className="space-y-2">
              {traitDist.map(({ trait, count, percentage }) => (
                <div key={trait} className="flex items-center gap-3">
                  <TraitBadge maskColor={trait as MaskColor} size="sm" />
                  <div className="flex-1">
                    <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            MASK_COLOR_CONFIG[trait as MaskColor]?.hexColor ?? "#39ff14",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted w-12 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/collection", label: "Collection", icon: Grid3X3, color: "neon-green" },
              { href: "/prep-points", label: "Prep Points", icon: Zap, color: "gold" },
              { href: "/loserboard", label: "Loserboard", icon: Trophy, color: "toxic-purple" },
              { href: "/history", label: "History", icon: TrendingUp, color: "rust" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 p-3 rounded-lg border border-border-default hover:border-border-accent hover:bg-bg-hover/30 transition-all group"
              >
                <link.icon size={14} className="text-text-muted group-hover:text-neon-green transition-colors" />
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <a
            href={MAGICEDEN_COLLECTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-3 p-3 rounded-lg border border-border-default hover:border-rust/30 hover:bg-rust/5 transition-all group"
          >
            <ExternalLink size={14} className="text-text-muted group-hover:text-rust transition-colors" />
            <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
              MagicEden Marketplace
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
