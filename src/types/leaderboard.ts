export interface VerifiedHolder {
  readonly id: number;
  readonly userId: string;
  readonly walletAddress: string;
  readonly signature: string;
  readonly verifiedAt: Date;
}

export interface LeaderboardEntry {
  readonly id: number;
  readonly userId: string;
  readonly displayName: string;
  readonly totalNfts: number;
  readonly verifiedWalletsCount: number;
  readonly lastUpdated: Date;
}

export interface LeaderboardRanking extends LeaderboardEntry {
  readonly rank: number;
}
