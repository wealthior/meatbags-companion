"use client";

import Image from "next/image";
import { ExternalLink, Lock, Tag, Zap } from "lucide-react";
import { formatSol, formatNumber, shortenAddress } from "@/lib/utils/format";
import type { MeatbagNft } from "@/types/nft";
import { TraitBadge } from "./trait-badge";
import { getMaskHexColor } from "@/lib/domain/traits";

interface NftCardCompactProps {
  nft: MeatbagNft;
}

export function NftCardCompact({ nft }: NftCardCompactProps) {
  const hexColor = getMaskHexColor(nft.maskColor);

  return (
    <div
      className="group relative flex items-center gap-2.5 bg-bg-surface border border-border-default rounded-md px-2 py-1.5 hover:border-border-accent transition-colors"
      style={{ borderLeftColor: hexColor, borderLeftWidth: 2 }}
    >
      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-bg-primary">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-[8px]">
            N/A
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-text-primary truncate">
          {nft.name}
        </p>
        <p className="text-[9px] text-text-muted truncate">
          {nft.isListed && nft.listedMarketplace ? (
            <span className="text-rust">{nft.listedMarketplace}</span>
          ) : (
            shortenAddress(nft.ownerWallet, 4)
          )}
        </p>
      </div>

      {/* Mask badge */}
      <TraitBadge maskColor={nft.maskColor} size="sm" />

      {/* Yield */}
      <div className="flex items-center gap-0.5 text-[10px] text-text-secondary flex-shrink-0">
        <Zap size={9} className="text-neon-green" />
        <span>{formatNumber(nft.dailyYield)}</span>
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {nft.isHonorary && (
          <span className="px-1 py-0.5 rounded bg-toxic-purple/90 text-[7px] text-white font-bold uppercase">
            1/1
          </span>
        )}
        {nft.isStaked && (
          <Lock size={10} className="text-neon-green" />
        )}
        {nft.isListed && (
          <div className="flex items-center gap-0.5">
            <Tag size={10} className="text-rust" />
            {nft.listingPriceSol && (
              <span className="text-[9px] text-rust">{formatSol(nft.listingPriceSol)}</span>
            )}
          </div>
        )}
      </div>

      {/* MagicEden link — visible on hover */}
      <a
        href={nft.magicEdenUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 p-1 rounded text-text-muted hover:text-neon-green opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={10} />
      </a>
    </div>
  );
}
