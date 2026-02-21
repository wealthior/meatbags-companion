/** Badge definition from deadbruv.com API */
export interface DeadbruvBadgeDefinition {
  readonly name: string;
  readonly imageURL: string;
  readonly description: string;
  readonly points: number;
  readonly type: "REVOKABLE" | "PERMANENT";
  readonly category: "IndividualNFTBased" | "MultiNFTBased" | "CollectionBased" | "ParticipationBased";
  readonly createdAt: string;
}

/** User's earned badge from deadbruv.com API */
export interface DeadbruvUserBadge {
  readonly userAddress: string;
  readonly badgeId: string;
  readonly status: "ACTIVE" | "REVOKED";
  readonly revokedAt: string | null;
  readonly isShowcased: boolean;
  readonly traitCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Combined badge data for display */
export interface DeadbruvEarnedBadge {
  readonly badge: DeadbruvBadgeDefinition;
  readonly userBadge: DeadbruvUserBadge;
}
