import type { NftTransaction } from "@/types/transaction";
import type {
  WalletInteraction,
  InteractionDirection,
  InteractionsSummary,
} from "@/types/wallet-interactions";

/**
 * Determine the dominant interaction direction.
 * BUYER = they mostly buy FROM the user (user sells to them).
 * SELLER = they mostly sell TO the user (user buys from them).
 * MIXED = balanced or no clear direction.
 */
export const categorizeDirection = (
  buyCount: number,
  sellCount: number
): InteractionDirection => {
  const total = buyCount + sellCount;
  if (total === 0) return "MIXED";
  if (buyCount / total >= 0.7) return "BUYER";
  if (sellCount / total >= 0.7) return "SELLER";
  return "MIXED";
};

/**
 * Aggregate transactions into per-counterparty interaction summaries.
 *
 * For each transaction, identifies the counterparty relative to the
 * tracked wallet set:
 * - If fromWallet is tracked → user sold/transferred → counterparty = toWallet
 * - If toWallet is tracked → user bought/received → counterparty = fromWallet
 * - If both are tracked → internal transfer, flagged as isOwnWallet
 *
 * @returns Interactions sorted by transaction count descending
 */
export const aggregateInteractions = (
  transactions: readonly NftTransaction[],
  trackedAddresses: ReadonlySet<string>
): WalletInteraction[] => {
  const map = new Map<
    string,
    {
      txCount: number;
      solVolume: number;
      buyCount: number;
      sellCount: number;
      transferCount: number;
      firstTs: number;
      lastTs: number;
    }
  >();

  for (const tx of transactions) {
    const fromIsOwn = trackedAddresses.has(tx.fromWallet);
    const toIsOwn = trackedAddresses.has(tx.toWallet);

    // Skip if neither wallet is ours
    if (!fromIsOwn && !toIsOwn) continue;

    let counterparty: string;
    let isBuy: boolean;

    if (fromIsOwn && toIsOwn) {
      // Internal transfer between own wallets
      counterparty = tx.toWallet;
      isBuy = false;
    } else if (fromIsOwn) {
      // User sold / transferred out
      counterparty = tx.toWallet;
      isBuy = false;
    } else {
      // User bought / received
      counterparty = tx.fromWallet;
      isBuy = true;
    }

    if (!counterparty) continue;

    const existing = map.get(counterparty) ?? {
      txCount: 0,
      solVolume: 0,
      buyCount: 0,
      sellCount: 0,
      transferCount: 0,
      firstTs: tx.timestamp,
      lastTs: tx.timestamp,
    };

    existing.txCount += 1;
    existing.solVolume += tx.solAmount;

    if (tx.type === "TRANSFER") {
      existing.transferCount += 1;
    } else if (isBuy) {
      existing.buyCount += 1;
    } else {
      existing.sellCount += 1;
    }

    existing.firstTs = Math.min(existing.firstTs, tx.timestamp);
    existing.lastTs = Math.max(existing.lastTs, tx.timestamp);

    map.set(counterparty, existing);
  }

  const interactions: WalletInteraction[] = [];
  for (const [address, data] of map) {
    interactions.push({
      counterpartyAddress: address,
      transactionCount: data.txCount,
      totalSolVolume: data.solVolume,
      buyCount: data.buyCount,
      sellCount: data.sellCount,
      transferCount: data.transferCount,
      direction: categorizeDirection(data.buyCount, data.sellCount),
      firstInteraction: data.firstTs,
      lastInteraction: data.lastTs,
      isOwnWallet: trackedAddresses.has(address),
    });
  }

  return interactions.sort((a, b) => b.transactionCount - a.transactionCount);
};

/**
 * Calculate Shannon entropy-based diversity score (0-100).
 * High score = interactions spread evenly across many wallets.
 * Low score = concentrated in few wallets.
 */
export const calculateDiversityScore = (
  interactions: readonly WalletInteraction[]
): number => {
  if (interactions.length <= 1) return 0;

  const totalTx = interactions.reduce((s, i) => s + i.transactionCount, 0);
  if (totalTx === 0) return 0;

  let entropy = 0;
  for (const interaction of interactions) {
    const p = interaction.transactionCount / totalTx;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  const maxEntropy = Math.log2(interactions.length);
  return maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;
};

/**
 * Build the complete interactions summary.
 */
export const buildInteractionsSummary = (
  interactions: readonly WalletInteraction[]
): InteractionsSummary => ({
  totalCounterparties: interactions.length,
  totalTransactions: interactions.reduce((s, i) => s + i.transactionCount, 0),
  totalSolVolume: interactions.reduce((s, i) => s + i.totalSolVolume, 0),
  topCounterparty: interactions[0] ?? null,
  diversityScore: calculateDiversityScore(interactions),
});
