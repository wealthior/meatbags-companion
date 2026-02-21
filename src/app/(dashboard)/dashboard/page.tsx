"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Grid3X3,
  Zap,
  Trophy,
  Wallet,
  TrendingUp,
  ExternalLink,
  DollarSign,
  Lock,
  Tag,
} from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useAllGeocaches } from "@/hooks/use-geocaches";
import { useSolPrice } from "@/hooks/use-sol-price";
import { useCollectionStats } from "@/hooks/use-collection-stats";
import { useWalletStore } from "@/stores/wallet-store";
import { calculateLoserboardStats } from "@/lib/domain/loserboard";
import { getTraitDistribution } from "@/lib/domain/wallet-aggregator";
import { MASK_COLOR_CONFIG, MAGICEDEN_COLLECTION_URL, TIER_CONFIGS } from "@/lib/utils/constants";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { TraitBadge } from "@/components/nft/trait-badge";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber, formatSol, formatUsd } from "@/lib/utils/format";
import type { MaskColor } from "@/types/nft";

export default function DashboardPage() {
  const { data: nftData, isLoading: nftsLoading, isError: nftsError, refetch } = useAllNfts();
  const { data: geocacheData } = useAllGeocaches();
  const { data: solPrice } = useSolPrice();
  const { data: collectionStats } = useCollectionStats();
  const wallets = useWalletStore((s) => s.wallets);

  // Check if any tracked wallet is an original minter (multiplier > 1.0)
  const isOriginalMinter = wallets.some(
    (w) => w.detectedMultiplier !== undefined && w.detectedMultiplier > 1.0
  );

  const loserboardStats = useMemo(() => {
    if (!nftData?.nfts) return null;
    return calculateLoserboardStats(nftData.nfts, [], isOriginalMinter, geocacheData?.geocaches ?? []);
  }, [nftData, isOriginalMinter, geocacheData]);

  const traitDist = useMemo(() => {
    if (!nftData?.nfts) return [];
    return getTraitDistribution(nftData.nfts);
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

  if (nftsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-3 h-3 rounded-full bg-blood rad-pulse" />
        <p className="text-text-muted text-sm text-center">
          Failed to load NFT data from the wasteland.
          <br />
          <span className="text-[10px]">Check your Helius API key or try again.</span>
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider bg-rust/10 border border-rust/30 text-rust hover:bg-rust/20 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const nfts = nftData?.nfts ?? [];
  const stakedCount = nfts.filter((n) => n.isStaked).length;
  const listedNfts = nfts.filter((n) => n.isListed);
  const listedCount = listedNfts.length;
  const listedMarketplaces = [...new Set(listedNfts.map((n) => n.listedMarketplace).filter(Boolean))];
  const portfolioValueSol = nfts.length * (collectionStats?.floorPrice ?? 0);
  const portfolioValueUsd = portfolioValueSol * (solPrice?.usd ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <GlitchText text="Dashboard" className="text-lg text-text-primary" />
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
              Wasteland command center
            </p>
          </div>
          {/* Achievement badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Billionaire badge — 20+ MeatBags */}
            {nfts.length >= 20 && (
              <div className="relative group cursor-default">
                <div className="absolute inset-0 rounded-full bg-gold/20 blur-lg group-hover:bg-gold/30 transition-colors" />
                <Image
                  src="/Billionaire-Logo.png"
                  alt="Billionaire"
                  width={44}
                  height={44}
                  className="relative drop-shadow-[0_0_12px_rgba(255,215,0,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] transition-all group-hover:scale-110"
                />
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-gold uppercase tracking-wider font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Billionaire
                </span>
              </div>
            )}
            {/* Illegal Alien badge — 50+ MeatBags */}
            {nfts.length >= 50 && (
              <div className="relative group cursor-default">
                <div className="absolute inset-0 rounded-full bg-neon-green/15 blur-lg group-hover:bg-neon-green/25 transition-colors" />
                <Image
                  src="/Illegal-Alien.svg"
                  alt="Illegal Alien"
                  width={44}
                  height={44}
                  className="relative drop-shadow-[0_0_12px_rgba(57,255,20,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(57,255,20,0.6)] transition-all group-hover:scale-110"
                />
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-neon-green uppercase tracking-wider font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Illegal Alien
                </span>
              </div>
            )}
          </div>
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

      {/* ── Collection Stats ── */}
      {collectionStats && (
        <div className="space-y-3">
          <h3 className="text-[10px] text-rust uppercase tracking-widest font-bold">
            Collection — MagicEden
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Floor Price"
              value={formatSol(collectionStats.floorPrice)}
              accent="green"
            />
            <StatCard
              label="Total Listed"
              value={formatNumber(collectionStats.listedCount)}
              subValue="on marketplace"
              accent="rust"
            />
            <StatCard
              label="Total Volume"
              value={formatSol(collectionStats.volumeAll)}
              accent="purple"
            />
            <StatCard
              label="Wallets Tracked"
              value={String(wallets.length)}
              icon={Wallet}
              accent="rust"
            />
          </div>
        </div>
      )}

      {/* ── Your Wallets ── */}
      <div className="space-y-3">
        <h3 className="text-[10px] text-neon-green uppercase tracking-widest font-bold">
          Your Wallets — {wallets.length} vault{wallets.length !== 1 ? "s" : ""}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total MeatBags"
            value={formatNumber(nfts.length)}
            icon={Grid3X3}
            accent="green"
          />
          <StatCard
            label="Staked"
            value={`${stakedCount}/${nfts.length}`}
            subValue={stakedCount > 0 ? `${Math.round((stakedCount / nfts.length) * 100)}% locked` : "None staked"}
            icon={Lock}
            accent="green"
          />
          <StatCard
            label="Listed"
            value={String(listedCount)}
            subValue={listedMarketplaces.length > 0 ? listedMarketplaces.join(", ") : "None listed"}
            icon={Tag}
            accent="rust"
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
            customColor={TIER_CONFIGS.find((t) => t.tier === loserboardStats?.currentTier)?.color}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mask Distribution */}
        {traitDist.length > 0 && (() => {
          const maxCount = traitDist[0].count;
          return (
            <div className="bg-bg-surface border border-border-default rounded-lg p-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
                Your Mask Distribution
              </h3>
              <div className="space-y-1.5">
                {traitDist.map(({ trait, count, percentage }) => {
                  const config = MASK_COLOR_CONFIG[trait as MaskColor];
                  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={trait} className="flex items-center gap-2">
                      <div className="w-[90px] shrink-0">
                        <TraitBadge maskColor={trait as MaskColor} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 bg-bg-primary rounded overflow-hidden">
                          <div
                            className="h-full rounded transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: config?.hexColor ?? "#39ff14",
                              boxShadow: `0 0 8px ${config?.hexColor ?? "#39ff14"}40`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-text-primary font-medium w-6 text-right shrink-0">
                        {count}
                      </span>
                      <span className="text-[9px] text-text-secondary w-9 text-right shrink-0">
                        {percentage.toFixed(0)}%
                      </span>
                      <span className="text-[8px] text-text-muted w-12 text-right shrink-0 hidden md:block">
                        {formatNumber(config?.dailyYield ?? 0)}/d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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
