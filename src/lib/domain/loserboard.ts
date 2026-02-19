import type { LoserboardTier, TierConfig, BadgeDefinition, UserLoserboardStats, EarnedBadge } from "@/types/loserboard";
import type { MeatbagNft } from "@/types/nft";
import { TIER_CONFIGS, MASK_COLOR_CONFIG } from "@/lib/utils/constants";

/**
 * Determine the loserboard tier for a given Dead Points amount
 */
export const determineTier = (deadPoints: number): LoserboardTier => {
  if (deadPoints >= 400_000) return "Immortal";
  if (deadPoints >= 225_000) return "Platinum";
  if (deadPoints >= 100_000) return "Gold";
  if (deadPoints >= 25_000) return "Silver";
  return "Bronze";
};

/**
 * Get the tier config for a given tier
 */
export const getTierConfig = (tier: LoserboardTier): TierConfig =>
  TIER_CONFIGS.find((t) => t.tier === tier) ?? TIER_CONFIGS[0];

/**
 * Calculate progress within the current tier (0 to 1)
 */
export const calculateTierProgress = (
  deadPoints: number
): { tier: LoserboardTier; progress: number; pointsToNextTier: number } => {
  const tier = determineTier(deadPoints);
  const config = getTierConfig(tier);

  if (tier === "Immortal") {
    return { tier, progress: 1, pointsToNextTier: 0 };
  }

  const nextTierIndex = TIER_CONFIGS.findIndex((t) => t.tier === tier) + 1;
  const nextTierMin = TIER_CONFIGS[nextTierIndex].minPoints;
  const range = nextTierMin - config.minPoints;
  const progress = Math.min((deadPoints - config.minPoints) / range, 1);
  const pointsToNextTier = Math.max(nextTierMin - deadPoints, 0);

  return { tier, progress, pointsToNextTier };
};

/** Badge definitions for the MeatBags Loserboard (33 total) */
export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  // One-time badges
  { id: "shitlord", name: "Shitlord", description: "Become a verified shitlord", points: 500, isStackable: false, category: "one-time" },
  { id: "raider", name: "Raider", description: "Complete your first raid", points: 1_000, isStackable: false, category: "one-time" },
  { id: "collectoor", name: "Collectoor", description: "Collect your first MeatBag", points: 750, isStackable: false, category: "one-time" },
  { id: "degen", name: "Degen", description: "Prove your degen status", points: 1_500, isStackable: false, category: "one-time" },
  { id: "og_holder", name: "OG Holder", description: "Original minter", points: 2_000, isStackable: false, category: "one-time" },
  { id: "staker", name: "Staker", description: "Stake your first MeatBag", points: 500, isStackable: false, category: "one-time" },
  { id: "veteran", name: "Veteran", description: "Hold for 90+ days", points: 3_000, isStackable: false, category: "one-time" },
  { id: "whale", name: "Whale", description: "Hold 50+ MeatBags", points: 5_000, isStackable: false, category: "one-time" },
  { id: "diamond_hands", name: "Diamond Hands", description: "Never sold a MeatBag", points: 4_000, isStackable: false, category: "one-time" },
  { id: "community_legend", name: "Community Legend", description: "Outstanding community contribution", points: 7_700, isStackable: false, category: "one-time" },
  { id: "survivor", name: "Survivor", description: "Survive a market crash while holding", points: 2_500, isStackable: false, category: "one-time" },
  { id: "preparer", name: "Preparer", description: "Accumulate 100K prep points", points: 1_500, isStackable: false, category: "one-time" },
  { id: "hoarder", name: "Hoarder", description: "Hold 100+ MeatBags", points: 7_000, isStackable: false, category: "one-time" },
  { id: "social_butterfly", name: "Social Butterfly", description: "Active in all social channels", points: 1_000, isStackable: false, category: "one-time" },
  { id: "geocacher", name: "Geocacher", description: "Find your first geocache", points: 750, isStackable: false, category: "one-time" },
  { id: "rare_hunter", name: "Rare Hunter", description: "Own a rare trait MeatBag", points: 2_000, isStackable: false, category: "one-time" },

  // Stackable badges (per trait/mask ownership)
  { id: "mask_red", name: "Red Mask Owner", description: "Own a MeatBag with Red Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_purple", name: "Purple Mask Owner", description: "Own a MeatBag with Purple Mask", points: 100, isStackable: true, category: "stackable" },
  { id: "mask_orange", name: "Orange Mask Owner", description: "Own a MeatBag with Orange Mask", points: 100, isStackable: true, category: "stackable" },
  { id: "mask_white", name: "White Mask Owner", description: "Own a MeatBag with White Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_yellow", name: "Yellow Mask Owner", description: "Own a MeatBag with Yellow Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_green", name: "Green Mask Owner", description: "Own a MeatBag with Green Mask", points: 150, isStackable: true, category: "stackable" },
  { id: "mask_teal", name: "Teal Mask Owner", description: "Own a MeatBag with Teal Mask", points: 150, isStackable: true, category: "stackable" },
  { id: "mask_blue", name: "Blue Mask Owner", description: "Own a MeatBag with Blue Mask", points: 175, isStackable: true, category: "stackable" },
  { id: "mask_black", name: "Black Mask Owner", description: "Own a MeatBag with Black Mask", points: 175, isStackable: true, category: "stackable" },
  { id: "mask_pink", name: "Pink Mask Owner", description: "Own a MeatBag with Pink Mask", points: 200, isStackable: true, category: "stackable" },
  { id: "mask_orchid", name: "Orchid Mask Owner", description: "Own a MeatBag with Orchid Mask", points: 250, isStackable: true, category: "stackable" },
  { id: "mask_navy", name: "Navy Mask Owner", description: "Own a MeatBag with Navy Mask", points: 250, isStackable: true, category: "stackable" },
  { id: "mask_brown", name: "Brown Mask Owner", description: "Own a MeatBag with Brown Mask", points: 300, isStackable: true, category: "stackable" },
  { id: "mask_gold", name: "Gold Mask Owner", description: "Own a MeatBag with Gold Mask", points: 1_500, isStackable: true, category: "stackable" },
  { id: "mask_1of1", name: "1/1 Mask Owner", description: "Own a MeatBag with a 1/1 Mask", points: 7_000, isStackable: true, category: "stackable" },
  { id: "mask_nothing", name: "Maskless Owner", description: "Own a MeatBag with No Mask", points: 7_700, isStackable: true, category: "stackable" },
  { id: "geocache_rare", name: "Rare Geocache", description: "Find a rare geocache item", points: 500, isStackable: true, category: "stackable" },
];

/**
 * Map mask colors to their badge IDs
 */
const MASK_BADGE_MAP: Record<string, string> = {
  Red: "mask_red",
  Purple: "mask_purple",
  Orange: "mask_orange",
  White: "mask_white",
  Yellow: "mask_yellow",
  "Light Blue": "mask_blue",
  Green: "mask_green",
  Teal: "mask_teal",
  Olive: "mask_green",
  Blue: "mask_blue",
  Black: "mask_black",
  Burgundy: "mask_red",
  Grey: "mask_black",
  Pink: "mask_pink",
  Orchid: "mask_orchid",
  Navy: "mask_navy",
  Brown: "mask_brown",
  Gold: "mask_gold",
  "GH-Gold": "mask_gold",
  "1/1": "mask_1of1",
  Nothing: "mask_nothing",
};

/**
 * Calculate earned stackable badges from NFT holdings
 */
export const calculateStackableBadges = (
  nfts: readonly MeatbagNft[]
): EarnedBadge[] => {
  const maskCounts: Record<string, number> = {};

  for (const nft of nfts) {
    const badgeId = MASK_BADGE_MAP[nft.maskColor];
    if (badgeId) {
      maskCounts[badgeId] = (maskCounts[badgeId] ?? 0) + 1;
    }
  }

  const badges: EarnedBadge[] = [];
  for (const [badgeId, count] of Object.entries(maskCounts)) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (badge && count > 0) {
      badges.push({ badge, count });
    }
  }

  return badges;
};

/**
 * Calculate total Dead Points from earned badges
 */
export const calculateDeadPoints = (badges: readonly EarnedBadge[]): number =>
  badges.reduce((total, { badge, count }) => total + badge.points * count, 0);

/**
 * Calculate complete loserboard stats for a set of NFTs
 */
export const calculateLoserboardStats = (
  nfts: readonly MeatbagNft[],
  oneTimeBadgeIds: readonly string[] = []
): UserLoserboardStats => {
  const stackableBadges = calculateStackableBadges(nfts);

  const oneTimeBadges: EarnedBadge[] = oneTimeBadgeIds
    .map((id) => BADGE_DEFINITIONS.find((b) => b.id === id))
    .filter((b): b is BadgeDefinition => b !== undefined)
    .map((badge) => ({ badge, count: 1 }));

  const allBadges = [...oneTimeBadges, ...stackableBadges];
  const deadPoints = calculateDeadPoints(allBadges);
  const { tier, progress, pointsToNextTier } = calculateTierProgress(deadPoints);

  return {
    deadPoints,
    currentTier: tier,
    tierProgress: progress,
    pointsToNextTier,
    badges: allBadges,
  };
};
