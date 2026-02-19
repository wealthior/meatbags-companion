import type { MeatbagNft } from "@/types/nft";
import type { TrackedWallet, WalletGroup } from "@/types/wallet";
import type { PortfolioSummary } from "@/types/transaction";
import type { SolPrice } from "@/types/price";
import { MASK_COLOR_CONFIG } from "@/lib/utils/constants";

/**
 * Aggregate stats across multiple wallets
 */
export const aggregateWalletGroup = (
  wallets: readonly TrackedWallet[],
  nftsByWallet: Record<string, readonly MeatbagNft[]>
): WalletGroup => {
  let totalNfts = 0;
  let totalDailyPrepPoints = 0;

  for (const wallet of wallets) {
    const nfts = nftsByWallet[wallet.address] ?? [];
    totalNfts += nfts.length;
    totalDailyPrepPoints += nfts.reduce(
      (sum, nft) => sum + MASK_COLOR_CONFIG[nft.maskColor].dailyYield,
      0
    );
  }

  return {
    wallets,
    totalNfts,
    totalDailyPrepPoints,
  };
};

/**
 * Deduplicate NFTs across multiple wallets
 * (an NFT can only be in one wallet, but protects against stale cache)
 */
export const deduplicateNfts = (
  nftArrays: ReadonlyArray<readonly MeatbagNft[]>
): MeatbagNft[] => {
  const seen = new Set<string>();
  const unique: MeatbagNft[] = [];

  for (const nfts of nftArrays) {
    for (const nft of nfts) {
      if (!seen.has(nft.mintAddress)) {
        seen.add(nft.mintAddress);
        unique.push(nft);
      }
    }
  }

  return unique;
};

/**
 * Calculate portfolio value summary
 */
export const calculatePortfolioValue = (
  nfts: readonly MeatbagNft[],
  floorPrice: number,
  solPrice: SolPrice
): PortfolioSummary => {
  const currentValueSol = nfts.length * floorPrice;
  const currentValueUsd = currentValueSol * solPrice.usd;

  return {
    totalSpentSol: 0, // filled from transaction history
    totalSpentUsd: 0,
    currentValueSol,
    currentValueUsd,
    unrealizedPnlSol: 0,
    unrealizedPnlUsd: 0,
  };
};

/**
 * Get trait distribution across all NFTs
 */
export const getTraitDistribution = (
  nfts: readonly MeatbagNft[]
): { trait: string; count: number; percentage: number }[] => {
  const counts: Record<string, number> = {};

  for (const nft of nfts) {
    counts[nft.maskColor] = (counts[nft.maskColor] ?? 0) + 1;
  }

  const total = nfts.length;
  return Object.entries(counts)
    .map(([trait, count]) => ({
      trait,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
};
