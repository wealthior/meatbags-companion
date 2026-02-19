import { describe, it, expect } from "vitest";
import {
  formatSol,
  formatUsd,
  formatNumber,
  formatCompact,
  shortenAddress,
  formatPercent,
} from "@/lib/utils/format";

describe("formatSol", () => {
  it("formats zero", () => {
    expect(formatSol(0)).toBe("0 SOL");
  });

  it("formats standard amounts", () => {
    expect(formatSol(1.5)).toBe("1.50 SOL");
    expect(formatSol(100)).toBe("100.00 SOL");
  });

  it("formats small amounts with more precision", () => {
    expect(formatSol(0.005)).toBe("0.0050 SOL");
  });

  it("respects custom decimals", () => {
    expect(formatSol(1.5678, 3)).toBe("1.568 SOL");
  });
});

describe("formatUsd", () => {
  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("formats standard amounts", () => {
    expect(formatUsd(150.5)).toBe("$150.50");
  });

  it("formats large amounts with commas", () => {
    const result = formatUsd(1_234_567.89);
    expect(result).toContain("1,234,567.89");
  });
});

describe("formatNumber", () => {
  it("formats with commas", () => {
    expect(formatNumber(1_000)).toBe("1,000");
    expect(formatNumber(1_234_567)).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatCompact", () => {
  it("formats thousands", () => {
    expect(formatCompact(1_500)).toBe("1.5K");
  });

  it("formats millions", () => {
    expect(formatCompact(3_500_000)).toBe("3.5M");
  });
});

describe("shortenAddress", () => {
  it("shortens a long address", () => {
    const addr = "5v7r9kqsnn4MjiAxJtMzw6trRZKZgpgBVNF98tvYT7Hb";
    const short = shortenAddress(addr);
    expect(short).toBe("5v7r...T7Hb");
  });

  it("respects custom char count", () => {
    const addr = "5v7r9kqsnn4MjiAxJtMzw6trRZKZgpgBVNF98tvYT7Hb";
    expect(shortenAddress(addr, 6)).toBe("5v7r9k...vYT7Hb");
  });

  it("does not shorten already short strings", () => {
    expect(shortenAddress("abc")).toBe("abc");
  });
});

describe("formatPercent", () => {
  it("formats positive percentage with sign", () => {
    expect(formatPercent(5.5)).toBe("+5.5%");
  });

  it("formats negative percentage", () => {
    expect(formatPercent(-3.2)).toBe("-3.2%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});
