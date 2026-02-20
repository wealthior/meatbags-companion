import { describe, it, expect } from "vitest";
import {
  determineTier,
  calculateTierProgress,
  calculateStackableBadges,
  calculateDeadPoints,
  calculateLoserboardStats,
  BADGE_DEFINITIONS,
} from "@/lib/domain/loserboard";
import type { MeatbagNft, MaskColor } from "@/types/nft";
import type { GeocacheNft, GeocacheTier, GeocacheSeries } from "@/types/geocache";
import { getBaseYield } from "@/lib/domain/traits";

const makeMockNft = (maskColor: MaskColor): MeatbagNft => ({
  mintAddress: `mock-${maskColor}-${Math.random()}`,
  name: `MeatBag #${maskColor}`,
  imageUrl: "",
  maskColor,
  traits: [],
  ownerWallet: "mock-owner",
  isHonorary: false,
  isSoulbound: false,
  isStaked: false,
  isListed: false,
  dailyYield: getBaseYield(maskColor),
  magicEdenUrl: "",
});

const makeMockGeocache = (
  tier: GeocacheTier = "Common",
  series: GeocacheSeries = "Bounty Box I",
  overrides?: Partial<GeocacheNft>,
): GeocacheNft => ({
  mintAddress: `mock-gc-${Math.random()}`,
  name: `GeoCaches #${Math.floor(Math.random() * 1000)}`,
  imageUrl: "",
  ownerWallet: "mock-owner",
  tier,
  series,
  traits: [
    { traitType: "Tier", value: tier },
    { traitType: "Series", value: series },
  ],
  isBurned: false,
  isListed: false,
  magicEdenUrl: "",
  ...overrides,
});

describe("determineTier", () => {
  it("returns Bronze for 40 points", () => {
    expect(determineTier(40)).toBe("Bronze");
  });

  it("returns Bronze for 24,000 points", () => {
    expect(determineTier(24_000)).toBe("Bronze");
  });

  it("returns Silver for 25,000 points", () => {
    expect(determineTier(25_000)).toBe("Silver");
  });

  it("returns Gold for 100,000 points", () => {
    expect(determineTier(100_000)).toBe("Gold");
  });

  it("returns Platinum for 225,000 points", () => {
    expect(determineTier(225_000)).toBe("Platinum");
  });

  it("returns Immortal for 400,000 points", () => {
    expect(determineTier(400_000)).toBe("Immortal");
  });

  it("returns Immortal for 1,000,000 points", () => {
    expect(determineTier(1_000_000)).toBe("Immortal");
  });

  it("returns Bronze for 0 points", () => {
    expect(determineTier(0)).toBe("Bronze");
  });
});

describe("calculateTierProgress", () => {
  it("returns 0 progress at tier minimum", () => {
    const result = calculateTierProgress(40);
    expect(result.tier).toBe("Bronze");
    expect(result.progress).toBeCloseTo(0, 1);
  });

  it("returns 1 progress for Immortal", () => {
    const result = calculateTierProgress(500_000);
    expect(result.tier).toBe("Immortal");
    expect(result.progress).toBe(1);
    expect(result.pointsToNextTier).toBe(0);
  });

  it("calculates mid-tier progress correctly", () => {
    // Silver: 25,000 to 96,000 (next: Gold at 100,000)
    const result = calculateTierProgress(50_000);
    expect(result.tier).toBe("Silver");
    expect(result.pointsToNextTier).toBe(50_000); // 100,000 - 50,000
  });
});

describe("calculateStackableBadges", () => {
  it("returns badges for owned mask colors", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Red"),
      makeMockNft("Gold"),
    ];
    const badges = calculateStackableBadges(nfts);

    const redBadge = badges.find((b) => b.badge.id === "mask_red");
    expect(redBadge).toBeDefined();
    expect(redBadge!.count).toBe(2);

    // Gold maps to GH-Gold (Gold IS GH-Gold)
    const goldBadge = badges.find((b) => b.badge.id === "mask_ghgold");
    expect(goldBadge).toBeDefined();
    expect(goldBadge!.count).toBe(1);
  });

  it("returns empty array for no NFTs", () => {
    const badges = calculateStackableBadges([]);
    expect(badges).toHaveLength(0);
  });

  it("returns common geocache badges for common geocaches", () => {
    const geocaches = [
      makeMockGeocache("Common"),
      makeMockGeocache("Common"),
      makeMockGeocache("Common"),
    ];
    const badges = calculateStackableBadges([], geocaches);

    const commonBadge = badges.find((b) => b.badge.id === "geocache_common");
    expect(commonBadge).toBeDefined();
    expect(commonBadge!.count).toBe(3);
  });

  it("returns rare geocache badges for rare geocaches", () => {
    const geocaches = [
      makeMockGeocache("Rare"),
      makeMockGeocache("Rare"),
    ];
    const badges = calculateStackableBadges([], geocaches);

    const rareBadge = badges.find((b) => b.badge.id === "geocache_rare");
    expect(rareBadge).toBeDefined();
    expect(rareBadge!.count).toBe(2);
  });

  it("returns both common and rare geocache badges for mixed geocaches", () => {
    const geocaches = [
      makeMockGeocache("Common"),
      makeMockGeocache("Common"),
      makeMockGeocache("Rare"),
    ];
    const badges = calculateStackableBadges([], geocaches);

    const commonBadge = badges.find((b) => b.badge.id === "geocache_common");
    const rareBadge = badges.find((b) => b.badge.id === "geocache_rare");
    expect(commonBadge).toBeDefined();
    expect(commonBadge!.count).toBe(2);
    expect(rareBadge).toBeDefined();
    expect(rareBadge!.count).toBe(1);
  });

  it("returns special series geocache badges split by tier (Halloween, Merry Crisis)", () => {
    const geocaches = [
      makeMockGeocache("Common", "Halloween"),
      makeMockGeocache("Rare", "Halloween"),
      makeMockGeocache("Common", "Merry Crisis"),
      makeMockGeocache("Rare", "Merry Crisis"),
    ];
    const badges = calculateStackableBadges([], geocaches);

    // Halloween split by tier
    const halloweenCommon = badges.find((b) => b.badge.id === "geocache_halloween_common");
    const halloweenRare = badges.find((b) => b.badge.id === "geocache_halloween_rare");
    expect(halloweenCommon).toBeDefined();
    expect(halloweenCommon!.count).toBe(1);
    expect(halloweenRare).toBeDefined();
    expect(halloweenRare!.count).toBe(1);

    // Merry Crisis split by tier
    const mcCommon = badges.find((b) => b.badge.id === "geocache_merry_crisis_common");
    const mcRare = badges.find((b) => b.badge.id === "geocache_merry_crisis_rare");
    expect(mcCommon).toBeDefined();
    expect(mcCommon!.count).toBe(1);
    expect(mcRare).toBeDefined();
    expect(mcRare!.count).toBe(1);

    // Halloween/MC should NOT be counted in regular geocache buckets
    const regularCommon = badges.find((b) => b.badge.id === "geocache_common");
    const regularRare = badges.find((b) => b.badge.id === "geocache_rare");
    expect(regularCommon).toBeUndefined();
    expect(regularRare).toBeUndefined();
  });
});

describe("calculateDeadPoints", () => {
  it("calculates total from stackable badges", () => {
    const nfts = [
      makeMockNft("Red"),   // 75 points per badge
      makeMockNft("Red"),
      makeMockNft("Gold"),  // 1,500 points per badge
    ];
    const badges = calculateStackableBadges(nfts);
    const points = calculateDeadPoints(badges);

    expect(points).toBe(75 * 2 + 1_500);
  });
});

describe("calculateLoserboardStats", () => {
  it("returns complete stats for NFT holdings", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Gold"),
      makeMockNft("Nothing"),
    ];
    const stats = calculateLoserboardStats(nfts);

    expect(stats.deadPoints).toBeGreaterThan(0);
    expect(stats.currentTier).toBeDefined();
    expect(stats.badges.length).toBeGreaterThan(0);
  });

  it("includes one-time badges when provided", () => {
    const nfts = [makeMockNft("Red")];
    const stats = calculateLoserboardStats(nfts, ["shitlord", "raider"]);

    const shitlordBadge = stats.badges.find((b) => b.badge.id === "shitlord");
    const raiderBadge = stats.badges.find((b) => b.badge.id === "raider");

    expect(shitlordBadge).toBeDefined();
    expect(raiderBadge).toBeDefined();
    // 75 (Red mask) + 500 (Shitlord) + 1000 (Raider) + 750 (Collectoor auto-detected)
    expect(stats.deadPoints).toBe(75 + 500 + 1_000 + 750);
  });
});

describe("BADGE_DEFINITIONS", () => {
  it("has exactly 42 badges", () => {
    expect(BADGE_DEFINITIONS).toHaveLength(42);
  });

  it("has unique IDs", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has both one-time and stackable badges", () => {
    const oneTime = BADGE_DEFINITIONS.filter((b) => !b.isStackable);
    const stackable = BADGE_DEFINITIONS.filter((b) => b.isStackable);
    expect(oneTime.length).toBeGreaterThan(0);
    expect(stackable.length).toBeGreaterThan(0);
  });
});
