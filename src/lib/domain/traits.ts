import type { MaskColor, MaskColorConfig, NftTrait, LoyaltyMultiplier, MeatbagNft } from "@/types/nft";
import { MASK_COLOR_CONFIG } from "@/lib/utils/constants";

/**
 * Get the configuration for a specific mask color
 */
export const getMaskColorConfig = (color: MaskColor): MaskColorConfig =>
  MASK_COLOR_CONFIG[color];

/**
 * Get the base daily yield for a mask color
 */
export const getBaseYield = (color: MaskColor): number =>
  MASK_COLOR_CONFIG[color].dailyYield;

/**
 * Calculate the effective daily yield with loyalty multiplier applied
 */
export const getDailyYield = (color: MaskColor, multiplier: LoyaltyMultiplier): number =>
  Math.floor(MASK_COLOR_CONFIG[color].dailyYield * multiplier);

/**
 * Extract the mask color from NFT metadata traits.
 * Looks for trait_type "Mask" or "Mask Color" in the traits array.
 * Returns "Nothing" if no mask trait is found (maskless).
 */
export const getMaskColorFromTraits = (traits: readonly NftTrait[]): MaskColor => {
  const maskTrait = traits.find(
    (t) =>
      t.traitType.toLowerCase() === "mask" ||
      t.traitType.toLowerCase() === "mask color" ||
      t.traitType.toLowerCase() === "masks"
  );

  if (!maskTrait) return "Nothing";

  const value = maskTrait.value.trim();

  // Check for exact match first
  if (value in MASK_COLOR_CONFIG) return value as MaskColor;

  // Normalize hyphens to spaces (Helius returns "Light-Blue", we use "Light Blue")
  const normalized = value.replace(/-/g, " ");
  if (normalized in MASK_COLOR_CONFIG) return normalized as MaskColor;

  // Case-insensitive match (also try with hyphens replaced)
  const lowerValue = normalized.toLowerCase();
  const matchedKey = Object.keys(MASK_COLOR_CONFIG).find(
    (key) => key.toLowerCase() === lowerValue
  );
  if (matchedKey) return matchedKey as MaskColor;

  // Check for "None", "No Mask", etc.
  if (["none", "no mask", "nothing", "maskless", "naked"].includes(lowerValue)) {
    return "Nothing";
  }

  // Check for 1/1 patterns
  if (lowerValue.includes("1/1") || lowerValue.includes("one of one") || lowerValue.includes("1 of 1")) {
    return "1/1";
  }

  // Default to Nothing if unrecognized
  return "Nothing";
};

/**
 * Get the hex color for displaying a mask color in the UI
 */
export const getMaskHexColor = (color: MaskColor): string =>
  MASK_COLOR_CONFIG[color].hexColor;

/**
 * Group NFTs by their mask color
 */
export const groupByMaskColor = (
  nfts: readonly MeatbagNft[]
): Record<MaskColor, MeatbagNft[]> => {
  const groups: Record<string, MeatbagNft[]> = {};
  for (const color of Object.keys(MASK_COLOR_CONFIG)) {
    groups[color] = [];
  }
  for (const nft of nfts) {
    if (groups[nft.maskColor]) {
      groups[nft.maskColor].push(nft);
    }
  }
  return groups as Record<MaskColor, MeatbagNft[]>;
};

/**
 * Sort NFTs by their mask color's daily yield (descending by default)
 */
export const sortByYield = (
  nfts: readonly MeatbagNft[],
  ascending = false
): MeatbagNft[] => {
  const sorted = [...nfts].sort(
    (a, b) => getBaseYield(b.maskColor) - getBaseYield(a.maskColor)
  );
  return ascending ? sorted.reverse() : sorted;
};

/**
 * Extract the number from an NFT name (e.g., "MEATBAG #176" -> 176)
 */
export const extractNftNumber = (name: string): number | null => {
  const match = name.match(/#(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Check if an NFT is honorary based on its number (#10000+) or 1/1 mask color.
 * All MeatBags > #10000 are honorary soulbound 1/1s.
 */
export const isHonoraryNft = (name: string, traits: readonly NftTrait[]): boolean => {
  const num = extractNftNumber(name);
  if (num !== null && num > 10_000) return true;

  const maskColor = getMaskColorFromTraits(traits);
  if (maskColor === "1/1") return true;

  return traits.some(
    (t) =>
      t.traitType.toLowerCase() === "type" &&
      (t.value.toLowerCase() === "honorary" || t.value.toLowerCase() === "1/1")
  );
};

/**
 * Check if an NFT is soulbound (honorary NFTs > #10000 are soulbound).
 * Note: the on-chain `frozen` flag does NOT indicate soulbound - it means staked.
 */
export const isSoulboundNft = (name: string): boolean => {
  const num = extractNftNumber(name);
  return num !== null && num > 10_000;
};
