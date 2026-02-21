"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResult } from "@/types/api";
import type {
  DeadbruvUserBadge,
  DeadbruvBadgeDefinition,
  DeadbruvEarnedBadge,
} from "@/types/deadbruv";
import { useWalletStore } from "@/stores/wallet-store";

/**
 * Fetch user badges for a single wallet from deadbruv API
 */
const fetchUserBadges = async (
  walletAddress: string,
): Promise<DeadbruvUserBadge[]> => {
  const resp = await fetch(
    `/api/deadbruv?table=UserBadge&walletAddress=${walletAddress}`,
  );
  const data: ApiResult<DeadbruvUserBadge[]> = await resp.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
};

/**
 * Fetch badge definitions by IDs from deadbruv API
 */
const fetchBadgeDefinitions = async (
  badgeIds: string[],
): Promise<DeadbruvBadgeDefinition[]> => {
  if (badgeIds.length === 0) return [];
  const encoded = badgeIds.map((id) => encodeURIComponent(id)).join(",");
  const resp = await fetch(
    `/api/deadbruv?table=Badge&badgeIds=${encoded}`,
  );
  const data: ApiResult<DeadbruvBadgeDefinition[]> = await resp.json();
  if (!data.success) throw new Error(data.error.message);
  return data.data;
};

/**
 * Hook to fetch badges from deadbruv.com for all tracked wallets.
 *
 * Returns the combined earned badges with full badge definitions,
 * deduplicated across wallets (traitCounts summed for multi-wallet users).
 */
export const useDeadbruvBadges = () => {
  const wallets = useWalletStore((s) => s.wallets);
  const addresses = wallets.map((w) => w.address);

  return useQuery({
    queryKey: ["deadbruv-badges", addresses],
    queryFn: async (): Promise<DeadbruvEarnedBadge[]> => {
      if (addresses.length === 0) return [];

      // Fetch user badges for all wallets
      const allUserBadges: DeadbruvUserBadge[] = [];
      for (const addr of addresses) {
        try {
          const badges = await fetchUserBadges(addr);
          allUserBadges.push(...badges);
          console.log(
            `[deadbruv] Wallet ${addr.slice(0, 8)}... → ${badges.length} badges`,
          );
        } catch (error) {
          console.error(
            `[deadbruv] Failed to fetch badges for ${addr.slice(0, 8)}...`,
            error,
          );
        }
      }

      if (allUserBadges.length === 0) return [];

      // Deduplicate by badgeId — SUM traitCounts across wallets for stackable badges
      const badgeMap = new Map<string, DeadbruvUserBadge>();
      for (const ub of allUserBadges) {
        if (ub.status !== "ACTIVE") continue;
        const existing = badgeMap.get(ub.badgeId);
        if (!existing) {
          badgeMap.set(ub.badgeId, ub);
        } else {
          // Sum traitCounts across wallets (stackable badges accumulate per NFT)
          badgeMap.set(ub.badgeId, {
            ...existing,
            traitCount: existing.traitCount + ub.traitCount,
          });
        }
      }

      const uniqueBadgeIds = [...badgeMap.keys()];

      // Fetch badge definitions
      const definitions = await fetchBadgeDefinitions(uniqueBadgeIds);
      const defMap = new Map(definitions.map((d) => [d.name, d]));

      // Combine user badges with definitions
      const earned: DeadbruvEarnedBadge[] = [];
      for (const [badgeId, userBadge] of badgeMap) {
        const badge = defMap.get(badgeId);
        if (badge) {
          earned.push({ badge, userBadge });
        }
      }

      // Sort by points descending (highest value badges first)
      earned.sort((a, b) => b.badge.points - a.badge.points);

      console.log(
        `[deadbruv] Total: ${earned.length} unique badges across ${addresses.length} wallets`,
      );
      return earned;
    },
    enabled: addresses.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
