export type TransactionType = "BUY" | "SELL" | "TRANSFER" | "MINT";

export interface NftTransaction {
  readonly signature: string;
  readonly type: TransactionType;
  readonly mintAddress: string;
  readonly nftName: string;
  readonly solAmount: number;
  readonly solPriceUsd: number;
  readonly usdAmount: number;
  readonly timestamp: number;
  readonly fromWallet: string;
  readonly toWallet: string;
  readonly marketplace: string;
}

export interface PortfolioSummary {
  readonly totalSpentSol: number;
  readonly totalSpentUsd: number;
  readonly currentValueSol: number;
  readonly currentValueUsd: number;
  readonly unrealizedPnlSol: number;
  readonly unrealizedPnlUsd: number;
}
