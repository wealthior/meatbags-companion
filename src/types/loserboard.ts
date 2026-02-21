export type LoserboardTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Immortal";

export interface TierConfig {
  readonly tier: LoserboardTier;
  readonly minPoints: number;
  readonly maxPoints: number;
  readonly color: string;
}

export interface BadgeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly points: number;
  readonly isStackable: boolean;
  readonly category: "one-time" | "stackable";
  readonly imageUrl?: string;
  readonly badgeType?: "REVOKABLE" | "PERMANENT";
  readonly badgeCategory?: "IndividualNFTBased" | "MultiNFTBased" | "CollectionBased" | "ParticipationBased";
}

export interface EarnedBadge {
  readonly badge: BadgeDefinition;
  readonly count: number;
}

export interface UserLoserboardStats {
  readonly deadPoints: number;
  readonly currentTier: LoserboardTier;
  readonly tierProgress: number;
  readonly pointsToNextTier: number;
  readonly badges: readonly EarnedBadge[];
}
