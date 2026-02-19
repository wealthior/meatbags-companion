"use client";

import { Grid3X3, Zap, Wallet, ExternalLink } from "lucide-react";
import { useAllNfts } from "@/hooks/use-nfts";
import { useWalletStore } from "@/stores/wallet-store";
import { NftGrid } from "@/components/nft/nft-grid";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber } from "@/lib/utils/format";
import { MASK_COLOR_CONFIG, MAGICEDEN_COLLECTION_URL } from "@/lib/utils/constants";

export default function CollectionPage() {
  const { data, isLoading, error, refetch } = useAllNfts();
  const wallets = useWalletStore((s) => s.wallets);

  if (wallets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-sm">
          No vaults connected, survivor.
        </p>
        <p className="text-text-muted text-xs mt-1">
          Add a wallet to begin scanning the wasteland.
        </p>
      </div>
    );
  }

  if (isLoading) return <PageLoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-3 h-3 rounded-full bg-blood rad-pulse" />
        <p className="text-blood text-sm font-bold uppercase">
          Radiation Leak Detected
        </p>
        <p className="text-text-muted text-xs">
          {error.message}
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

  const nfts = data?.nfts ?? [];
  const walletNames = Object.fromEntries(
    wallets.map((w) => [w.address, w.name])
  );

  // Calculate total daily yield (defensive lookup for unknown mask colors)
  const totalDailyYield = nfts.reduce(
    (sum, nft) => sum + (MASK_COLOR_CONFIG[nft.maskColor]?.dailyYield ?? 0),
    0
  );

  // Count unique mask colors
  const uniqueMasks = new Set(nfts.map((n) => n.maskColor)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <GlitchText text="Collection" className="text-lg text-text-primary" />
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Your MeatBags armory
          </p>
        </div>
        <a
          href={MAGICEDEN_COLLECTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] text-text-muted border border-border-default hover:border-border-accent hover:text-text-primary transition-colors"
        >
          <ExternalLink size={10} />
          MagicEden
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total MeatBags"
          value={formatNumber(nfts.length)}
          icon={Grid3X3}
          accent="green"
        />
        <StatCard
          label="Daily Prep Points"
          value={formatNumber(totalDailyYield)}
          icon={Zap}
          accent="gold"
        />
        <StatCard
          label="Unique Masks"
          value={String(uniqueMasks)}
          accent="purple"
        />
        <StatCard
          label="Across Wallets"
          value={String(wallets.length)}
          icon={Wallet}
          accent="rust"
        />
      </div>

      {/* NFT Grid with Filters */}
      <NftGrid nfts={nfts} walletNames={walletNames} />
    </div>
  );
}
