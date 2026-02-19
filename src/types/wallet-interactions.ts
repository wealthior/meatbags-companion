/** The dominant direction of transactions with a counterparty */
export type InteractionDirection = "BUYER" | "SELLER" | "MIXED";

/**
 * Aggregated interaction data for a single counterparty wallet.
 * Produced by the domain aggregation logic.
 */
export interface WalletInteraction {
  readonly counterpartyAddress: string;
  readonly transactionCount: number;
  readonly totalSolVolume: number;
  readonly buyCount: number;
  readonly sellCount: number;
  readonly transferCount: number;
  readonly direction: InteractionDirection;
  readonly firstInteraction: number; // unix timestamp
  readonly lastInteraction: number; // unix timestamp
  readonly isOwnWallet: boolean; // true if counterparty is one of the user's tracked wallets
}

/**
 * Summary statistics for the interactions overview.
 */
export interface InteractionsSummary {
  readonly totalCounterparties: number;
  readonly totalTransactions: number;
  readonly totalSolVolume: number;
  readonly topCounterparty: WalletInteraction | null;
  readonly diversityScore: number; // 0-100, Shannon entropy normalized
}

/**
 * Positioned bubble for the visualization.
 * Extends WalletInteraction with x/y/radius layout data.
 */
export interface PositionedBubble extends WalletInteraction {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}
