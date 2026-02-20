"use client";

import Image from "next/image";
import { Lock, Tag } from "lucide-react";
import { formatSol } from "@/lib/utils/format";
import type { MeatbagNft } from "@/types/nft";
import { getMaskHexColor } from "@/lib/domain/traits";

interface NftCardMiniProps {
  nft: MeatbagNft;
}

/**
 * Minimal NFT card for gallery (small grid) view.
 * Shows image with overlaid badges and a minimal info bar below.
 */
export function NftCardMini({ nft }: NftCardMiniProps) {
  const hexColor = getMaskHexColor(nft.maskColor);

  return (
    <a
      href={nft.magicEdenUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-bg-surface border border-border-default rounded-md overflow-hidden hover:border-border-accent transition-colors"
    >
      {/* Accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexColor}, transparent)`,
          opacity: 0.4,
        }}
      />

      {/* Image */}
      <div className="relative aspect-square bg-bg-primary overflow-hidden">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12.5vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[8px]">
            N/A
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-1 right-1 flex flex-col gap-0.5 items-end">
          {nft.isHonorary && (
            <div className="px-1 py-0.5 rounded bg-toxic-purple/90 text-[7px] text-white font-bold uppercase backdrop-blur-sm">
              1/1
            </div>
          )}
          {nft.isStaked && (
            <div className="px-1 py-0.5 rounded bg-neon-green/90 text-[7px] text-bg-void font-bold uppercase flex items-center gap-0.5 backdrop-blur-sm">
              <Lock size={6} />
            </div>
          )}
          {nft.isListed && (
            <div className="px-1 py-0.5 rounded bg-rust/90 text-[7px] text-white font-bold flex items-center gap-0.5 backdrop-blur-sm">
              <Tag size={6} />
              {nft.listingPriceSol ? formatSol(nft.listingPriceSol) : ""}
            </div>
          )}
        </div>

        {/* Mask color dot */}
        <div
          className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full border border-bg-void/50"
          style={{ backgroundColor: hexColor }}
        />
      </div>

      {/* Name */}
      <div className="px-1.5 py-1">
        <p className="text-[9px] font-medium text-text-primary truncate">
          {nft.name}
        </p>
      </div>
    </a>
  );
}
