import type { LoyaltyMultiplier } from "./nft";

export interface TrackedWallet {
  readonly address: string;
  readonly name: string;
  readonly isConnected: boolean;
  readonly addedAt: number;
  readonly detectedMultiplier?: LoyaltyMultiplier;
}

export interface WalletGroup {
  readonly wallets: readonly TrackedWallet[];
  readonly totalNfts: number;
  readonly totalDailyPrepPoints: number;
}
