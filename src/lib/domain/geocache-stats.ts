import type {
  GeocacheNft,
  GeocacheTier,
  GeocacheSeries,
  GeocacheStats,
  GeocachePnl,
  GeocacheBurnRecord,
} from "@/types/geocache";
import type { NftTransaction } from "@/types/transaction";

/**
 * Group geocaches by tier
 */
export const groupByTier = (
  geocaches: readonly GeocacheNft[],
): Record<GeocacheTier, GeocacheNft[]> => {
  const result: Record<GeocacheTier, GeocacheNft[]> = {
    Common: [],
    Rare: [],
  };

  for (const gc of geocaches) {
    result[gc.tier].push(gc);
  }

  return result;
};

/**
 * Group geocaches by series
 */
export const groupBySeries = (
  geocaches: readonly GeocacheNft[],
): Record<GeocacheSeries, GeocacheNft[]> => {
  const result: Record<GeocacheSeries, GeocacheNft[]> = {
    "Bounty Box I": [],
    "Bounty Box II": [],
    "Shit Box": [],
  };

  for (const gc of geocaches) {
    result[gc.series].push(gc);
  }

  return result;
};

/**
 * Calculate P&L from geocache transactions.
 * Buys = tracked wallet received (toWallet is tracked).
 * Sells = tracked wallet sent (fromWallet is tracked).
 */
export const calculateGeocachePnl = (
  transactions: readonly NftTransaction[],
  trackedAddresses: ReadonlySet<string>,
): GeocachePnl => {
  let totalSpentSol = 0;
  let totalEarnedSol = 0;
  let buyCount = 0;
  let sellCount = 0;

  for (const tx of transactions) {
    if (tx.type !== "BUY" && tx.type !== "SELL") continue;
    if (tx.solAmount <= 0) continue;

    if (trackedAddresses.has(tx.toWallet)) {
      totalSpentSol += tx.solAmount;
      buyCount++;
    }
    if (trackedAddresses.has(tx.fromWallet)) {
      totalEarnedSol += tx.solAmount;
      sellCount++;
    }
  }

  return {
    totalSpentSol,
    totalEarnedSol,
    netPnlSol: totalEarnedSol - totalSpentSol,
    buyCount,
    sellCount,
  };
};

/**
 * Extract burn records from transaction history.
 * Burns are detected by BURN transaction type.
 */
export const extractBurnRecords = (
  transactions: readonly NftTransaction[],
  trackedAddresses: ReadonlySet<string>,
): GeocacheBurnRecord[] =>
  transactions
    .filter(
      (tx) =>
        tx.type === "BURN" &&
        (trackedAddresses.has(tx.fromWallet) || trackedAddresses.has(tx.toWallet)),
    )
    .map((tx) => ({
      mintAddress: tx.mintAddress,
      timestamp: tx.timestamp,
      signature: tx.signature,
    }));

/**
 * Calculate complete geocache statistics from ALL geocache NFTs (held + burned)
 * and transaction history.
 *
 * The `geocaches` array includes BOTH currently-held AND burned items
 * (Helius getAssetsByOwner returns burned assets with `isBurned: true`).
 * Burns are detected via the DAS `burnt` flag — NOT from transactions.
 */
export const calculateGeocacheStats = (
  geocaches: readonly GeocacheNft[],
  transactions: readonly NftTransaction[],
  trackedAddresses: ReadonlySet<string>,
): GeocacheStats => {
  const pnl = calculateGeocachePnl(transactions, trackedAddresses);

  // Separate held (not burned) from burned
  const held = geocaches.filter((gc) => !gc.isBurned);
  const burned = geocaches.filter((gc) => gc.isBurned);

  // Tier/series breakdown of HELD (not burned) geocaches only
  const byTier: Record<GeocacheTier, number> = { Common: 0, Rare: 0 };
  const bySeries: Record<GeocacheSeries, number> = {
    "Bounty Box I": 0,
    "Bounty Box II": 0,
    "Shit Box": 0,
  };

  for (const gc of held) {
    byTier[gc.tier]++;
    bySeries[gc.series]++;
  }

  // Tier/series breakdown of BURNED/OPENED geocaches
  const burnedByTier: Record<GeocacheTier, number> = { Common: 0, Rare: 0 };
  const burnedBySeries: Record<GeocacheSeries, number> = {
    "Bounty Box I": 0,
    "Bounty Box II": 0,
    "Shit Box": 0,
  };

  for (const gc of burned) {
    burnedByTier[gc.tier]++;
    burnedBySeries[gc.series]++;
  }

  const totalListed = held.filter((gc) => gc.isListed).length;

  // Count sells from tracked wallets
  const totalSold = transactions.filter(
    (tx) =>
      (tx.type === "SELL" || tx.type === "BUY") &&
      tx.solAmount > 0 &&
      trackedAddresses.has(tx.fromWallet),
  ).length;

  // Count buys to tracked wallets
  const totalBought = transactions.filter(
    (tx) =>
      (tx.type === "BUY" || tx.type === "SELL") &&
      tx.solAmount > 0 &&
      trackedAddresses.has(tx.toWallet),
  ).length;

  return {
    totalHeld: held.length,
    totalBurned: burned.length,
    totalBought,
    totalSold,
    totalListed,
    byTier,
    bySeries,
    burnedByTier,
    burnedBySeries,
    totalSpentSol: pnl.totalSpentSol,
    totalEarnedSol: pnl.totalEarnedSol,
    netPnlSol: pnl.netPnlSol,
    buyCount: pnl.buyCount,
    sellCount: pnl.sellCount,
    tradeCount: pnl.buyCount + pnl.sellCount,
  };
};
