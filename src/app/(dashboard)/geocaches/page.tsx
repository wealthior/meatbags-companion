"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useAllGeocaches, useGeocacheTransactions } from "@/hooks/use-geocaches";
import { useWalletStore } from "@/stores/wallet-store";
import { calculateGeocacheStats } from "@/lib/domain/geocache-stats";
import { GEOCACHE_MAGICEDEN_COLLECTION_URL } from "@/lib/utils/constants";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton, SectionLoadingIndicator, StatSkeleton } from "@/components/shared/loading-skeleton";
import { GeocacheStatCards } from "@/components/geocache/geocache-stat-cards";
import { GeocacheTraitBreakdown } from "@/components/geocache/geocache-trait-breakdown";
import { GeocachePnlSummary } from "@/components/geocache/geocache-pnl-summary";
import { GeocacheGrid } from "@/components/geocache/geocache-grid";
import { GeocacheActivityTimeline } from "@/components/geocache/geocache-activity-timeline";

export default function GeocachesPage() {
  const wallets = useWalletStore((s) => s.wallets);
  const { data, isLoading, error, refetch } = useAllGeocaches();

  // Fetch geocache transactions using dedicated Metaplex Core parser
  const {
    data: transactions,
    isLoading: txLoading,
  } = useGeocacheTransactions();

  const trackedAddresses = useMemo(
    () => new Set(wallets.map((w) => w.address)),
    [wallets],
  );

  const walletNames = useMemo(
    () => Object.fromEntries(wallets.map((w) => [w.address, w.name])),
    [wallets],
  );

  // Calculate stats from geocaches + transactions
  const stats = useMemo(() => {
    if (!data?.geocaches) return null;
    return calculateGeocacheStats(
      data.geocaches,
      transactions ?? [],
      trackedAddresses,
    );
  }, [data?.geocaches, transactions, trackedAddresses]);

  // ─── Guards ──────────────────────────────────────────────────
  if (wallets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-sm">
          No vaults connected, survivor.
        </p>
        <p className="text-text-muted text-xs mt-1">
          Add a wallet to begin scanning for GeoCaches.
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
          Signal Lost
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

  const allGeocaches = data?.geocaches ?? [];
  const heldGeocaches = allGeocaches.filter((gc) => !gc.isBurned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <GlitchText text="GeoCaches" className="text-lg text-text-primary" />
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Raid rewards & loot statistics
          </p>
        </div>
        <a
          href={GEOCACHE_MAGICEDEN_COLLECTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] text-text-muted border border-border-default hover:border-border-accent hover:text-text-primary transition-colors"
        >
          <ExternalLink size={10} />
          MagicEden
        </a>
      </div>

      {/* Wallet Stats */}
      {stats ? (
        <GeocacheStatCards stats={stats} txLoading={txLoading} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Trait Breakdowns */}
      {stats && (stats.totalHeld > 0 || stats.totalBurned > 0) && (
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
            Trait Breakdown
          </h3>
          <GeocacheTraitBreakdown
            byTier={stats.byTier}
            bySeries={stats.bySeries}
            totalHeld={stats.totalHeld}
            burnedByTier={stats.burnedByTier}
            burnedBySeries={stats.burnedBySeries}
            totalBurned={stats.totalBurned}
          />
        </div>
      )}

      {/* P&L Summary */}
      {txLoading ? (
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
            Trade Performance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
            Trade Performance
          </h3>
          <GeocachePnlSummary
            transactions={transactions}
            trackedAddresses={trackedAddresses}
          />
        </div>
      ) : null}

      {/* GeoCaches Grid */}
      <div>
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
          Your GeoCaches {heldGeocaches.length > 0 ? `(${heldGeocaches.length})` : ""}
        </h3>
        <GeocacheGrid geocaches={heldGeocaches} walletNames={walletNames} />
      </div>

      {/* Activity Timeline */}
      {txLoading ? (
        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Recent Activity
            </h3>
          </div>
          <div className="p-4">
            <SectionLoadingIndicator label="Loading transaction history..." />
          </div>
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Recent Activity ({transactions.length})
            </h3>
          </div>
          <GeocacheActivityTimeline transactions={transactions} maxItems={50} />
        </div>
      ) : null}
    </div>
  );
}
