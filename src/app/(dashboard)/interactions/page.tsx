"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Users, UserCheck, ArrowUpDown, Network } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useWalletInteractions } from "@/hooks/use-wallet-interactions";
import { useAllTransactions } from "@/hooks/use-transaction-history";
import { useWalletStore } from "@/stores/wallet-store";
import { StatCard } from "@/components/shared/stat-card";
import { GlitchText } from "@/components/shared/glitch-text";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { BubbleChart } from "@/components/interactions/bubble-chart";
import { InteractionsTable } from "@/components/interactions/interactions-table";
import { InteractionDetail } from "@/components/interactions/interaction-detail";
import { DateRangeFilter } from "@/components/interactions/date-range-filter";
import { formatNumber, formatSol, shortenAddress } from "@/lib/utils/format";
import type { PositionedBubble, WalletInteraction } from "@/types/wallet-interactions";

export default function InteractionsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 500 });
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState(() => new Date("2024-10-01")); // TGE
  const [dateEnd, setDateEnd] = useState(() => new Date());

  // Measure container for responsive bubble chart
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Height proportional to width, capped
        setContainerSize({
          width: Math.max(300, width - 32), // subtract padding
          height: Math.max(300, Math.min(600, width * 0.7)),
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dateRange = useMemo(
    () => ({
      start: Math.floor(dateStart.getTime() / 1000),
      end: Math.floor(dateEnd.getTime() / 1000),
    }),
    [dateStart, dateEnd]
  );

  const { interactions, summary, bubbles, isLoading } = useWalletInteractions(
    containerSize.width,
    containerSize.height,
    dateRange
  );

  const wallets = useWalletStore((s) => s.wallets);
  const { data: allTransactions } = useAllTransactions();

  // Filter transactions for selected counterparty
  const selectedInteraction = useMemo(
    () => interactions.find((i) => i.counterpartyAddress === selectedAddress) ?? null,
    [interactions, selectedAddress]
  );

  const trackedAddresses = useMemo(
    () => new Set(wallets.map((w) => w.address)),
    [wallets]
  );

  const filteredTransactions = useMemo(() => {
    if (!selectedAddress || !allTransactions) return [];
    return allTransactions.filter(
      (tx) =>
        (trackedAddresses.has(tx.fromWallet) && tx.toWallet === selectedAddress) ||
        (trackedAddresses.has(tx.toWallet) && tx.fromWallet === selectedAddress)
    );
  }, [selectedAddress, allTransactions, trackedAddresses]);

  const handleBubbleClick = useCallback((bubble: PositionedBubble) => {
    setSelectedAddress((prev) =>
      prev === bubble.counterpartyAddress ? null : bubble.counterpartyAddress
    );
  }, []);

  const handleTableSelect = useCallback((interaction: WalletInteraction) => {
    setSelectedAddress((prev) =>
      prev === interaction.counterpartyAddress ? null : interaction.counterpartyAddress
    );
  }, []);

  if (wallets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-sm">
          No vaults connected, survivor.
        </p>
        <p className="text-text-muted text-xs mt-1">
          Add a wallet to track interactions.
        </p>
      </div>
    );
  }

  if (isLoading) return <PageLoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <GlitchText text="Interactions" className="text-lg text-text-primary" />
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Counterparty analysis across all vaults
          </p>
        </div>
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onRangeChange={(start, end) => {
            setDateStart(start);
            setDateEnd(end);
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Counterparties"
          value={formatNumber(summary.totalCounterparties)}
          icon={Users}
          accent="green"
        />
        <StatCard
          label="Top Partner"
          value={
            summary.topCounterparty
              ? shortenAddress(summary.topCounterparty.counterpartyAddress, 4)
              : "—"
          }
          subValue={
            summary.topCounterparty
              ? `${summary.topCounterparty.transactionCount} txns`
              : undefined
          }
          icon={UserCheck}
          accent="gold"
        />
        <StatCard
          label="Total Volume"
          value={formatSol(summary.totalSolVolume)}
          subValue={`${formatNumber(summary.totalTransactions)} txns`}
          icon={ArrowUpDown}
          accent="rust"
        />
        <StatCard
          label="Diversity"
          value={`${summary.diversityScore}%`}
          subValue={summary.diversityScore >= 70 ? "Well spread" : summary.diversityScore >= 40 ? "Moderate" : "Concentrated"}
          icon={Network}
          accent="purple"
        />
      </div>

      {/* Bubble Chart */}
      <div
        ref={containerRef}
        className="bg-bg-surface border border-border-default rounded-lg p-3 sm:p-4"
      >
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 sm:mb-4">
          Interaction Network
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4">
          {[
            { color: "bg-neon-green", label: "They buy from you" },
            { color: "bg-blood", label: "You buy from them" },
            { color: "bg-toxic-purple", label: "Mixed" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color} opacity-60`} />
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-gold opacity-60" />
            <span className="text-[10px] text-text-muted">Your wallet</span>
          </div>
        </div>

        <BubbleChart
          bubbles={bubbles}
          onBubbleClick={handleBubbleClick}
          selectedAddress={selectedAddress}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      </div>

      {/* Detail + Table layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Table (2/3 width) */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Top Counterparties ({interactions.length})
            </h3>
          </div>
          <InteractionsTable
            interactions={interactions}
            selectedAddress={selectedAddress}
            onSelect={handleTableSelect}
          />
        </div>

        {/* Detail Panel (1/3 width) */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedInteraction ? (
              <InteractionDetail
                key={selectedInteraction.counterpartyAddress}
                interaction={selectedInteraction}
                transactions={filteredTransactions}
                onClose={() => setSelectedAddress(null)}
              />
            ) : (
              <div className="bg-bg-surface border border-border-default rounded-lg p-6 text-center">
                <Network size={24} className="mx-auto text-text-muted opacity-30 mb-3" />
                <p className="text-text-muted text-xs">
                  Click a bubble or table row to see transaction details.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
