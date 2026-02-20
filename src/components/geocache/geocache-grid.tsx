"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ExternalLink, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react";
import type { GeocacheNft, GeocacheTier, GeocacheSeries } from "@/types/geocache";
import { cn } from "@/lib/utils/cn";
import { formatSol } from "@/lib/utils/format";

interface GeocacheGridProps {
  geocaches: GeocacheNft[];
  walletNames?: Record<string, string>;
}

type FilterTier = "all" | GeocacheTier;
type FilterSeries = "all" | GeocacheSeries;
type ViewSize = "small" | "medium" | "large";

/** Grid column classes per view size */
const GRID_CLASSES: Record<ViewSize, string> = {
  small: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2",
  medium: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
  large: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3",
};

/** Image sizes hint per view size */
const IMAGE_SIZES: Record<ViewSize, string> = {
  small: "(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw",
  medium: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw",
  large: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
};

/** View toggle button config */
const VIEW_OPTIONS: { size: ViewSize; icon: typeof Grid3X3; title: string }[] = [
  { size: "small", icon: LayoutGrid, title: "Small view" },
  { size: "medium", icon: Grid3X3, title: "Medium view" },
  { size: "large", icon: Grid2X2, title: "Large view" },
];

/** Tier badge color classes */
const TIER_BADGE: Record<GeocacheTier, string> = {
  Common: "bg-text-secondary/10 text-text-secondary border-text-secondary/20",
  Rare: "bg-gold/10 text-gold border-gold/20",
};

/** Series badge color classes */
const SERIES_BADGE: Record<GeocacheSeries, string> = {
  "Bounty Box I": "bg-neon-green/10 text-neon-green border-neon-green/20",
  "Bounty Box II": "bg-rust/10 text-rust border-rust/20",
  "Shit Box": "bg-toxic-purple/10 text-toxic-purple border-toxic-purple/20",
  "Halloween": "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/20",
  "Merry Crisis": "bg-[#e53e3e]/10 text-[#e53e3e] border-[#e53e3e]/20",
};

/**
 * Grid display of GeoCaches NFTs with tier/series filtering and adjustable view sizes.
 * Defaults to small/compact gallery view.
 */
export function GeocacheGrid({ geocaches, walletNames }: GeocacheGridProps) {
  const [filterTier, setFilterTier] = useState<FilterTier>("all");
  const [filterSeries, setFilterSeries] = useState<FilterSeries>("all");
  const [viewSize, setViewSize] = useState<ViewSize>("small");

  const filtered = useMemo(() => {
    let result = geocaches;
    if (filterTier !== "all") result = result.filter((gc) => gc.tier === filterTier);
    if (filterSeries !== "all") result = result.filter((gc) => gc.series === filterSeries);
    return result;
  }, [geocaches, filterTier, filterSeries]);

  if (geocaches.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-xs">
        No GeoCaches found in your vaults, survivor.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters + View toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Filter:</span>

        {/* Tier filter */}
        <div className="flex items-center gap-1">
          {(["all", "Common", "Rare"] as FilterTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={cn(
                "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border transition-colors cursor-pointer",
                filterTier === tier
                  ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                  : "text-text-muted border-border-default hover:border-border-accent",
              )}
            >
              {tier === "all" ? "All Tiers" : tier}
            </button>
          ))}
        </div>

        <span className="text-border-default">|</span>

        {/* Series filter */}
        <div className="flex flex-wrap items-center gap-1">
          {(["all", "Bounty Box I", "Bounty Box II", "Shit Box"] as FilterSeries[]).map((series) => (
            <button
              key={series}
              onClick={() => setFilterSeries(series)}
              className={cn(
                "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border transition-colors cursor-pointer",
                filterSeries === series
                  ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                  : "text-text-muted border-border-default hover:border-border-accent",
              )}
            >
              {series === "all" ? "All Series" : series}
            </button>
          ))}
        </div>

        {/* Spacer + count + view toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-text-muted">
            {filtered.length} of {geocaches.length}
          </span>

          {/* View size toggle */}
          <div className="flex items-center gap-0.5 border border-border-default rounded-md p-0.5">
            {VIEW_OPTIONS.map(({ size, icon: Icon, title }) => (
              <button
                key={size}
                onClick={() => setViewSize(size)}
                className={cn(
                  "p-1 rounded transition-colors cursor-pointer",
                  viewSize === size
                    ? "text-neon-green bg-neon-green/10"
                    : "text-text-muted hover:text-text-primary",
                )}
                title={title}
              >
                <Icon size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={cn("grid", GRID_CLASSES[viewSize])}>
        {filtered.map((gc) => (
          <GeocacheCard
            key={gc.mintAddress}
            geocache={gc}
            walletName={walletNames?.[gc.ownerWallet]}
            viewSize={viewSize}
          />
        ))}
      </div>

      {filtered.length === 0 && geocaches.length > 0 && (
        <div className="text-center py-8 text-text-muted text-xs">
          No GeoCaches match the selected filters.
        </div>
      )}
    </div>
  );
}

/**
 * Single geocache card — adapts to view size
 */
function GeocacheCard({
  geocache,
  walletName,
  viewSize,
}: {
  geocache: GeocacheNft;
  walletName?: string;
  viewSize: ViewSize;
}) {
  const isSmall = viewSize === "small";

  return (
    <div className="group bg-bg-surface border border-border-default rounded-lg overflow-hidden hover:border-border-accent transition-colors">
      {/* Image */}
      <div className="aspect-square relative bg-bg-hover">
        {geocache.imageUrl ? (
          <Image
            src={geocache.imageUrl}
            alt={geocache.name}
            fill
            sizes={IMAGE_SIZES[viewSize]}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            ?
          </div>
        )}

        {/* Listed price overlay */}
        {geocache.isListed && geocache.listingPriceSol && (
          <div className={cn(
            "absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-bg-void/80 text-rust font-medium",
            isSmall ? "text-[7px]" : "text-[9px]",
          )}>
            {formatSol(geocache.listingPriceSol)}
          </div>
        )}

        {/* ME link on hover */}
        <a
          href={geocache.magicEdenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-1 right-1 p-1 rounded bg-bg-void/60 text-text-muted opacity-0 group-hover:opacity-100 hover:text-neon-green transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={isSmall ? 8 : 10} />
        </a>
      </div>

      {/* Info */}
      <div className={cn("space-y-1", isSmall ? "p-1.5" : "p-2 space-y-1.5")}>
        <p className={cn(
          "text-text-primary font-medium truncate",
          isSmall ? "text-[8px]" : "text-[10px]",
        )}>
          {geocache.name}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className={cn(
              "px-1 py-0.5 rounded uppercase tracking-wider font-medium border",
              isSmall ? "text-[6px]" : "text-[8px] px-1.5",
              TIER_BADGE[geocache.tier],
            )}
          >
            {geocache.tier}
          </span>
          {!isSmall && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-medium border",
                SERIES_BADGE[geocache.series],
              )}
            >
              {geocache.series}
            </span>
          )}
        </div>

        {/* Wallet name — hidden on small view */}
        {!isSmall && walletName && (
          <p className="text-[8px] text-text-muted truncate">
            {walletName}
          </p>
        )}
      </div>
    </div>
  );
}
