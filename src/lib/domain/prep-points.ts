import type { MaskColor, LoyaltyMultiplier, MeatbagNft } from "@/types/nft";
import type {
  PrepPointsCalculation,
  AggregatedPrepPoints,
  PrepPointsProjection,
} from "@/types/prep-points";
import { getBaseYield, getDailyYield } from "./traits";

/**
 * Calculate the daily yield for a single NFT
 */
export const calculateDailyYield = (
  maskColor: MaskColor,
  multiplier: LoyaltyMultiplier
): number => getDailyYield(maskColor, multiplier);

/**
 * Calculate prep points details for a single NFT
 */
export const calculateNftPrepPoints = (
  nft: MeatbagNft,
  multiplier: LoyaltyMultiplier = 1.0
): PrepPointsCalculation => ({
  mintAddress: nft.mintAddress,
  nftName: nft.name,
  maskColor: nft.maskColor,
  baseYield: getBaseYield(nft.maskColor),
  multiplier,
  dailyYield: calculateDailyYield(nft.maskColor, multiplier),
});

/**
 * Calculate projections from a daily total
 */
export const calculateProjections = (dailyTotal: number): PrepPointsProjection => ({
  daily: dailyTotal,
  weekly: dailyTotal * 7,
  monthly: dailyTotal * 30,
  yearly: dailyTotal * 365,
});

/**
 * Aggregate prep points across a set of NFTs for a single wallet
 */
export const calculateWalletPrepPoints = (
  nfts: readonly MeatbagNft[],
  multiplier: LoyaltyMultiplier = 1.0
): AggregatedPrepPoints => {
  let totalDaily = 0;
  const byMaskColor: Record<string, { count: number; dailyTotal: number }> = {};

  for (const nft of nfts) {
    const daily = calculateDailyYield(nft.maskColor, multiplier);
    totalDaily += daily;

    if (!byMaskColor[nft.maskColor]) {
      byMaskColor[nft.maskColor] = { count: 0, dailyTotal: 0 };
    }
    byMaskColor[nft.maskColor].count += 1;
    byMaskColor[nft.maskColor].dailyTotal += daily;
  }

  return {
    totalDaily,
    byWallet: {},
    byMaskColor,
    projections: calculateProjections(totalDaily),
  };
};

/**
 * Aggregate prep points across multiple wallets
 */
export const aggregateAcrossWallets = (
  walletResults: ReadonlyArray<{
    walletAddress: string;
    walletName: string;
    points: AggregatedPrepPoints;
  }>
): AggregatedPrepPoints => {
  let totalDaily = 0;
  const byWallet: Record<string, number> = {};
  const byMaskColor: Record<string, { count: number; dailyTotal: number }> = {};

  for (const { walletAddress, walletName, points } of walletResults) {
    totalDaily += points.totalDaily;
    byWallet[`${walletName} (${walletAddress.slice(0, 4)}...)`] = points.totalDaily;

    for (const [color, data] of Object.entries(points.byMaskColor)) {
      if (!byMaskColor[color]) {
        byMaskColor[color] = { count: 0, dailyTotal: 0 };
      }
      byMaskColor[color].count += data.count;
      byMaskColor[color].dailyTotal += data.dailyTotal;
    }
  }

  return {
    totalDaily,
    byWallet,
    byMaskColor,
    projections: calculateProjections(totalDaily),
  };
};
