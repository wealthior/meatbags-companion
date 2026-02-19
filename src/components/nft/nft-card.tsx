"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Zap } from "lucide-react";
import type { MeatbagNft } from "@/types/nft";
import { TraitBadge } from "./trait-badge";
import { getMaskHexColor } from "@/lib/domain/traits";
import { formatNumber, shortenAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface NftCardProps {
  nft: MeatbagNft;
}

export function NftCard({ nft }: NftCardProps) {
  const hexColor = getMaskHexColor(nft.maskColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative bg-bg-surface border border-border-default rounded-lg overflow-hidden transition-colors hover:border-border-accent"
      style={{
        boxShadow: `0 0 0 0 ${hexColor}00`,
      }}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-bg-primary overflow-hidden">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs">
            No Image
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Honorary badge */}
        {nft.isHonorary && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-toxic-purple/80 text-[9px] text-white font-bold uppercase tracking-wider">
            1/1
          </div>
        )}

        {/* Soulbound indicator */}
        {nft.isSoulbound && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-blood/80 text-[9px] text-white font-bold uppercase tracking-wider">
            Soulbound
          </div>
        )}

        {/* MagicEden link on hover */}
        <a
          href={nft.magicEdenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 p-1.5 rounded bg-bg-void/60 text-text-muted hover:text-neon-green opacity-0 group-hover:opacity-100 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-text-primary truncate">
            {nft.name}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <TraitBadge maskColor={nft.maskColor} size="sm" />
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Zap size={10} className="text-neon-green" />
            <span>{formatNumber(nft.dailyYield)}/d</span>
          </div>
        </div>

        <p className="text-[9px] text-text-muted truncate">
          {shortenAddress(nft.ownerWallet, 6)}
        </p>
      </div>

      {/* Colored glow border on hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px ${hexColor}40, 0 0 15px ${hexColor}15`,
        }}
      />
    </motion.div>
  );
}
