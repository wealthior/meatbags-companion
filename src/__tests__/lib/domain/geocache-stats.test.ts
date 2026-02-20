import { describe, it, expect } from "vitest";
import {
  groupByTier,
  groupBySeries,
  calculateGeocachePnl,
  extractBurnRecords,
  calculateGeocacheStats,
} from "@/lib/domain/geocache-stats";
import type { GeocacheNft, GeocacheTier, GeocacheSeries } from "@/types/geocache";
import type { NftTransaction, TransactionType } from "@/types/transaction";

const makeMockGeocache = (
  tier: GeocacheTier = "Common",
  series: GeocacheSeries = "Bounty Box I",
  overrides?: Partial<GeocacheNft>,
): GeocacheNft => ({
  mintAddress: `mock-gc-${Math.random()}`,
  name: `GeoCaches #${Math.floor(Math.random() * 1000)}`,
  imageUrl: "",
  ownerWallet: "wallet1",
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

const makeMockTx = (
  type: TransactionType,
  solAmount: number,
  fromWallet: string,
  toWallet: string,
  overrides?: Partial<NftTransaction>,
): NftTransaction => ({
  signature: `sig-${Math.random()}`,
  type,
  mintAddress: `mint-${Math.random()}`,
  nftName: "GeoCaches #1",
  solAmount,
  solPriceUsd: 0,
  usdAmount: 0,
  timestamp: Date.now() / 1000,
  fromWallet,
  toWallet,
  marketplace: "Magic Eden",
  ...overrides,
});

describe("groupByTier", () => {
  it("groups geocaches by tier correctly", () => {
    const geocaches = [
      makeMockGeocache("Common"),
      makeMockGeocache("Rare"),
      makeMockGeocache("Common"),
      makeMockGeocache("Rare"),
      makeMockGeocache("Rare"),
    ];

    const result = groupByTier(geocaches);
    expect(result.Common).toHaveLength(2);
    expect(result.Rare).toHaveLength(3);
  });

  it("returns empty arrays when no geocaches", () => {
    const result = groupByTier([]);
    expect(result.Common).toHaveLength(0);
    expect(result.Rare).toHaveLength(0);
  });
});

describe("groupBySeries", () => {
  it("groups geocaches by series correctly", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I"),
      makeMockGeocache("Common", "Bounty Box II"),
      makeMockGeocache("Rare", "Shit Box"),
      makeMockGeocache("Common", "Bounty Box I"),
    ];

    const result = groupBySeries(geocaches);
    expect(result["Bounty Box I"]).toHaveLength(2);
    expect(result["Bounty Box II"]).toHaveLength(1);
    expect(result["Shit Box"]).toHaveLength(1);
  });

  it("groups special series geocaches correctly", () => {
    const geocaches = [
      makeMockGeocache("Common", "Halloween"),
      makeMockGeocache("Rare", "Merry Crisis"),
      makeMockGeocache("Common", "Halloween"),
    ];

    const result = groupBySeries(geocaches);
    expect(result["Halloween"]).toHaveLength(2);
    expect(result["Merry Crisis"]).toHaveLength(1);
  });

  it("returns empty arrays when no geocaches", () => {
    const result = groupBySeries([]);
    expect(result["Bounty Box I"]).toHaveLength(0);
    expect(result["Bounty Box II"]).toHaveLength(0);
    expect(result["Shit Box"]).toHaveLength(0);
    expect(result["Halloween"]).toHaveLength(0);
    expect(result["Merry Crisis"]).toHaveLength(0);
  });
});

describe("calculateGeocachePnl", () => {
  const tracked = new Set(["wallet1"]);

  it("calculates buys correctly", () => {
    const txs = [
      makeMockTx("BUY", 0.5, "seller1", "wallet1"),
      makeMockTx("BUY", 1.2, "seller2", "wallet1"),
    ];

    const result = calculateGeocachePnl(txs, tracked);
    expect(result.totalSpentSol).toBeCloseTo(1.7);
    expect(result.buyCount).toBe(2);
    expect(result.totalEarnedSol).toBe(0);
    expect(result.sellCount).toBe(0);
  });

  it("calculates sells correctly", () => {
    const txs = [
      makeMockTx("SELL", 2.0, "wallet1", "buyer1"),
    ];

    const result = calculateGeocachePnl(txs, tracked);
    expect(result.totalEarnedSol).toBeCloseTo(2.0);
    expect(result.sellCount).toBe(1);
    expect(result.totalSpentSol).toBe(0);
  });

  it("calculates net P&L correctly", () => {
    const txs = [
      makeMockTx("BUY", 1.0, "seller1", "wallet1"),
      makeMockTx("SELL", 3.0, "wallet1", "buyer1"),
    ];

    const result = calculateGeocachePnl(txs, tracked);
    expect(result.netPnlSol).toBeCloseTo(2.0);
  });

  it("ignores non-trade transactions", () => {
    const txs = [
      makeMockTx("TRANSFER", 0, "wallet1", "wallet2"),
      makeMockTx("BURN", 0, "wallet1", ""),
      makeMockTx("MINT", 0, "", "wallet1"),
    ];

    const result = calculateGeocachePnl(txs, tracked);
    expect(result.buyCount).toBe(0);
    expect(result.sellCount).toBe(0);
    expect(result.totalSpentSol).toBe(0);
    expect(result.totalEarnedSol).toBe(0);
  });

  it("returns zeros for empty transactions", () => {
    const result = calculateGeocachePnl([], tracked);
    expect(result.totalSpentSol).toBe(0);
    expect(result.totalEarnedSol).toBe(0);
    expect(result.netPnlSol).toBe(0);
    expect(result.buyCount).toBe(0);
    expect(result.sellCount).toBe(0);
  });
});

describe("extractBurnRecords", () => {
  const tracked = new Set(["wallet1"]);

  it("extracts burn records for tracked wallets", () => {
    const txs = [
      makeMockTx("BURN", 0, "wallet1", "", { mintAddress: "mint1", signature: "sig1" }),
      makeMockTx("BURN", 0, "wallet2", "", { mintAddress: "mint2", signature: "sig2" }),
      makeMockTx("BUY", 1.0, "seller", "wallet1"),
    ];

    const result = extractBurnRecords(txs, tracked);
    expect(result).toHaveLength(1);
    expect(result[0].mintAddress).toBe("mint1");
    expect(result[0].signature).toBe("sig1");
  });

  it("returns empty array when no burns", () => {
    const txs = [
      makeMockTx("BUY", 1.0, "seller", "wallet1"),
    ];

    const result = extractBurnRecords(txs, tracked);
    expect(result).toHaveLength(0);
  });
});

describe("calculateGeocacheStats", () => {
  const tracked = new Set(["wallet1"]);

  it("calculates comprehensive stats with held and burned geocaches", () => {
    // Mix of held and burned geocaches (Helius returns both with isBurned flag)
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isListed: true }),
      makeMockGeocache("Rare", "Bounty Box II"),
      makeMockGeocache("Common", "Shit Box"),
      makeMockGeocache("Rare", "Bounty Box I", { isBurned: true }),
    ];

    const txs = [
      makeMockTx("BUY", 0.5, "seller1", "wallet1"),
      makeMockTx("SELL", 1.0, "wallet1", "buyer1"),
    ];

    const result = calculateGeocacheStats(geocaches, txs, tracked);

    // 3 held (not burned), 1 burned
    expect(result.totalHeld).toBe(3);
    expect(result.totalBurned).toBe(1);
    expect(result.totalListed).toBe(1);
    expect(result.totalBought).toBe(1);
    expect(result.totalSold).toBe(1);
    // byTier/bySeries only count HELD geocaches
    expect(result.byTier.Common).toBe(2);
    expect(result.byTier.Rare).toBe(1);
    expect(result.bySeries["Bounty Box I"]).toBe(1);
    expect(result.bySeries["Bounty Box II"]).toBe(1);
    expect(result.bySeries["Shit Box"]).toBe(1);
    // burnedByTier/burnedBySeries count BURNED geocaches
    expect(result.burnedByTier.Common).toBe(0);
    expect(result.burnedByTier.Rare).toBe(1);
    expect(result.burnedBySeries["Bounty Box I"]).toBe(1);
    expect(result.burnedBySeries["Bounty Box II"]).toBe(0);
    expect(result.burnedBySeries["Shit Box"]).toBe(0);
    expect(result.totalSpentSol).toBeCloseTo(0.5);
    expect(result.totalEarnedSol).toBeCloseTo(1.0);
    expect(result.netPnlSol).toBeCloseTo(0.5);
    expect(result.tradeCount).toBe(2);
  });

  it("handles empty data gracefully", () => {
    const result = calculateGeocacheStats([], [], tracked);

    expect(result.totalHeld).toBe(0);
    expect(result.totalBurned).toBe(0);
    expect(result.totalBought).toBe(0);
    expect(result.totalSold).toBe(0);
    expect(result.totalListed).toBe(0);
    expect(result.byTier.Common).toBe(0);
    expect(result.byTier.Rare).toBe(0);
    expect(result.bySeries["Bounty Box I"]).toBe(0);
    expect(result.bySeries["Bounty Box II"]).toBe(0);
    expect(result.bySeries["Shit Box"]).toBe(0);
    expect(result.bySeries["Halloween"]).toBe(0);
    expect(result.bySeries["Merry Crisis"]).toBe(0);
    expect(result.burnedByTier.Common).toBe(0);
    expect(result.burnedByTier.Rare).toBe(0);
    expect(result.burnedBySeries["Bounty Box I"]).toBe(0);
    expect(result.burnedBySeries["Bounty Box II"]).toBe(0);
    expect(result.burnedBySeries["Shit Box"]).toBe(0);
    expect(result.burnedBySeries["Halloween"]).toBe(0);
    expect(result.burnedBySeries["Merry Crisis"]).toBe(0);
    expect(result.netPnlSol).toBe(0);
    expect(result.tradeCount).toBe(0);
  });

  it("handles all burned scenario (via isBurned flag)", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isBurned: true }),
      makeMockGeocache("Rare", "Bounty Box II", { isBurned: true }),
      makeMockGeocache("Common", "Shit Box", { isBurned: true }),
    ];

    const result = calculateGeocacheStats(geocaches, [], tracked);
    expect(result.totalHeld).toBe(0);
    expect(result.totalBurned).toBe(3);
    // byTier/bySeries should be 0 since all are burned
    expect(result.byTier.Common).toBe(0);
    expect(result.byTier.Rare).toBe(0);
    // burnedByTier/burnedBySeries should reflect burned traits
    expect(result.burnedByTier.Common).toBe(2);
    expect(result.burnedByTier.Rare).toBe(1);
    expect(result.burnedBySeries["Bounty Box I"]).toBe(1);
    expect(result.burnedBySeries["Bounty Box II"]).toBe(1);
    expect(result.burnedBySeries["Shit Box"]).toBe(1);
  });

  it("handles all listed scenario", () => {
    const geocaches = [
      makeMockGeocache("Common", "Bounty Box I", { isListed: true }),
      makeMockGeocache("Rare", "Bounty Box II", { isListed: true }),
    ];

    const result = calculateGeocacheStats(geocaches, [], tracked);
    expect(result.totalHeld).toBe(2);
    expect(result.totalListed).toBe(2);
  });
});
