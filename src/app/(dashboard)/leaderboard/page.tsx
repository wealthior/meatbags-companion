"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, Users, Plug, Loader2 } from "lucide-react";
import { GlitchText } from "@/components/shared/glitch-text";
import { WipBanner } from "@/components/shared/wip-banner";
import { StatCard } from "@/components/shared/stat-card";
import { PageLoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatNumber, shortenAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { LeaderboardRanking } from "@/types/leaderboard";

export default function LeaderboardPage() {
  const { publicKey, connected, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [verifyError, setVerifyError] = useState("");

  // Fetch leaderboard
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardRanking[]> => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return [];
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });

  // Verify wallet mutation
  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!publicKey || !signMessage) {
        throw new Error("Wallet not connected or doesn't support signing");
      }

      const timestamp = Date.now();
      const message = `MeatBags Companion: Verify ownership of ${publicKey.toBase58()} at ${timestamp}`;
      const encoded = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encoded);
      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

      const res = await fetch("/api/leaderboard/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
          message,
          displayName: displayName || shortenAddress(publicKey.toBase58()),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Verification failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setVerifyError("");
    },
    onError: (error) => {
      setVerifyError(error instanceof Error ? error.message : "Verification failed");
    },
  });

  if (isLoading) return <PageLoadingSkeleton />;

  const rankings = leaderboard ?? [];
  const totalVerified = rankings.length;
  const totalNftsTracked = rankings.reduce((sum, r) => sum + r.totalNfts, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Leaderboard" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Verified holder rankings — the REAL holder list
        </p>
      </div>

      {/* WIP Banner */}
      <WipBanner
        title="Leaderboard Beta"
        subtitle="The verified holder ranking system is under active development. Wallet verification is functional but rankings may change as the system evolves."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Verified Holders"
          value={formatNumber(totalVerified)}
          icon={Users}
          accent="green"
        />
        <StatCard
          label="NFTs Tracked"
          value={formatNumber(totalNftsTracked)}
          icon={Crown}
          accent="gold"
        />
        <StatCard
          label="Top Holder"
          value={rankings[0]?.displayName ?? "—"}
          subValue={rankings[0] ? `${formatNumber(rankings[0].totalNfts)} NFTs` : undefined}
          icon={Shield}
          accent="purple"
        />
      </div>

      {/* Verify Your Wallets */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Verify Your Wallets
        </h3>
        <p className="text-[10px] text-text-muted leading-relaxed">
          MagicEden shows incorrect holder rankings because people use split wallets.
          Connect each of your wallets and sign a message to prove ownership.
          Your NFT count will be aggregated across all verified wallets.
        </p>

        {connected && publicKey ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (optional)"
              className="flex-1 max-w-xs bg-bg-primary border border-border-default rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green/30"
            />
            <button
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider",
                "bg-neon-green/10 border border-neon-green/30 text-neon-green",
                "hover:bg-neon-green/20 hover:border-neon-green/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200 cursor-pointer"
              )}
            >
              {verifyMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Shield size={12} />
              )}
              Verify {shortenAddress(publicKey.toBase58())}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider",
              "bg-neon-green/10 border border-neon-green/30 text-neon-green",
              "hover:bg-neon-green/20 cursor-pointer"
            )}
          >
            <Plug size={12} />
            Connect Wallet to Verify
          </button>
        )}

        {verifyError && (
          <p className="text-blood text-[10px]">{verifyError}</p>
        )}
        {verifyMutation.isSuccess && (
          <p className="text-neon-green text-[10px]">
            Wallet verified successfully! Connect your next wallet to add more.
          </p>
        )}
      </div>

      {/* Rankings Table */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Holdings Ranking
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-[10px] text-text-muted uppercase tracking-wider">
                <th className="text-center px-4 py-2 w-16">Rank</th>
                <th className="text-left px-4 py-2">Holder</th>
                <th className="text-right px-4 py-2">MeatBags</th>
                <th className="text-right px-4 py-2">Verified Wallets</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-text-muted text-sm">
                    No verified holders yet. Be the first!
                  </td>
                </tr>
              ) : (
                rankings.map((entry) => (
                  <tr
                    key={entry.userId}
                    className="border-b border-border-default/50 hover:bg-bg-hover/30 transition-colors"
                  >
                    <td className="text-center px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold",
                          entry.rank === 1
                            ? "bg-gold/20 text-gold"
                            : entry.rank === 2
                              ? "bg-tier-silver/20 text-tier-silver"
                              : entry.rank === 3
                                ? "bg-tier-bronze/20 text-tier-bronze"
                                : "bg-bg-hover text-text-muted"
                        )}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-primary font-medium">
                      {entry.displayName}
                    </td>
                    <td className="text-right px-4 py-3 text-xs text-neon-green font-bold">
                      {formatNumber(entry.totalNfts)}
                    </td>
                    <td className="text-right px-4 py-3 text-[10px] text-text-muted">
                      {entry.verifiedWalletsCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
