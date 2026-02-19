"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { MeatbagNft, MaskColor } from "@/types/nft";
import { NftCard } from "./nft-card";
import { TraitBadge } from "./trait-badge";
import { MASK_COLORS_BY_YIELD } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

interface NftGridProps {
  nfts: MeatbagNft[];
  walletNames?: Record<string, string>;
}

type SortOption = "name" | "yield-desc" | "yield-asc" | "wallet";

export function NftGrid({ nfts, walletNames = {} }: NftGridProps) {
  const [search, setSearch] = useState("");
  const [selectedMask, setSelectedMask] = useState<MaskColor | "all">("all");
  const [selectedWallet, setSelectedWallet] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("yield-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique wallets
  const uniqueWallets = useMemo(() => {
    const wallets = new Set(nfts.map((n) => n.ownerWallet));
    return Array.from(wallets);
  }, [nfts]);

  // Filter and sort
  const filteredNfts = useMemo(() => {
    let result = [...nfts];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.mintAddress.toLowerCase().includes(q)
      );
    }

    // Mask filter
    if (selectedMask !== "all") {
      result = result.filter((n) => n.maskColor === selectedMask);
    }

    // Wallet filter
    if (selectedWallet !== "all") {
      result = result.filter((n) => n.ownerWallet === selectedWallet);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "yield-desc":
        result.sort((a, b) => b.dailyYield - a.dailyYield);
        break;
      case "yield-asc":
        result.sort((a, b) => a.dailyYield - b.dailyYield);
        break;
      case "wallet":
        result.sort((a, b) => a.ownerWallet.localeCompare(b.ownerWallet));
        break;
    }

    return result;
  }, [nfts, search, selectedMask, selectedWallet, sortBy]);

  // Mask color counts
  const maskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const nft of nfts) {
      counts[nft.maskColor] = (counts[nft.maskColor] ?? 0) + 1;
    }
    return counts;
  }, [nfts]);

  return (
    <div className="space-y-4">
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by name or mint address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-default rounded-md pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green/30"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-xs border transition-colors cursor-pointer",
            showFilters
              ? "border-neon-green/30 text-neon-green bg-neon-green/5"
              : "border-border-default text-text-muted hover:text-text-primary"
          )}
        >
          <SlidersHorizontal size={12} />
          Filters
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-bg-surface border border-border-default rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-green/30 cursor-pointer"
        >
          <option value="yield-desc">Yield (High → Low)</option>
          <option value="yield-asc">Yield (Low → High)</option>
          <option value="name">Name (A → Z)</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-4">
          {/* Mask color filter */}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
              Mask Color
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedMask("all")}
                className={cn(
                  "px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer",
                  selectedMask === "all"
                    ? "border-neon-green/30 text-neon-green bg-neon-green/10"
                    : "border-border-default text-text-muted hover:text-text-primary"
                )}
              >
                All ({nfts.length})
              </button>
              {MASK_COLORS_BY_YIELD.map((color) => {
                const count = maskCounts[color] ?? 0;
                if (count === 0) return null;
                return (
                  <button
                    key={color}
                    onClick={() =>
                      setSelectedMask(selectedMask === color ? "all" : color)
                    }
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer",
                      selectedMask === color
                        ? "border-neon-green/30 bg-neon-green/10"
                        : "border-border-default hover:border-border-accent"
                    )}
                  >
                    <TraitBadge maskColor={color} size="sm" showLabel={false} />
                    <span className="text-text-secondary">
                      {color} ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet filter */}
          {uniqueWallets.length > 1 && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                Wallet
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedWallet("all")}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer",
                    selectedWallet === "all"
                      ? "border-neon-green/30 text-neon-green bg-neon-green/10"
                      : "border-border-default text-text-muted hover:text-text-primary"
                  )}
                >
                  All Wallets
                </button>
                {uniqueWallets.map((addr) => (
                  <button
                    key={addr}
                    onClick={() =>
                      setSelectedWallet(selectedWallet === addr ? "all" : addr)
                    }
                    className={cn(
                      "px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer",
                      selectedWallet === addr
                        ? "border-neon-green/30 text-neon-green bg-neon-green/10"
                        : "border-border-default text-text-muted hover:text-text-primary"
                    )}
                  >
                    {walletNames[addr] ??
                      `${addr.slice(0, 4)}...${addr.slice(-4)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">
          {filteredNfts.length} meatbag{filteredNfts.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Grid */}
      {filteredNfts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">
            The wasteland is empty, survivor.
          </p>
          <p className="text-text-muted text-xs mt-1">
            No MeatBags match your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredNfts.map((nft) => (
            <NftCard key={nft.mintAddress} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
