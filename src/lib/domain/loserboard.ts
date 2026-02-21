import type { LoserboardTier, TierConfig, BadgeDefinition, UserLoserboardStats, EarnedBadge } from "@/types/loserboard";
import type { MeatbagNft } from "@/types/nft";
import type { GeocacheNft } from "@/types/geocache";
import type { DeadbruvEarnedBadge } from "@/types/deadbruv";
import { TIER_CONFIGS } from "@/lib/utils/constants";

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

// ─── BADGE DEFINITIONS (exact 34 badges from gitbook) ─────────────────────
// IDs match deadbruv naming: name.toLowerCase().replace(/\s+/g, "_")

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  // ── One-Time Badges (20) ──
  // Core achievements
  { id: "shitlord", name: "Shitlord", description: "Complete Shit & Run", points: 1_500, isStackable: false, category: "one-time" },
  { id: "raider", name: "Raider", description: "Complete 10 Raids", points: 1_500, isStackable: false, category: "one-time" },
  { id: "billionaire", name: "Billionaire", description: "Own 20 Meatbags", points: 1_000, isStackable: false, category: "one-time" },
  { id: "illegal_alien", name: "Illegal Alien", description: "Own 51 Meatbags", points: 2_500, isStackable: false, category: "one-time" },
  { id: "world_fucker", name: "World Fucker", description: "Win Who F*cked the World", points: 1_500, isStackable: false, category: "one-time" },
  { id: "hoarder", name: "Hoarder", description: "Own Every Meatbag Mask Color", points: 2_000, isStackable: false, category: "one-time" },
  { id: "collectoor", name: "Collectoor", description: "Own 10 Meatbags", points: 1_250, isStackable: false, category: "one-time" },
  { id: "silly_sausage", name: "Silly Sausage", description: "Lose 3 Rise of the Meatbags Raids", points: 500, isStackable: false, category: "one-time" },
  { id: "trait_maxi", name: "Trait Maxi", description: "Own 5 of the same trait", points: 750, isStackable: false, category: "one-time" },
  { id: "lucky_duck", name: "Lucky Duck", description: "Pull a Rare Meatbag from a Geocache", points: 1_250, isStackable: false, category: "one-time" },
  // Raid / Event participation badges (from deadbruv API)
  { id: "ass_savers", name: "Ass Savers", description: "Participate in Ass Savers event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "edge_of_extinction", name: "Edge of Extinction", description: "Participate in Edge of Extinction event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "hot_nuggets", name: "Hot Nuggets", description: "Participate in Hot Nuggets event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "paranormal_profiles", name: "Paranormal Profiles", description: "Participate in Paranormal Profiles event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "sheet_suggestions", name: "Sheet Suggestions", description: "Participate in Sheet Suggestions event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "the_end_is_near", name: "The End is Near", description: "Participate in The End is Near event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "the_wrapture", name: "The Wrapture", description: "Participate in The Wrapture event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "tower_of_terror", name: "Tower of Terror", description: "Participate in Tower of Terror event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "yotm", name: "YOTM", description: "Participate in YOTM event", points: 1_000, isStackable: false, category: "one-time" },
  { id: "ishit", name: "iShit", description: "Participate in iShit event", points: 1_000, isStackable: false, category: "one-time" },

  // ── Stackable Badges (24) ──
  // General
  { id: "prepper", name: "Prepper", description: "Own 1 Meatbag", points: 1_000, isStackable: true, category: "stackable" },
  // Mask-based (20 masks)
  { id: "ketchup_king", name: "Ketchup King", description: "Own a Meatbag with a Red Mask", points: 1_000, isStackable: true, category: "stackable" },
  { id: "hillbilly", name: "Hillbilly", description: "Own a Meatbag with a Purple Mask", points: 1_025, isStackable: true, category: "stackable" },
  { id: "fallout_division", name: "Fallout Division", description: "Own a Meatbag with a Orange Mask", points: 1_050, isStackable: true, category: "stackable" },
  { id: "ghostface", name: "Ghostface", description: "Own a Meatbag with a White Mask", points: 1_075, isStackable: true, category: "stackable" },
  { id: "banana_zone", name: "Banana Zone", description: "Own a Meatbag with a Yellow Mask", points: 1_100, isStackable: true, category: "stackable" },
  { id: "ice_cold", name: "Ice Cold", description: "Own a Meatbag with a Light Blue Mask", points: 1_125, isStackable: true, category: "stackable" },
  { id: "mutant", name: "Mutant", description: "Own a Meatbag with a Green Mask", points: 1_150, isStackable: true, category: "stackable" },
  { id: "sludge_slinger", name: "Sludge Slinger", description: "Own a Meatbag with a Teal Mask", points: 1_175, isStackable: true, category: "stackable" },
  { id: "ex-military", name: "Ex-Military", description: "Own a Meatbag with a Olive Mask", points: 1_200, isStackable: true, category: "stackable" },
  { id: "down_bad", name: "Down Bad", description: "Own a Meatbag with a Blue Mask", points: 1_225, isStackable: true, category: "stackable" },
  { id: "doom_daddy", name: "Doom Daddy", description: "Own a Meatbag with a Black Mask", points: 1_250, isStackable: true, category: "stackable" },
  { id: "meat_muncher", name: "Meat Muncher", description: "Own a Meatbag with a Burgundy Mask", points: 1_275, isStackable: true, category: "stackable" },
  { id: "tinfoil_titan", name: "Tinfoil Titan", description: "Own a Meatbag with a Grey Mask", points: 1_300, isStackable: true, category: "stackable" },
  { id: "brain_rot", name: "Brain Rot", description: "Own a Meatbag with a Pink Mask", points: 1_325, isStackable: true, category: "stackable" },
  { id: "rich_elite", name: "Rich Elite", description: "Own a Meatbag with a Orchid Mask", points: 1_350, isStackable: true, category: "stackable" },
  { id: "deep_fried", name: "Deep Fried", description: "Own a Meatbag with a Navy Mask", points: 1_375, isStackable: true, category: "stackable" },
  { id: "roachmen", name: "Roachmen", description: "Own a Meatbag with a Brown Mask", points: 1_400, isStackable: true, category: "stackable" },
  { id: "golden_horde", name: "Golden Horde", description: "Own a Meatbag with a Gold Mask", points: 4_200, isStackable: true, category: "stackable" },
  { id: "warlord", name: "Warlord", description: "Own a Meatbag with a 1/1 Mask", points: 7_000, isStackable: true, category: "stackable" },
  { id: "maskless", name: "Maskless", description: "Own a Meatbag with No Mask", points: 7_700, isStackable: true, category: "stackable" },
  // Special stackable
  { id: "diamond_handed", name: "Diamond Handed", description: "Own a Meatbag you Minted", points: 500, isStackable: true, category: "stackable" },
  // Geocache Box Breakers
  { id: "common_box_breaker", name: "Common Box Breaker", description: "Break open a common loot box", points: 75, isStackable: true, category: "stackable" },
  { id: "rare_box_breaker", name: "Rare Box Breaker", description: "Break open a rare loot box", points: 125, isStackable: true, category: "stackable" },
];

/** Normalize a deadbruv badge name to our badge ID format */
const normalizeBadgeId = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "_");

/** O(1) lookup map for badge definitions by ID */
const BADGE_DEFINITIONS_MAP = new Map<string, BadgeDefinition>(
  BADGE_DEFINITIONS.map((b) => [b.id, b]),
);

/**
 * Reverse-lookup: normalized deadbruv name → our BadgeDefinition.
 * Handles cases where names differ slightly (e.g. "Ex-Military" → "ex-military").
 * Also adds the normalized name as a secondary key for fuzzy matching.
 */
const BADGE_BY_NORMALIZED_NAME = new Map<string, BadgeDefinition>(
  BADGE_DEFINITIONS.map((b) => [normalizeBadgeId(b.name), b]),
);

/** Resolve a deadbruv badge name to our BadgeDefinition (tries ID first, then normalized name) */
const resolveBadgeDefinition = (deadbruvName: string): BadgeDefinition | undefined => {
  const normalized = normalizeBadgeId(deadbruvName);
  return BADGE_DEFINITIONS_MAP.get(normalized) ?? BADGE_BY_NORMALIZED_NAME.get(normalized);
};

/** Map MaskColor → badge ID (matching deadbruv badge names from gitbook) */
const MASK_BADGE_MAP: Record<string, string> = {
  Red: "ketchup_king",
  Purple: "hillbilly",
  Orange: "fallout_division",
  White: "ghostface",
  Yellow: "banana_zone",
  "Light Blue": "ice_cold",
  Green: "mutant",
  Teal: "sludge_slinger",
  Olive: "ex-military",
  Blue: "down_bad",
  Black: "doom_daddy",
  Burgundy: "meat_muncher",
  Grey: "tinfoil_titan",
  Pink: "brain_rot",
  Orchid: "rich_elite",
  Navy: "deep_fried",
  Brown: "roachmen",
  Gold: "golden_horde",
  "GH-Gold": "golden_horde",
  "1/1": "warlord",
  Nothing: "maskless",
};

// ─── BLOCKCHAIN AUTO-DETECTION ────────────────────────────────────────────

/**
 * Calculate all badges that can be auto-detected from blockchain data.
 * Used as supplement when deadbruv is primary, or as full source when unavailable.
 *
 * SoulBound Honorary NFTs (airdropped 1/1s, #10001+) are excluded from all
 * badge calculations — they are not regular collection items.
 */
export const calculateBadgesFromBlockchain = (
  nfts: readonly MeatbagNft[],
  geocaches: readonly GeocacheNft[] = [],
): EarnedBadge[] => {
  const badges: EarnedBadge[] = [];

  // Exclude SoulBound Honorary NFTs — they're airdropped and shouldn't count
  const eligibleNfts = nfts.filter((n) => !n.isSoulbound);

  if (eligibleNfts.length === 0 && geocaches.length === 0) return badges;

  // ── Stackable: Prepper (1000 pts per owned Meatbag) ──
  if (eligibleNfts.length > 0) {
    const prepper = BADGE_DEFINITIONS_MAP.get("prepper");
    if (prepper) badges.push({ badge: prepper, count: eligibleNfts.length });
  }

  // ── Stackable: Mask-based badges (count per mask color) ──
  const maskCounts: Record<string, number> = {};
  for (const nft of eligibleNfts) {
    const badgeId = MASK_BADGE_MAP[nft.maskColor];
    if (badgeId) {
      maskCounts[badgeId] = (maskCounts[badgeId] ?? 0) + 1;
    }
  }
  for (const [badgeId, count] of Object.entries(maskCounts)) {
    const badge = BADGE_DEFINITIONS_MAP.get(badgeId);
    if (badge && count > 0) badges.push({ badge, count });
  }

  // ── One-time: Collectoor (Own 10 Meatbags) ──
  if (eligibleNfts.length >= 10) {
    const badge = BADGE_DEFINITIONS_MAP.get("collectoor");
    if (badge) badges.push({ badge, count: 1 });
  }

  // ── One-time: Billionaire (Own 20 Meatbags) ──
  if (eligibleNfts.length >= 20) {
    const badge = BADGE_DEFINITIONS_MAP.get("billionaire");
    if (badge) badges.push({ badge, count: 1 });
  }

  // ── One-time: Illegal Alien (Own 51 Meatbags) ──
  if (eligibleNfts.length >= 51) {
    const badge = BADGE_DEFINITIONS_MAP.get("illegal_alien");
    if (badge) badges.push({ badge, count: 1 });
  }

  // ── One-time: Hoarder (Own Every Mask Color — all 20 unique) ──
  const uniqueMasks = new Set<string>();
  for (const nft of eligibleNfts) {
    uniqueMasks.add(nft.maskColor === "GH-Gold" ? "Gold" : nft.maskColor);
  }
  if (uniqueMasks.size >= 20) {
    const badge = BADGE_DEFINITIONS_MAP.get("hoarder");
    if (badge) badges.push({ badge, count: 1 });
  }

  // ── One-time: Trait Maxi (Own 5 of same trait) ──
  const hasFiveOfSame = Object.values(maskCounts).some((c) => c >= 5);
  if (hasFiveOfSame) {
    const badge = BADGE_DEFINITIONS_MAP.get("trait_maxi");
    if (badge) badges.push({ badge, count: 1 });
  }

  // ── Stackable: Geocache Box Breakers (only opened/burned count) ──
  let commonGcCount = 0;
  let rareGcCount = 0;
  for (const gc of geocaches) {
    if (!gc.isBurned) continue; // Skip held (unopened) geocaches
    if (gc.tier === "Common") commonGcCount++;
    else if (gc.tier === "Rare") rareGcCount++;
  }
  if (commonGcCount > 0) {
    const badge = BADGE_DEFINITIONS_MAP.get("common_box_breaker");
    if (badge) badges.push({ badge, count: commonGcCount });
  }
  if (rareGcCount > 0) {
    const badge = BADGE_DEFINITIONS_MAP.get("rare_box_breaker");
    if (badge) badges.push({ badge, count: rareGcCount });
  }

  return badges;
};

// ─── CALCULATION FUNCTIONS ─────────────────────────────────────────────────

/**
 * Calculate total Dead Points from earned badges
 */
export const calculateDeadPoints = (badges: readonly EarnedBadge[]): number =>
  badges.reduce((total, { badge, count }) => total + badge.points * count, 0);

/**
 * Calculate earned stackable badges from NFT holdings and geocache holdings.
 * Used in the blockchain-only fallback path.
 */
export const calculateStackableBadges = (
  nfts: readonly MeatbagNft[],
  geocaches: readonly GeocacheNft[] = [],
): EarnedBadge[] => {
  return calculateBadgesFromBlockchain(nfts, geocaches).filter((b) => b.badge.isStackable);
};

/**
 * Calculate complete loserboard stats from blockchain data only (fallback).
 * Used when deadbruv.com is unavailable.
 */
export const calculateLoserboardStats = (
  nfts: readonly MeatbagNft[],
  _manualBadgeIds: readonly string[] = [],
  _isOriginalMinter = false,
  geocaches: readonly GeocacheNft[] = [],
): UserLoserboardStats => {
  const allBadges = calculateBadgesFromBlockchain(nfts, geocaches);
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

/**
 * Calculate loserboard stats from deadbruv.com badge data (PRIMARY path).
 *
 * Merges deadbruv badges with blockchain-detected badges:
 * - Uses our BADGE_DEFINITIONS to determine stackability (not just deadbruv category)
 * - For each badge, takes the MAX count between deadbruv and blockchain
 * - Adds blockchain-only badges that deadbruv doesn't have
 *
 * This ensures multi-wallet users get correct counts even if deadbruv
 * hasn't synced all wallets, and auto-detectable badges are always present.
 */
export const calculateLoserboardStatsFromDeadbruv = (
  earnedBadges: readonly DeadbruvEarnedBadge[],
  nfts: readonly MeatbagNft[] = [],
  geocaches: readonly GeocacheNft[] = [],
): UserLoserboardStats => {
  // 1. Build earned badges map from deadbruv data
  const mergedMap = new Map<string, EarnedBadge>();

  for (const { badge, userBadge } of earnedBadges) {
    // Resolve via robust lookup: tries ID match first, then normalized name
    const ourDef = resolveBadgeDefinition(badge.name);
    const badgeId = ourDef?.id ?? normalizeBadgeId(badge.name);

    // Determine stackability from OUR definitions (covers Diamond Handed, Box Breakers)
    // Fall back to deadbruv category if badge is unknown to us
    const isStackable = ourDef ? ourDef.isStackable : badge.category === "IndividualNFTBased";
    const count = isStackable ? Math.max(userBadge.traitCount, 1) : 1;

    mergedMap.set(badgeId, {
      badge: {
        id: badgeId,
        name: ourDef?.name ?? badge.name,
        description: ourDef?.description ?? badge.description,
        points: ourDef?.points ?? badge.points,
        isStackable,
        category: isStackable ? "stackable" as const : "one-time" as const,
        imageUrl: badge.imageURL,
        badgeType: badge.type,
        badgeCategory: badge.category,
      },
      count,
    });
  }

  // 2. Calculate blockchain-detectable badges and merge (take MAX count)
  const blockchainBadges = calculateBadgesFromBlockchain(nfts, geocaches);
  for (const bcBadge of blockchainBadges) {
    const existing = mergedMap.get(bcBadge.badge.id);
    if (!existing) {
      // Badge not in deadbruv → add from blockchain
      mergedMap.set(bcBadge.badge.id, bcBadge);
    } else if (bcBadge.badge.isStackable && bcBadge.count > existing.count) {
      // Blockchain detected more → use higher count (keep deadbruv's imageUrl)
      mergedMap.set(bcBadge.badge.id, { ...existing, count: bcBadge.count });
    }
  }

  const allBadges = [...mergedMap.values()];
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
