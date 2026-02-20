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

  // Stackable badges (per trait/mask ownership) — one per mask color
  // Common masks
  { id: "mask_red", name: "Red Mask", description: "Own a MeatBag with Red Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_purple", name: "Purple Mask", description: "Own a MeatBag with Purple Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_orange", name: "Orange Mask", description: "Own a MeatBag with Orange Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_white", name: "White Mask", description: "Own a MeatBag with White Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_yellow", name: "Yellow Mask", description: "Own a MeatBag with Yellow Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_lightblue", name: "Light Blue Mask", description: "Own a MeatBag with Light Blue Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_green", name: "Green Mask", description: "Own a MeatBag with Green Mask", points: 75, isStackable: true, category: "stackable" },
  { id: "mask_teal", name: "Teal Mask", description: "Own a MeatBag with Teal Mask", points: 75, isStackable: true, category: "stackable" },
  // Uncommon masks
  { id: "mask_olive", name: "Olive Mask", description: "Own a MeatBag with Olive Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_blue", name: "Blue Mask", description: "Own a MeatBag with Blue Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_black", name: "Black Mask", description: "Own a MeatBag with Black Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_burgundy", name: "Burgundy Mask", description: "Own a MeatBag with Burgundy Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_grey", name: "Grey Mask", description: "Own a MeatBag with Grey Mask", points: 125, isStackable: true, category: "stackable" },
  { id: "mask_pink", name: "Pink Mask", description: "Own a MeatBag with Pink Mask", points: 125, isStackable: true, category: "stackable" },
  // Rare masks
  { id: "mask_orchid", name: "Orchid Mask", description: "Own a MeatBag with Orchid Mask", points: 250, isStackable: true, category: "stackable" },
  { id: "mask_navy", name: "Navy Mask", description: "Own a MeatBag with Navy Mask", points: 250, isStackable: true, category: "stackable" },
  { id: "mask_brown", name: "Brown Mask", description: "Own a MeatBag with Brown Mask", points: 300, isStackable: true, category: "stackable" },
  // Legendary masks (Gold and GH-Gold are the same mask — both map to GH-Gold)
  { id: "mask_ghgold", name: "GH-Gold Mask", description: "Own a MeatBag with GH-Gold Mask", points: 1_500, isStackable: true, category: "stackable" },
  // Mythic masks
  { id: "mask_1of1", name: "1/1 Mask", description: "Own a MeatBag with a 1/1 Mask", points: 7_000, isStackable: true, category: "stackable" },
  { id: "mask_nothing", name: "Maskless", description: "Own a MeatBag with No Mask", points: 7_700, isStackable: true, category: "stackable" },
  // Other stackable
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
  "Light Blue": "mask_lightblue",
  Green: "mask_green",
  Teal: "mask_teal",
  Olive: "mask_olive",
  Blue: "mask_blue",
  Black: "mask_black",
  Burgundy: "mask_burgundy",
  Grey: "mask_grey",
  Pink: "mask_pink",
  Orchid: "mask_orchid",
  Navy: "mask_navy",
  Brown: "mask_brown",
  Gold: "mask_ghgold",
  "GH-Gold": "mask_ghgold",
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
 * Auto-detect one-time badges that can be determined from NFT data alone.
 * Badges like Shitlord, Raider, OG Holder etc. need external verification.
 *
 * @param isOriginalMinter - Whether the wallet is an original minter (detected by loyalty-detector).
 *                           Used for OG Holder and Veteran badges.
 */
const calculateAutoOneTimeBadges = (
  nfts: readonly MeatbagNft[],
  isOriginalMinter = false,
): string[] => {
  const earned: string[] = [];
  if (nfts.length === 0) return earned;

  const maskRarities = new Set(nfts.map((n) => MASK_COLOR_CONFIG[n.maskColor]?.rarity));
  const totalDailyYield = nfts.reduce((s, n) => s + (MASK_COLOR_CONFIG[n.maskColor]?.dailyYield ?? 0), 0);
  const hasStaked = nfts.some((n) => n.isStaked);
  const hasListed = nfts.some((n) => n.isListed);

  // Collectoor — own at least 1 MeatBag
  if (nfts.length >= 1) earned.push("collectoor");
  // Staker — at least 1 staked
  if (hasStaked) earned.push("staker");
  // Whale — 50+ MeatBags
  if (nfts.length >= 50) earned.push("whale");
  // Hoarder — 100+ MeatBags
  if (nfts.length >= 100) earned.push("hoarder");
  // Rare Hunter — owns Rare, Legendary, or Mythic mask
  if (maskRarities.has("Rare") || maskRarities.has("Legendary") || maskRarities.has("Mythic")) earned.push("rare_hunter");
  // Preparer — 100K+ total daily yield
  if (totalDailyYield >= 100_000) earned.push("preparer");
  // Diamond Hands — 5+ NFTs, none listed
  if (nfts.length >= 5 && !hasListed) earned.push("diamond_hands");
  // OG Holder — original minter still holds
  if (isOriginalMinter) earned.push("og_holder");
  // Veteran — original minter holding since mint (Mint was Oct 15 2024, so 90+ days has passed)
  // For secondary buyers we can't determine hold duration yet, so only original minters qualify
  if (isOriginalMinter) earned.push("veteran");

  return earned;
};

/**
 * Calculate complete loserboard stats for a set of NFTs
 *
 * @param isOriginalMinter - Whether the wallet minted at least one of its NFTs (from loyalty-detector).
 *                           Enables OG Holder and Veteran badges.
 */
export const calculateLoserboardStats = (
  nfts: readonly MeatbagNft[],
  manualBadgeIds: readonly string[] = [],
  isOriginalMinter = false,
): UserLoserboardStats => {
  const stackableBadges = calculateStackableBadges(nfts);

  // Auto-detect one-time badges from NFT data + minter status
  const autoBadgeIds = calculateAutoOneTimeBadges(nfts, isOriginalMinter);
  // Merge auto-detected + manually awarded (deduplicated)
  const allOneTimeIds = [...new Set([...autoBadgeIds, ...manualBadgeIds])];

  const oneTimeBadges: EarnedBadge[] = allOneTimeIds
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
