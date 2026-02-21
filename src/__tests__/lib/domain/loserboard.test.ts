import { describe, it, expect } from "vitest";
import {
  determineTier,
  calculateTierProgress,
  calculateStackableBadges,
  calculateDeadPoints,
  calculateLoserboardStats,
  calculateLoserboardStatsFromDeadbruv,
  calculateBadgesFromBlockchain,
  BADGE_DEFINITIONS,
} from "@/lib/domain/loserboard";
import type { MeatbagNft, MaskColor } from "@/types/nft";
import type { GeocacheNft, GeocacheTier, GeocacheSeries } from "@/types/geocache";
import type { DeadbruvEarnedBadge } from "@/types/deadbruv";
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
    const result = calculateTierProgress(50_000);
    expect(result.tier).toBe("Silver");
    expect(result.pointsToNextTier).toBe(50_000);
  });
});

describe("calculateBadgesFromBlockchain", () => {
  it("detects Prepper badge for each owned NFT (stackable)", () => {
    const nfts = [makeMockNft("Red"), makeMockNft("Red"), makeMockNft("Gold")];
    const badges = calculateBadgesFromBlockchain(nfts);

    const prepper = badges.find((b) => b.badge.id === "prepper");
    expect(prepper).toBeDefined();
    expect(prepper!.count).toBe(3); // 3 NFTs = 3 Prepper badges
  });

  it("detects mask-color badges with correct counts", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Red"),
      makeMockNft("Gold"),
    ];
    const badges = calculateBadgesFromBlockchain(nfts);

    const redBadge = badges.find((b) => b.badge.id === "ketchup_king");
    expect(redBadge).toBeDefined();
    expect(redBadge!.count).toBe(2);

    const goldBadge = badges.find((b) => b.badge.id === "golden_horde");
    expect(goldBadge).toBeDefined();
    expect(goldBadge!.count).toBe(1);
  });

  it("detects Collectoor at 10+ NFTs", () => {
    const nfts = Array.from({ length: 10 }, () => makeMockNft("Red"));
    const badges = calculateBadgesFromBlockchain(nfts);

    const collectoor = badges.find((b) => b.badge.id === "collectoor");
    expect(collectoor).toBeDefined();
    expect(collectoor!.count).toBe(1);
  });

  it("detects Billionaire at 20+ NFTs", () => {
    const nfts = Array.from({ length: 20 }, () => makeMockNft("Red"));
    const badges = calculateBadgesFromBlockchain(nfts);

    expect(badges.find((b) => b.badge.id === "billionaire")).toBeDefined();
    expect(badges.find((b) => b.badge.id === "collectoor")).toBeDefined(); // Also has 10+
  });

  it("detects Illegal Alien at 51+ NFTs", () => {
    const nfts = Array.from({ length: 51 }, () => makeMockNft("Red"));
    const badges = calculateBadgesFromBlockchain(nfts);

    expect(badges.find((b) => b.badge.id === "illegal_alien")).toBeDefined();
    expect(badges.find((b) => b.badge.id === "billionaire")).toBeDefined();
  });

  it("detects Trait Maxi with 5+ of same mask", () => {
    const nfts = Array.from({ length: 5 }, () => makeMockNft("Blue"));
    const badges = calculateBadgesFromBlockchain(nfts);

    expect(badges.find((b) => b.badge.id === "trait_maxi")).toBeDefined();
  });

  it("does NOT detect Trait Maxi with fewer than 5 of same mask", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Blue"),
      makeMockNft("Green"),
      makeMockNft("Gold"),
    ];
    const badges = calculateBadgesFromBlockchain(nfts);

    expect(badges.find((b) => b.badge.id === "trait_maxi")).toBeUndefined();
  });

  it("detects geocache box breaker badges (only opened/burned)", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Rare", "Bounty Box I", { isBurned: true }),
    ];
    const badges = calculateBadgesFromBlockchain([], geocaches);

    const common = badges.find((b) => b.badge.id === "common_box_breaker");
    const rare = badges.find((b) => b.badge.id === "rare_box_breaker");
    expect(common).toBeDefined();
    expect(common!.count).toBe(2);
    expect(rare).toBeDefined();
    expect(rare!.count).toBe(1);
  });

  it("ignores held (unopened) geocaches for box breaker badges", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isBurned: false }), // held
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),  // opened
      makeMockGeocache("Rare", "Bounty Box I", { isBurned: false }),   // held
    ];
    const badges = calculateBadgesFromBlockchain([], geocaches);

    const common = badges.find((b) => b.badge.id === "common_box_breaker");
    expect(common).toBeDefined();
    expect(common!.count).toBe(1); // Only the burned one

    const rare = badges.find((b) => b.badge.id === "rare_box_breaker");
    expect(rare).toBeUndefined(); // Rare was held, not opened
  });

  it("counts all geocache series under same box breaker badge", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Common", "Halloween", { isBurned: true }),
      makeMockGeocache("Common", "Merry Crisis", { isBurned: true }),
      makeMockGeocache("Rare", "Shit Box", { isBurned: true }),
    ];
    const badges = calculateBadgesFromBlockchain([], geocaches);

    const common = badges.find((b) => b.badge.id === "common_box_breaker");
    const rare = badges.find((b) => b.badge.id === "rare_box_breaker");
    expect(common!.count).toBe(3); // All commons combined
    expect(rare!.count).toBe(1);
  });

  it("returns empty for no data", () => {
    expect(calculateBadgesFromBlockchain([])).toHaveLength(0);
  });

  it("excludes SoulBound Honorary NFTs from all badge counts", () => {
    const regularNft = makeMockNft("1/1");
    const soulboundNft: MeatbagNft = {
      ...makeMockNft("1/1"),
      name: "MEATBAG #10013",
      isHonorary: true,
      isSoulbound: true,
    };
    const badges = calculateBadgesFromBlockchain([regularNft, soulboundNft]);

    // Only the regular 1/1 counts — soulbound excluded
    const warlord = badges.find((b) => b.badge.id === "warlord");
    expect(warlord).toBeDefined();
    expect(warlord!.count).toBe(1); // Only regular 1/1

    const prepper = badges.find((b) => b.badge.id === "prepper");
    expect(prepper!.count).toBe(1); // Only regular NFT
  });

  it("excludes SoulBound NFTs from Collectoor threshold", () => {
    // 9 regular + 2 soulbound = 11 total, but only 9 eligible
    const regular = Array.from({ length: 9 }, () => makeMockNft("Red"));
    const soulbound: MeatbagNft[] = [
      { ...makeMockNft("1/1"), name: "MEATBAG #10001", isHonorary: true, isSoulbound: true },
      { ...makeMockNft("1/1"), name: "MEATBAG #10002", isHonorary: true, isSoulbound: true },
    ];
    const badges = calculateBadgesFromBlockchain([...regular, ...soulbound]);

    // 9 eligible NFTs < 10 threshold
    expect(badges.find((b) => b.badge.id === "collectoor")).toBeUndefined();

    const prepper = badges.find((b) => b.badge.id === "prepper");
    expect(prepper!.count).toBe(9); // Only regular NFTs
  });
});

describe("calculateStackableBadges", () => {
  it("returns only stackable badges", () => {
    const nfts = Array.from({ length: 10 }, () => makeMockNft("Red"));
    const badges = calculateStackableBadges(nfts);

    // Should include Prepper and Ketchup King but NOT Collectoor (one-time)
    expect(badges.every((b) => b.badge.isStackable)).toBe(true);
    expect(badges.find((b) => b.badge.id === "prepper")).toBeDefined();
    expect(badges.find((b) => b.badge.id === "ketchup_king")).toBeDefined();
    expect(badges.find((b) => b.badge.id === "collectoor")).toBeUndefined();
  });
});

describe("calculateDeadPoints", () => {
  it("calculates total from stackable badges", () => {
    const nfts = [
      makeMockNft("Red"),   // Ketchup King: 1000 pts
      makeMockNft("Red"),
      makeMockNft("Gold"),  // Golden Horde: 4200 pts
    ];
    const badges = calculateStackableBadges(nfts);
    const points = calculateDeadPoints(badges);

    // Prepper x3 (3000) + Ketchup King x2 (2000) + Golden Horde x1 (4200)
    expect(points).toBe(1_000 * 3 + 1_000 * 2 + 4_200);
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

  it("detects one-time badges from NFT data", () => {
    const nfts = Array.from({ length: 20 }, () => makeMockNft("Red"));
    const stats = calculateLoserboardStats(nfts);

    const billionaire = stats.badges.find((b) => b.badge.id === "billionaire");
    const collectoor = stats.badges.find((b) => b.badge.id === "collectoor");
    const traitMaxi = stats.badges.find((b) => b.badge.id === "trait_maxi");

    expect(billionaire).toBeDefined();
    expect(collectoor).toBeDefined();
    expect(traitMaxi).toBeDefined(); // 20 Red = 5+ of same trait
  });
});

describe("BADGE_DEFINITIONS", () => {
  it("has exactly 44 badges (34 gitbook + 10 raid/event)", () => {
    expect(BADGE_DEFINITIONS).toHaveLength(44);
  });

  it("has unique IDs", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has 20 one-time and 24 stackable badges", () => {
    const oneTime = BADGE_DEFINITIONS.filter((b) => !b.isStackable);
    const stackable = BADGE_DEFINITIONS.filter((b) => b.isStackable);
    expect(oneTime.length).toBe(20);
    expect(stackable.length).toBe(24);
  });

  it("has World Fucker with correct ID (no asterisk, matching deadbruv)", () => {
    const wf = BADGE_DEFINITIONS.find((b) => b.id === "world_fucker");
    expect(wf).toBeDefined();
    expect(wf!.name).toBe("World Fucker");
    expect(wf!.points).toBe(1_500);
  });

  it("includes all 10 raid/event badges", () => {
    const raidBadges = [
      "ass_savers", "edge_of_extinction", "hot_nuggets", "paranormal_profiles",
      "sheet_suggestions", "the_end_is_near", "the_wrapture", "tower_of_terror",
      "yotm", "ishit",
    ];
    for (const id of raidBadges) {
      expect(BADGE_DEFINITIONS.find((b) => b.id === id)).toBeDefined();
    }
  });
});

const makeMockDeadbruvBadge = (
  name: string,
  points: number,
  category: "IndividualNFTBased" | "CollectionBased" | "ParticipationBased" | "MultiNFTBased" = "IndividualNFTBased",
  traitCount = 1,
): DeadbruvEarnedBadge => ({
  badge: {
    name,
    imageURL: `https://example.com/badges/${name}.svg`,
    description: `Test badge: ${name}`,
    points,
    type: "REVOKABLE",
    category,
    createdAt: "2025-01-01T00:00:00.000",
  },
  userBadge: {
    userAddress: "mock-wallet",
    badgeId: name,
    status: "ACTIVE",
    revokedAt: null,
    isShowcased: false,
    traitCount,
    createdAt: "2025-01-01T00:00:00.000",
    updatedAt: "2025-01-01T00:00:00.000",
  },
});

describe("calculateLoserboardStatsFromDeadbruv", () => {
  it("returns correct stats for deadbruv badges", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Ketchup King", 1000, "IndividualNFTBased"),
      makeMockDeadbruvBadge("Golden Horde", 4200, "IndividualNFTBased"),
      makeMockDeadbruvBadge("Collectoor", 1250, "CollectionBased"),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    expect(stats.deadPoints).toBe(1000 + 4200 + 1250);
    expect(stats.badges).toHaveLength(3);
    expect(stats.currentTier).toBeDefined();
  });

  it("returns Bronze for empty badges", () => {
    const stats = calculateLoserboardStatsFromDeadbruv([]);

    expect(stats.deadPoints).toBe(0);
    expect(stats.currentTier).toBe("Bronze");
    expect(stats.badges).toHaveLength(0);
  });

  it("preserves badge imageUrl from deadbruv", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Maskless", 7700),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);
    const masklessBadge = stats.badges[0];

    expect(masklessBadge.badge.imageUrl).toBe("https://example.com/badges/Maskless.svg");
    expect(masklessBadge.badge.name).toBe("Maskless");
  });

  it("uses traitCount for stackable badges (our BADGE_DEFINITIONS determines stackability)", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Ketchup King", 1000, "IndividualNFTBased", 11),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    expect(stats.deadPoints).toBe(1000 * 11);
    expect(stats.badges[0].count).toBe(11);
  });

  it("uses traitCount for Diamond Handed even though it is ParticipationBased", () => {
    // Diamond Handed is stackable per gitbook but ParticipationBased in deadbruv
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Diamond Handed", 500, "ParticipationBased", 5),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    // Our BADGE_DEFINITIONS says Diamond Handed isStackable: true
    expect(stats.deadPoints).toBe(500 * 5);
    expect(stats.badges[0].count).toBe(5);
  });

  it("does NOT multiply one-time (CollectionBased) badges by traitCount", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Billionaire", 1000, "CollectionBased", 25),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    expect(stats.deadPoints).toBe(1000); // Not 1000 * 25
    expect(stats.badges[0].count).toBe(1);
  });

  it("merges with blockchain badges, taking max count", () => {
    // deadbruv says Ketchup King x2, but blockchain detects 5 Red NFTs
    const deadbruvBadges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Ketchup King", 1000, "IndividualNFTBased", 2),
    ];
    const nfts = Array.from({ length: 5 }, () => makeMockNft("Red"));

    const stats = calculateLoserboardStatsFromDeadbruv(deadbruvBadges, nfts);

    const ketchup = stats.badges.find((b) => b.badge.id === "ketchup_king");
    expect(ketchup!.count).toBe(5); // Blockchain count (5) > deadbruv count (2)
  });

  it("adds blockchain-only badges not in deadbruv", () => {
    // deadbruv only has mask badges, blockchain also detects Collectoor + Billionaire
    const deadbruvBadges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Ketchup King", 1000, "IndividualNFTBased", 1),
    ];
    const nfts = Array.from({ length: 20 }, () => makeMockNft("Red"));

    const stats = calculateLoserboardStatsFromDeadbruv(deadbruvBadges, nfts);

    expect(stats.badges.find((b) => b.badge.id === "collectoor")).toBeDefined();
    expect(stats.badges.find((b) => b.badge.id === "billionaire")).toBeDefined();
    expect(stats.badges.find((b) => b.badge.id === "trait_maxi")).toBeDefined();
    expect(stats.badges.find((b) => b.badge.id === "prepper")).toBeDefined();
  });

  it("supplements with geocache badges from blockchain data (only burned)", () => {
    const deadbruvBadges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Ketchup King", 1000, "IndividualNFTBased"),
    ];
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Rare", "Bounty Box I", { isBurned: true }),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(deadbruvBadges, [], geocaches);

    const common = stats.badges.find((b) => b.badge.id === "common_box_breaker");
    const rare = stats.badges.find((b) => b.badge.id === "rare_box_breaker");
    expect(common).toBeDefined();
    expect(common!.count).toBe(2);
    expect(rare).toBeDefined();
    expect(rare!.count).toBe(1);
  });

  it("matches World Fucker from deadbruv to our definition (no asterisk)", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("World Fucker", 1500, "ParticipationBased"),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    const wf = stats.badges.find((b) => b.badge.id === "world_fucker");
    expect(wf).toBeDefined();
    expect(wf!.badge.name).toBe("World Fucker");
    expect(wf!.badge.points).toBe(1_500);
  });

  it("matches event badges from deadbruv correctly", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Silly Sausage", 500, "ParticipationBased"),
      makeMockDeadbruvBadge("iShit", 1000, "ParticipationBased"),
      makeMockDeadbruvBadge("YOTM", 1000, "ParticipationBased"),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    expect(stats.badges.find((b) => b.badge.id === "silly_sausage")).toBeDefined();
    expect(stats.badges.find((b) => b.badge.id === "ishit")).toBeDefined();
    expect(stats.badges.find((b) => b.badge.id === "yotm")).toBeDefined();
    expect(stats.deadPoints).toBe(500 + 1000 + 1000);
  });

  it("calculates correct tier for high-value stackable badges", () => {
    const badges: DeadbruvEarnedBadge[] = [
      makeMockDeadbruvBadge("Maskless", 7700, "IndividualNFTBased", 3),
      makeMockDeadbruvBadge("Golden Horde", 4200, "IndividualNFTBased", 5),
    ];

    const stats = calculateLoserboardStatsFromDeadbruv(badges);

    expect(stats.deadPoints).toBe(7700 * 3 + 4200 * 5);
    expect(stats.currentTier).toBe("Silver"); // 44,100 is Silver
  });
});
