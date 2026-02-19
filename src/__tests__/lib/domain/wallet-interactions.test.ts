import { describe, it, expect } from "vitest";
import {
  categorizeDirection,
  aggregateInteractions,
  calculateDiversityScore,
  buildInteractionsSummary,
} from "@/lib/domain/wallet-interactions";
import type { NftTransaction } from "@/types/transaction";

const tx = (
  overrides: Partial<NftTransaction> = {}
): NftTransaction => ({
  signature: `sig-${Math.random().toString(36).slice(2, 8)}`,
  type: "BUY",
  mintAddress: "mint1",
  nftName: "MEATBAG #1",
  solAmount: 1.5,
  solPriceUsd: 80,
  usdAmount: 120,
  timestamp: 1700000000,
  fromWallet: "external1",
  toWallet: "myWallet1",
  marketplace: "MagicEden",
  ...overrides,
});

describe("categorizeDirection", () => {
  it("returns BUYER when buy ratio >= 0.7", () => {
    expect(categorizeDirection(7, 3)).toBe("BUYER");
    expect(categorizeDirection(8, 2)).toBe("BUYER");
    expect(categorizeDirection(10, 0)).toBe("BUYER");
  });

  it("returns SELLER when sell ratio >= 0.7", () => {
    expect(categorizeDirection(3, 7)).toBe("SELLER");
    expect(categorizeDirection(0, 10)).toBe("SELLER");
  });

  it("returns MIXED when balanced", () => {
    expect(categorizeDirection(5, 5)).toBe("MIXED");
    expect(categorizeDirection(4, 6)).toBe("MIXED");
    expect(categorizeDirection(6, 4)).toBe("MIXED");
  });

  it("returns MIXED when both are zero", () => {
    expect(categorizeDirection(0, 0)).toBe("MIXED");
  });
});

describe("aggregateInteractions", () => {
  const tracked = new Set(["myWallet1", "myWallet2"]);

  it("groups transactions by counterparty", () => {
    const txns = [
      tx({ fromWallet: "ext1", toWallet: "myWallet1" }),
      tx({ fromWallet: "ext1", toWallet: "myWallet1" }),
      tx({ fromWallet: "ext2", toWallet: "myWallet1" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result).toHaveLength(2);
    expect(result[0].counterpartyAddress).toBe("ext1");
    expect(result[0].transactionCount).toBe(2);
    expect(result[1].counterpartyAddress).toBe("ext2");
    expect(result[1].transactionCount).toBe(1);
  });

  it("identifies counterparty when user is seller", () => {
    const txns = [
      tx({ type: "SELL", fromWallet: "myWallet1", toWallet: "buyer1" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].counterpartyAddress).toBe("buyer1");
    expect(result[0].sellCount).toBe(1);
    expect(result[0].buyCount).toBe(0);
  });

  it("identifies counterparty when user is buyer", () => {
    const txns = [
      tx({ type: "BUY", fromWallet: "seller1", toWallet: "myWallet1" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].counterpartyAddress).toBe("seller1");
    expect(result[0].buyCount).toBe(1);
    expect(result[0].sellCount).toBe(0);
  });

  it("flags own-wallet interactions", () => {
    const txns = [
      tx({ type: "TRANSFER", fromWallet: "myWallet1", toWallet: "myWallet2" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].isOwnWallet).toBe(true);
    expect(result[0].counterpartyAddress).toBe("myWallet2");
  });

  it("returns empty array for no transactions", () => {
    expect(aggregateInteractions([], tracked)).toEqual([]);
  });

  it("accumulates SOL volume correctly", () => {
    const txns = [
      tx({ fromWallet: "ext1", toWallet: "myWallet1", solAmount: 2.5 }),
      tx({ fromWallet: "ext1", toWallet: "myWallet1", solAmount: 3.0 }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].totalSolVolume).toBeCloseTo(5.5);
  });

  it("sorts by transaction count descending", () => {
    const txns = [
      tx({ fromWallet: "few", toWallet: "myWallet1" }),
      tx({ fromWallet: "many", toWallet: "myWallet1" }),
      tx({ fromWallet: "many", toWallet: "myWallet1" }),
      tx({ fromWallet: "many", toWallet: "myWallet1" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].counterpartyAddress).toBe("many");
    expect(result[0].transactionCount).toBe(3);
    expect(result[1].counterpartyAddress).toBe("few");
    expect(result[1].transactionCount).toBe(1);
  });

  it("counts transfers separately", () => {
    const txns = [
      tx({ type: "TRANSFER", fromWallet: "myWallet1", toWallet: "ext1" }),
      tx({ type: "BUY", fromWallet: "ext1", toWallet: "myWallet1" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].transferCount).toBe(1);
    expect(result[0].buyCount).toBe(1);
    expect(result[0].sellCount).toBe(0);
  });

  it("tracks first and last interaction timestamps", () => {
    const txns = [
      tx({ fromWallet: "ext1", toWallet: "myWallet1", timestamp: 1000 }),
      tx({ fromWallet: "ext1", toWallet: "myWallet1", timestamp: 3000 }),
      tx({ fromWallet: "ext1", toWallet: "myWallet1", timestamp: 2000 }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result[0].firstInteraction).toBe(1000);
    expect(result[0].lastInteraction).toBe(3000);
  });

  it("skips transactions where neither wallet is tracked", () => {
    const txns = [
      tx({ fromWallet: "unknown1", toWallet: "unknown2" }),
    ];
    const result = aggregateInteractions(txns, tracked);
    expect(result).toHaveLength(0);
  });
});

describe("calculateDiversityScore", () => {
  it("returns 0 for single counterparty", () => {
    const interactions = [
      { counterpartyAddress: "a", transactionCount: 10 },
    ] as any;
    expect(calculateDiversityScore(interactions)).toBe(0);
  });

  it("returns 100 for perfectly even distribution", () => {
    const interactions = [
      { counterpartyAddress: "a", transactionCount: 5 },
      { counterpartyAddress: "b", transactionCount: 5 },
      { counterpartyAddress: "c", transactionCount: 5 },
      { counterpartyAddress: "d", transactionCount: 5 },
    ] as any;
    expect(calculateDiversityScore(interactions)).toBe(100);
  });

  it("returns low score for concentrated interactions", () => {
    const interactions = [
      { counterpartyAddress: "a", transactionCount: 100 },
      { counterpartyAddress: "b", transactionCount: 1 },
      { counterpartyAddress: "c", transactionCount: 1 },
    ] as any;
    const score = calculateDiversityScore(interactions);
    expect(score).toBeLessThan(30);
  });

  it("returns 0 for empty interactions", () => {
    expect(calculateDiversityScore([])).toBe(0);
  });
});

describe("buildInteractionsSummary", () => {
  it("computes all summary fields correctly", () => {
    const txns = [
      tx({ fromWallet: "ext1", toWallet: "myWallet1", solAmount: 2 }),
      tx({ fromWallet: "ext1", toWallet: "myWallet1", solAmount: 3 }),
      tx({ fromWallet: "ext2", toWallet: "myWallet1", solAmount: 1 }),
    ];
    const interactions = aggregateInteractions(txns, new Set(["myWallet1"]));
    const summary = buildInteractionsSummary(interactions);

    expect(summary.totalCounterparties).toBe(2);
    expect(summary.totalTransactions).toBe(3);
    expect(summary.totalSolVolume).toBeCloseTo(6);
    expect(summary.topCounterparty?.counterpartyAddress).toBe("ext1");
    expect(summary.diversityScore).toBeGreaterThan(0);
  });

  it("returns null topCounterparty for empty interactions", () => {
    const summary = buildInteractionsSummary([]);
    expect(summary.topCounterparty).toBeNull();
    expect(summary.totalCounterparties).toBe(0);
  });
});
