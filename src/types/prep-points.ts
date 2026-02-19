import type { LoyaltyMultiplier, MaskColor } from "./nft";

export interface PrepPointsCalculation {
  readonly mintAddress: string;
  readonly nftName: string;
  readonly maskColor: MaskColor;
  readonly baseYield: number;
  readonly multiplier: LoyaltyMultiplier;
  readonly dailyYield: number;
}

export interface AggregatedPrepPoints {
  readonly totalDaily: number;
  readonly byWallet: Record<string, number>;
  readonly byMaskColor: Record<string, { count: number; dailyTotal: number }>;
  readonly projections: PrepPointsProjection;
}

export interface PrepPointsProjection {
  readonly daily: number;
  readonly weekly: number;
  readonly monthly: number;
  readonly yearly: number;
}
