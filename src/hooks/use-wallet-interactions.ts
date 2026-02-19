"use client";

import { useMemo } from "react";
import { useAllTransactions } from "@/hooks/use-transaction-history";
import { useWalletStore } from "@/stores/wallet-store";
import {
  aggregateInteractions,
  buildInteractionsSummary,
} from "@/lib/domain/wallet-interactions";
import { packCircles } from "@/lib/domain/circle-packing";
import type {
  WalletInteraction,
  InteractionsSummary,
  PositionedBubble,
} from "@/types/wallet-interactions";

interface UseWalletInteractionsResult {
  readonly interactions: WalletInteraction[];
  readonly summary: InteractionsSummary;
  readonly bubbles: PositionedBubble[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

/**
 * Hook providing aggregated wallet interaction data and packed bubble positions.
 * Supports optional date range filter.
 */
export const useWalletInteractions = (
  containerWidth?: number,
  containerHeight?: number,
  dateRange?: { start: number; end: number }
): UseWalletInteractionsResult => {
  const { data: transactions, isLoading: txLoading, isError } = useAllTransactions();
  const wallets = useWalletStore((s) => s.wallets);

  const trackedAddresses = useMemo(
    () => new Set(wallets.map((w) => w.address)),
    [wallets]
  );

  // Filter by date range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!dateRange) return transactions;

    return transactions.filter(
      (tx) => tx.timestamp >= dateRange.start && tx.timestamp <= dateRange.end
    );
  }, [transactions, dateRange]);

  const interactions = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    return aggregateInteractions(filteredTransactions, trackedAddresses);
  }, [filteredTransactions, trackedAddresses]);

  const summary = useMemo(
    () => buildInteractionsSummary(interactions),
    [interactions]
  );

  const bubbles = useMemo(
    () =>
      packCircles(interactions, {
        width: containerWidth ?? 600,
        height: containerHeight ?? 500,
      }),
    [interactions, containerWidth, containerHeight]
  );

  const isLoading = txLoading;

  return { interactions, summary, bubbles, isLoading, isError };
};
