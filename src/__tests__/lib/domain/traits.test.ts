import { describe, it, expect } from "vitest";
import {
  getMaskColorConfig,
  getBaseYield,
  getDailyYield,
  getMaskColorFromTraits,
  getMaskHexColor,
  groupByMaskColor,
  sortByYield,
  isHonoraryNft,
  isSoulboundNft,
  extractNftNumber,
} from "@/lib/domain/traits";
import type { MaskColor, NftTrait, MeatbagNft } from "@/types/nft";

describe("getMaskColorConfig", () => {
  it("returns correct config for Red", () => {
    const config = getMaskColorConfig("Red");
    expect(config.dailyYield).toBe(1_000);
    expect(config.rarity).toBe("Common");
  });

  it("returns correct config for Gold", () => {
    const config = getMaskColorConfig("Gold");
    expect(config.dailyYield).toBe(4_200);
    expect(config.rarity).toBe("Legendary");
  });

  it("returns correct config for 1/1", () => {
    const config = getMaskColorConfig("1/1");
    expect(config.dailyYield).toBe(7_000);
    expect(config.rarity).toBe("Mythic");
  });

  it("returns correct config for Nothing", () => {
    const config = getMaskColorConfig("Nothing");
    expect(config.dailyYield).toBe(7_700);
    expect(config.rarity).toBe("Mythic");
  });
});

describe("getBaseYield", () => {
  it.each<[MaskColor, number]>([
    ["Red", 1_000],
    ["Purple", 1_025],
    ["Orange", 1_050],
    ["Brown", 1_400],
    ["Gold", 4_200],
    ["1/1", 7_000],
    ["Nothing", 7_700],
  ])("returns %d for %s mask", (color, expected) => {
    expect(getBaseYield(color)).toBe(expected);
  });
});

describe("getDailyYield", () => {
  it("applies 1.2x multiplier for presale", () => {
    expect(getDailyYield("Red", 1.2)).toBe(1_200);
    expect(getDailyYield("Gold", 1.2)).toBe(5_040);
  });

  it("applies 1.1x multiplier for public mint", () => {
    expect(getDailyYield("Red", 1.1)).toBe(1_100);
    expect(getDailyYield("Gold", 1.1)).toBe(4_620);
  });

  it("applies 1.0x multiplier for secondary", () => {
    expect(getDailyYield("Red", 1.0)).toBe(1_000);
    expect(getDailyYield("Gold", 1.0)).toBe(4_200);
  });
});

describe("getMaskColorFromTraits", () => {
  it("extracts mask color from Mask trait", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "Red" }];
    expect(getMaskColorFromTraits(traits)).toBe("Red");
  });

  it("extracts mask color from Mask Color trait", () => {
    const traits: NftTrait[] = [{ traitType: "Mask Color", value: "Gold" }];
    expect(getMaskColorFromTraits(traits)).toBe("Gold");
  });

  it("handles case-insensitive matching", () => {
    const traits: NftTrait[] = [{ traitType: "mask", value: "light blue" }];
    expect(getMaskColorFromTraits(traits)).toBe("Light Blue");
  });

  it("handles hyphenated values from Helius DAS API", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "Light-Blue" }];
    expect(getMaskColorFromTraits(traits)).toBe("Light Blue");
  });

  it("handles hyphenated case-insensitive values", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "light-blue" }];
    expect(getMaskColorFromTraits(traits)).toBe("Light Blue");
  });

  it("returns Nothing for no mask trait", () => {
    const traits: NftTrait[] = [{ traitType: "Background", value: "Red" }];
    expect(getMaskColorFromTraits(traits)).toBe("Nothing");
  });

  it("returns Nothing for None/No Mask values", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "None" }];
    expect(getMaskColorFromTraits(traits)).toBe("Nothing");
  });

  it("recognizes 1/1 patterns", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "1/1 Custom" }];
    expect(getMaskColorFromTraits(traits)).toBe("1/1");
  });

  it("recognizes GH-Gold mask color", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "GH-Gold" }];
    expect(getMaskColorFromTraits(traits)).toBe("GH-Gold");
  });

  it("recognizes 1/1 Toxic T-Bone as 1/1", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "1/1 Toxic T-Bone" }];
    expect(getMaskColorFromTraits(traits)).toBe("1/1");
  });
});

describe("getMaskHexColor", () => {
  it("returns hex color for Red", () => {
    expect(getMaskHexColor("Red")).toBe("#e53e3e");
  });

  it("returns hex color for Gold", () => {
    expect(getMaskHexColor("Gold")).toBe("#ffd700");
  });
});

describe("extractNftNumber", () => {
  it("extracts number from standard name", () => {
    expect(extractNftNumber("MEATBAG #176")).toBe(176);
  });

  it("extracts number from lowercase name", () => {
    expect(extractNftNumber("Meatbags #9649")).toBe(9649);
  });

  it("extracts number above 10000", () => {
    expect(extractNftNumber("MEATBAG #10013")).toBe(10013);
  });

  it("returns null for name without number", () => {
    expect(extractNftNumber("Unknown MeatBag")).toBeNull();
  });
});

describe("isHonoraryNft", () => {
  it("returns true for NFT number > 10000", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "1/1 Toxic T-Bone" }];
    expect(isHonoraryNft("MEATBAG #10013", traits)).toBe(true);
  });

  it("returns true for 1/1 mask even with low number", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "1/1 Custom" }];
    expect(isHonoraryNft("MEATBAG #500", traits)).toBe(true);
  });

  it("returns true for honorary type trait", () => {
    const traits: NftTrait[] = [
      { traitType: "Mask", value: "Red" },
      { traitType: "Type", value: "Honorary" },
    ];
    expect(isHonoraryNft("MEATBAG #500", traits)).toBe(true);
  });

  it("returns false for regular NFT under 10000", () => {
    const traits: NftTrait[] = [{ traitType: "Mask", value: "Red" }];
    expect(isHonoraryNft("MEATBAG #176", traits)).toBe(false);
  });
});

describe("isSoulboundNft", () => {
  it("returns true for NFT number > 10000", () => {
    expect(isSoulboundNft("MEATBAG #10013")).toBe(true);
  });

  it("returns false for NFT number < 10000", () => {
    expect(isSoulboundNft("MEATBAG #176")).toBe(false);
  });

  it("returns false for NFT number exactly 10000", () => {
    expect(isSoulboundNft("Meatbags #10000")).toBe(false);
  });

  it("returns false for name without number", () => {
    expect(isSoulboundNft("Unknown MeatBag")).toBe(false);
  });
});

const makeMockNft = (maskColor: MaskColor, mintAddress?: string): MeatbagNft => ({
  mintAddress: mintAddress ?? `mock-${maskColor}-${Math.random()}`,
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

describe("groupByMaskColor", () => {
  it("groups NFTs by mask color", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Red"),
      makeMockNft("Gold"),
    ];
    const groups = groupByMaskColor(nfts);
    expect(groups["Red"]).toHaveLength(2);
    expect(groups["Gold"]).toHaveLength(1);
    expect(groups["Blue"]).toHaveLength(0);
  });
});

describe("sortByYield", () => {
  it("sorts descending by default", () => {
    const nfts = [
      makeMockNft("Red"),
      makeMockNft("Gold"),
      makeMockNft("Blue"),
    ];
    const sorted = sortByYield(nfts);
    expect(sorted[0].maskColor).toBe("Gold");
    expect(sorted[sorted.length - 1].maskColor).toBe("Red");
  });

  it("sorts ascending when requested", () => {
    const nfts = [
      makeMockNft("Gold"),
      makeMockNft("Red"),
    ];
    const sorted = sortByYield(nfts, true);
    expect(sorted[0].maskColor).toBe("Red");
    expect(sorted[1].maskColor).toBe("Gold");
  });
});
