import type { WalletInteraction, PositionedBubble } from "@/types/wallet-interactions";

interface PackingOptions {
  readonly width: number;
  readonly height: number;
  readonly minRadius: number;
  readonly maxRadius: number;
  readonly padding: number;
  readonly maxBubbles: number;
}

const DEFAULT_OPTIONS: PackingOptions = {
  width: 600,
  height: 500,
  minRadius: 16,
  maxRadius: 80,
  padding: 4,
  maxBubbles: 50,
};

/**
 * Map transaction count to pixel radius using sqrt scaling.
 * Area is proportional to value (perceptually correct).
 */
export const scaleRadius = (
  value: number,
  minValue: number,
  maxValue: number,
  minRadius: number,
  maxRadius: number
): number => {
  if (maxValue === minValue) return (minRadius + maxRadius) / 2;
  const normalized = (value - minValue) / (maxValue - minValue);
  return minRadius + Math.sqrt(normalized) * (maxRadius - minRadius);
};

/**
 * Check if two circles overlap (including padding).
 */
const circlesOverlap = (
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  padding: number
): boolean => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < r1 + r2 + padding;
};

/**
 * Check if a circle is within container bounds.
 */
const withinBounds = (
  x: number,
  y: number,
  r: number,
  width: number,
  height: number
): boolean => x - r >= 0 && x + r <= width && y - r >= 0 && y + r <= height;

/**
 * Pack circles using spiral placement from center.
 *
 * Strategy:
 * 1. Sort by radius descending (largest first for best packing)
 * 2. Place first bubble at center
 * 3. For each subsequent bubble, spiral outward checking collisions
 *
 * O(n²) worst case but <5ms for maxBubbles=50.
 */
export const packCircles = (
  interactions: readonly WalletInteraction[],
  options: Partial<PackingOptions> = {}
): PositionedBubble[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const capped = interactions.slice(0, opts.maxBubbles);

  if (capped.length === 0) return [];

  const counts = capped.map((i) => i.transactionCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // Assign radii
  const withRadius = capped.map((interaction) => ({
    interaction,
    radius: scaleRadius(
      interaction.transactionCount,
      minCount,
      maxCount,
      opts.minRadius,
      opts.maxRadius
    ),
  }));

  // Sort largest first
  withRadius.sort((a, b) => b.radius - a.radius);

  const placed: PositionedBubble[] = [];
  const cx = opts.width / 2;
  const cy = opts.height / 2;

  for (const { interaction, radius } of withRadius) {
    // Deterministic start angle based on index (golden angle ~137.5°)
    const startAngle = placed.length * 2.399;
    let found = false;
    let bestX = cx;
    let bestY = cy;

    // Spiral outward: each step advances angle by ~0.5 rad and grows radius by ~1px
    const maxAttempts = 2000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = startAngle + attempt * 0.5;
      const spiralR = attempt * 1.0; // 1 pixel per step outward
      const testX = cx + spiralR * Math.cos(angle);
      const testY = cy + spiralR * Math.sin(angle);

      // Check bounds
      if (!withinBounds(testX, testY, radius, opts.width, opts.height)) {
        continue;
      }

      // Check collisions
      let collides = false;
      for (const other of placed) {
        if (circlesOverlap(testX, testY, radius, other.x, other.y, other.radius, opts.padding)) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        bestX = testX;
        bestY = testY;
        found = true;
        break;
      }
    }

    // Fallback: if no collision-free spot found, place at edge
    if (!found) {
      const fallbackAngle = startAngle;
      const fallbackR = Math.min(opts.width, opts.height) * 0.4;
      bestX = Math.max(radius, Math.min(opts.width - radius, cx + fallbackR * Math.cos(fallbackAngle)));
      bestY = Math.max(radius, Math.min(opts.height - radius, cy + fallbackR * Math.sin(fallbackAngle)));
    }

    placed.push({
      ...interaction,
      x: bestX,
      y: bestY,
      radius,
    });
  }

  return placed;
};
