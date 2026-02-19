import { describe, it, expect } from "vitest";
import { scaleRadius, packCircles } from "@/lib/domain/circle-packing";
import type { WalletInteraction } from "@/types/wallet-interactions";

const interaction = (
  overrides: Partial<WalletInteraction> = {}
): WalletInteraction => ({
  counterpartyAddress: `addr-${Math.random().toString(36).slice(2, 8)}`,
  transactionCount: 5,
  totalSolVolume: 10,
  buyCount: 3,
  sellCount: 2,
  transferCount: 0,
  direction: "MIXED",
  firstInteraction: 1700000000,
  lastInteraction: 1700100000,
  isOwnWallet: false,
  ...overrides,
});

describe("scaleRadius", () => {
  it("returns midpoint when min equals max", () => {
    expect(scaleRadius(5, 5, 5, 16, 80)).toBe(48);
  });

  it("returns minRadius for minimum value", () => {
    expect(scaleRadius(1, 1, 100, 16, 80)).toBe(16);
  });

  it("returns maxRadius for maximum value", () => {
    expect(scaleRadius(100, 1, 100, 16, 80)).toBe(80);
  });

  it("uses sqrt scaling (area proportional)", () => {
    // At 25% of range, sqrt(0.25)=0.5, so radius should be midpoint
    const r = scaleRadius(25.75, 1, 100, 16, 80);
    expect(r).toBeCloseTo(48, 0);
  });
});

describe("packCircles", () => {
  it("returns empty array for no interactions", () => {
    expect(packCircles([])).toEqual([]);
  });

  it("places single bubble near center", () => {
    const result = packCircles([interaction({ transactionCount: 10 })], {
      width: 400,
      height: 400,
    });
    expect(result).toHaveLength(1);
    // Should be at center since it's the only bubble
    expect(result[0].x).toBeCloseTo(200, -1);
    expect(result[0].y).toBeCloseTo(200, -1);
  });

  it("places multiple bubbles without overlap", () => {
    // Use well-varied sizes (1 to 50) with large container and small bubbles
    const interactions = [
      interaction({ transactionCount: 50 }),
      interaction({ transactionCount: 30 }),
      interaction({ transactionCount: 15 }),
      interaction({ transactionCount: 5 }),
      interaction({ transactionCount: 1 }),
    ];
    const result = packCircles(interactions, {
      width: 800,
      height: 800,
      minRadius: 10,
      maxRadius: 50,
    });

    expect(result).toHaveLength(5);

    // Verify all pairs have no overlap
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[i].x - result[j].x;
        const dy = result[i].y - result[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = result[i].radius + result[j].radius;
        expect(dist).toBeGreaterThanOrEqual(minDist - 2);
      }
    }
  });

  it("respects container bounds", () => {
    const interactions = Array.from({ length: 5 }, () =>
      interaction({ transactionCount: 5 })
    );
    const width = 400;
    const height = 300;
    const result = packCircles(interactions, { width, height });

    for (const bubble of result) {
      expect(bubble.x - bubble.radius).toBeGreaterThanOrEqual(-1);
      expect(bubble.x + bubble.radius).toBeLessThanOrEqual(width + 1);
      expect(bubble.y - bubble.radius).toBeGreaterThanOrEqual(-1);
      expect(bubble.y + bubble.radius).toBeLessThanOrEqual(height + 1);
    }
  });

  it("caps at maxBubbles", () => {
    const interactions = Array.from({ length: 100 }, () =>
      interaction({ transactionCount: 3 })
    );
    const result = packCircles(interactions, { maxBubbles: 20 });
    expect(result).toHaveLength(20);
  });

  it("assigns larger radius to higher transaction counts", () => {
    const interactions = [
      interaction({ transactionCount: 100 }),
      interaction({ transactionCount: 1 }),
    ];
    const result = packCircles(interactions, {
      width: 600,
      height: 600,
    });

    // Find the bubble with 100 txns vs 1 txn
    const big = result.find((b) => b.transactionCount === 100);
    const small = result.find((b) => b.transactionCount === 1);
    expect(big).toBeDefined();
    expect(small).toBeDefined();
    expect(big!.radius).toBeGreaterThan(small!.radius);
  });

  it("preserves interaction data in positioned bubbles", () => {
    const original = interaction({
      counterpartyAddress: "test-addr",
      transactionCount: 42,
      totalSolVolume: 100,
      direction: "BUYER",
    });
    const result = packCircles([original]);
    expect(result[0].counterpartyAddress).toBe("test-addr");
    expect(result[0].transactionCount).toBe(42);
    expect(result[0].totalSolVolume).toBe(100);
    expect(result[0].direction).toBe("BUYER");
    expect(result[0].x).toBeDefined();
    expect(result[0].y).toBeDefined();
    expect(result[0].radius).toBeDefined();
  });
});
