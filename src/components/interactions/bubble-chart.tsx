"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PositionedBubble } from "@/types/wallet-interactions";
import { BubbleTooltip } from "./bubble-tooltip";
import { shortenAddress } from "@/lib/utils/format";

interface BubbleChartProps {
  bubbles: PositionedBubble[];
  onBubbleClick?: (bubble: PositionedBubble) => void;
  selectedAddress?: string | null;
  containerWidth: number;
  containerHeight: number;
}

const DIRECTION_COLORS: Record<string, string> = {
  BUYER: "#39ff14",   // neon-green
  SELLER: "#8b0000",  // blood
  MIXED: "#9b30ff",   // toxic-purple
};

const DIRECTION_FILL_OPACITY: Record<string, number> = {
  BUYER: 0.15,
  SELLER: 0.2,
  MIXED: 0.15,
};

export function BubbleChart({
  bubbles,
  onBubbleClick,
  selectedAddress,
  containerWidth,
  containerHeight,
}: BubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<PositionedBubble | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = useCallback(
    (bubble: PositionedBubble, event: React.MouseEvent) => {
      setHoveredBubble(bubble);
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (hoveredBubble) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      }
    },
    [hoveredBubble]
  );

  if (bubbles.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: containerWidth, height: containerHeight }}
      >
        <p className="text-text-muted text-sm">
          No interactions detected in the wasteland.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: containerWidth, height: containerHeight }}>
      <svg
        ref={svgRef}
        width={containerWidth}
        height={containerHeight}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredBubble(null)}
      >
        {/* Glow filters */}
        <defs>
          <filter id="glow-green-svg" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#39ff14" floodOpacity="0.5" />
          </filter>
          <filter id="glow-red-svg" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b0000" floodOpacity="0.5" />
          </filter>
          <filter id="glow-purple-svg" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#9b30ff" floodOpacity="0.5" />
          </filter>
          <filter id="glow-gold-svg" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffd700" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Bubbles */}
        {bubbles.map((bubble, index) => {
          const color = DIRECTION_COLORS[bubble.direction] ?? DIRECTION_COLORS.MIXED;
          const fillOpacity = DIRECTION_FILL_OPACITY[bubble.direction] ?? 0.15;
          const isHovered = hoveredBubble?.counterpartyAddress === bubble.counterpartyAddress;
          const isSelected = selectedAddress === bubble.counterpartyAddress;
          const isOwn = bubble.isOwnWallet;

          const glowFilter = isOwn
            ? "url(#glow-gold-svg)"
            : bubble.direction === "BUYER"
              ? "url(#glow-green-svg)"
              : bubble.direction === "SELLER"
                ? "url(#glow-red-svg)"
                : "url(#glow-purple-svg)";

          return (
            <motion.g
              key={bubble.counterpartyAddress}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isHovered ? 1.08 : isSelected ? 1.05 : 1,
              }}
              transition={{
                opacity: { delay: index * 0.02, duration: 0.4 },
                scale: { type: "spring", stiffness: 300, damping: 20 },
              }}
              style={{ transformOrigin: `${bubble.x}px ${bubble.y}px` }}
              onMouseEnter={(e) => handleMouseEnter(bubble, e as unknown as React.MouseEvent)}
              onMouseLeave={() => setHoveredBubble(null)}
              onClick={() => onBubbleClick?.(bubble)}
              className="cursor-pointer"
            >
              {/* Main circle */}
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.radius}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={isOwn ? "#ffd700" : color}
                strokeWidth={isOwn ? 2 : 1}
                strokeOpacity={isHovered || isSelected ? 0.9 : 0.4}
                filter={(isHovered || isSelected) ? glowFilter : undefined}
              />

              {/* Label — only on larger bubbles */}
              {bubble.radius > 28 && (
                <text
                  x={bubble.x}
                  y={bubble.y - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-text-primary text-[9px] font-mono pointer-events-none select-none"
                  opacity={0.8}
                >
                  {shortenAddress(bubble.counterpartyAddress, 4)}
                </text>
              )}

              {/* Transaction count below address */}
              {bubble.radius > 22 && (
                <text
                  x={bubble.x}
                  y={bubble.y + (bubble.radius > 28 ? 8 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px] font-mono pointer-events-none select-none"
                  fill={color}
                  opacity={0.7}
                >
                  {bubble.transactionCount}tx
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Tooltip overlay */}
      <AnimatePresence>
        {hoveredBubble && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <BubbleTooltip
              bubble={hoveredBubble}
              x={tooltipPos.x}
              y={tooltipPos.y}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
