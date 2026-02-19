export interface SolPrice {
  readonly usd: number;
  readonly lastUpdated: number;
}

export interface HistoricalPrice {
  readonly timestamp: number;
  readonly usd: number;
}

export type PriceRange = "7d" | "30d" | "90d" | "1y" | "all";

export interface PriceHistory {
  readonly prices: readonly HistoricalPrice[];
  readonly range: PriceRange;
}
