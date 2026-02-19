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
 */
export const useWalletInteractions = (
  containerWidth?: number,
  containerHeight?: number
): UseWalletInteractionsResult => {
  const { data: transactions, isLoading, isError } = useAllTransactions();
  const wallets = useWalletStore((s) => s.wallets);

  const trackedAddresses = useMemo(
    () => new Set(wallets.map((w) => w.address)),
    [wallets]
  );

  const interactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return aggregateInteractions(transactions, trackedAddresses);
  }, [transactions, trackedAddresses]);

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

  return { interactions, summary, bubbles, isLoading, isError };
};
