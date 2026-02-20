import { describe, it, expect } from "vitest";
import {
  calculateDailyYield,
  calculateNftPrepPoints,
  calculateProjections,
  calculateWalletPrepPoints,
  aggregateAcrossWallets,
} from "@/lib/domain/prep-points";
import type { MeatbagNft, MaskColor } from "@/types/nft";
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

describe("calculateDailyYield", () => {
  it("calculates Red with 1.2x multiplier", () => {
    expect(calculateDailyYield("Red", 1.2)).toBe(1_200);
  });

  it("calculates Gold with 1.1x multiplier", () => {
    expect(calculateDailyYield("Gold", 1.1)).toBe(4_620);
  });

  it("calculates Nothing with 1.0x multiplier", () => {
    expect(calculateDailyYield("Nothing", 1.0)).toBe(7_700);
  });
});

describe("calculateNftPrepPoints", () => {
  it("returns correct breakdown for a single NFT", () => {
    const nft = makeMockNft("Gold");
    const result = calculateNftPrepPoints(nft, 1.2);

    expect(result.maskColor).toBe("Gold");
    expect(result.baseYield).toBe(4_200);
    expect(result.multiplier).toBe(1.2);
    expect(result.dailyYield).toBe(5_040);
  });
});

describe("calculateProjections", () => {
  it("calculates all projections from daily total", () => {
    const proj = calculateProjections(10_000);
    expect(proj.daily).toBe(10_000);
    expect(proj.weekly).toBe(70_000);
    expect(proj.monthly).toBe(300_000);
    expect(proj.yearly).toBe(3_650_000);
  });
});

describe("calculateWalletPrepPoints", () => {
  it("aggregates prep points for a wallet's NFTs", () => {
    const nfts = [makeMockNft("Red"), makeMockNft("Red"), makeMockNft("Gold")];
    const result = calculateWalletPrepPoints(nfts, 1.0);

    expect(result.totalDaily).toBe(1_000 + 1_000 + 4_200);
    expect(result.byMaskColor["Red"].count).toBe(2);
    expect(result.byMaskColor["Red"].dailyTotal).toBe(2_000);
    expect(result.byMaskColor["Gold"].count).toBe(1);
    expect(result.byMaskColor["Gold"].dailyTotal).toBe(4_200);
  });

  it("applies multiplier correctly", () => {
    const nfts = [makeMockNft("Red"), makeMockNft("Gold")];
    const result = calculateWalletPrepPoints(nfts, 1.2);

    expect(result.totalDaily).toBe(1_200 + 5_040);
  });
});

describe("aggregateAcrossWallets", () => {
  it("combines prep points from multiple wallets", () => {
    const wallet1 = calculateWalletPrepPoints(
      [makeMockNft("Red"), makeMockNft("Gold")],
      1.0
    );
    const wallet2 = calculateWalletPrepPoints(
      [makeMockNft("Blue"), makeMockNft("Nothing")],
      1.0
    );

    const result = aggregateAcrossWallets([
      { walletAddress: "wallet1", walletName: "MAIN", points: wallet1 },
      { walletAddress: "wallet2", walletName: "Alt", points: wallet2 },
    ]);

    expect(result.totalDaily).toBe(1_000 + 4_200 + 1_225 + 7_700);
    expect(Object.keys(result.byWallet)).toHaveLength(2);
    expect(result.byMaskColor["Red"].count).toBe(1);
    expect(result.byMaskColor["Gold"].count).toBe(1);
    expect(result.byMaskColor["Blue"].count).toBe(1);
    expect(result.byMaskColor["Nothing"].count).toBe(1);
  });

  it("calculates correct projections for aggregated data", () => {
    const wallet1 = calculateWalletPrepPoints([makeMockNft("Red")], 1.0);
    const result = aggregateAcrossWallets([
      { walletAddress: "w1", walletName: "MAIN", points: wallet1 },
    ]);

    expect(result.projections.daily).toBe(1_000);
    expect(result.projections.weekly).toBe(7_000);
  });
});
