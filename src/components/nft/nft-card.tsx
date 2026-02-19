"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Lock, Zap } from "lucide-react";
import type { MeatbagNft } from "@/types/nft";
import { TraitBadge } from "./trait-badge";
import { getMaskHexColor } from "@/lib/domain/traits";
import { formatNumber, shortenAddress } from "@/lib/utils/format";

interface NftCardProps {
  nft: MeatbagNft;
}

export function NftCard({ nft }: NftCardProps) {
  const hexColor = getMaskHexColor(nft.maskColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -8,
        scale: 1.03,
        transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.8 },
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-bg-surface border border-border-default rounded-lg overflow-hidden cursor-pointer"
      style={{ willChange: "transform" }}
    >
      {/* Mask-colored accent bar at top */}
      <div
        className="h-[2px] w-full transition-all duration-500 ease-out group-hover:h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexColor}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Image container */}
      <div className="relative aspect-square bg-bg-primary overflow-hidden">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.12]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs">
            No Image
          </div>
        )}

        {/* Gradient overlay — always subtle, stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/60 via-transparent to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

        {/* Mask color vignette on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at bottom, ${hexColor}15 0%, transparent 70%)`,
          }}
        />

        {/* Honorary badge */}
        {nft.isHonorary && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-toxic-purple/90 text-[9px] text-white font-bold uppercase tracking-wider backdrop-blur-sm"
          >
            1/1
          </motion.div>
        )}

        {/* Status badges (top-right, stacked) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {nft.isSoulbound && (
            <div className="px-1.5 py-0.5 rounded bg-blood/90 text-[9px] text-white font-bold uppercase tracking-wider backdrop-blur-sm">
              Soulbound
            </div>
          )}
          {nft.isStaked && (
            <div className="px-1.5 py-0.5 rounded bg-neon-green/90 text-[9px] text-bg-void font-bold uppercase tracking-wider flex items-center gap-0.5 backdrop-blur-sm">
              <Lock size={8} />
              Staked
            </div>
          )}
        </div>

        {/* MagicEden link — slides up on hover */}
        <a
          href={nft.magicEdenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-bg-void/70 backdrop-blur-sm text-text-muted hover:text-neon-green translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-text-primary truncate group-hover:text-white transition-colors duration-300">
          {nft.name}
        </p>

        <div className="flex items-center justify-between">
          <TraitBadge maskColor={nft.maskColor} size="sm" />
          <div className="flex items-center gap-1 text-[10px] text-text-secondary">
            <Zap size={10} className="text-neon-green" />
            <span>{formatNumber(nft.dailyYield)}/d</span>
          </div>
        </div>

        <p className="text-[9px] text-text-muted truncate">
          {shortenAddress(nft.ownerWallet, 6)}
        </p>
      </div>

      {/* Glow border on hover — smooth colored edge glow */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
        style={{
          boxShadow: `inset 0 0 0 1px ${hexColor}50, 0 0 20px ${hexColor}20, 0 0 40px ${hexColor}10`,
        }}
      />
    </motion.div>
  );
}
