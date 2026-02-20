import type { NftTrait } from "./nft";
import type { NftTransaction } from "./transaction";

/** GeoCaches tier from trait data */
export type GeocacheTier = "Common" | "Rare";

/** GeoCaches series from trait data */
export type GeocacheSeries = "Bounty Box I" | "Bounty Box II" | "Shit Box" | "Halloween" | "Merry Crisis";

/** A single GeoCaches NFT */
export interface GeocacheNft {
  readonly mintAddress: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly ownerWallet: string;
  readonly tier: GeocacheTier;
  readonly series: GeocacheSeries;
  readonly traits: readonly NftTrait[];
  readonly isBurned: boolean;
  readonly isListed: boolean;
  readonly listedMarketplace?: string;
  readonly listingPriceSol?: number;
  readonly magicEdenUrl: string;
  /**
   * Internal: the on-chain update authority address.
   * Used to detect burned geocaches whose metadata was changed (Halloween/MC → BB1/BB2)
   * during the in-game "open" process. Not displayed in UI.
   */
  readonly _authority?: string;
}

/** Tier display configuration */
export interface GeocacheTierConfig {
  readonly tier: GeocacheTier;
  readonly hexColor: string;
  readonly label: string;
}

/** Series display configuration */
export interface GeocacheSeriesConfig {
  readonly series: GeocacheSeries;
  readonly hexColor: string;
  readonly label: string;
}

/** Aggregated per-wallet GeoCaches statistics */
export interface GeocacheStats {
  readonly totalHeld: number;
  readonly totalBurned: number;
  readonly totalBought: number;
  readonly totalSold: number;
  readonly totalListed: number;
  /** Trait breakdown of currently HELD geocaches */
  readonly byTier: Record<GeocacheTier, number>;
  readonly bySeries: Record<GeocacheSeries, number>;
  /** Trait breakdown of BURNED/OPENED geocaches */
  readonly burnedByTier: Record<GeocacheTier, number>;
  readonly burnedBySeries: Record<GeocacheSeries, number>;
  readonly totalSpentSol: number;
  readonly totalEarnedSol: number;
  readonly netPnlSol: number;
  readonly buyCount: number;
  readonly sellCount: number;
  readonly tradeCount: number;
}

/** GeoCaches P&L data */
export interface GeocachePnl {
  readonly totalSpentSol: number;
  readonly totalEarnedSol: number;
  readonly netPnlSol: number;
  readonly buyCount: number;
  readonly sellCount: number;
}

/** Burn record from transaction history */
export interface GeocacheBurnRecord {
  readonly mintAddress: string;
  readonly timestamp: number;
  readonly signature: string;
}

/** Full geocache data returned by the hook */
export interface GeocacheData {
  readonly geocaches: GeocacheNft[];
  readonly byWallet: Record<string, GeocacheNft[]>;
}
