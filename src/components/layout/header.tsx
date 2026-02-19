"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, Plus, LogOut, Menu } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { useAllNfts } from "@/hooks/use-nfts";
import { useUiStore } from "@/stores/ui-store";
import { shortenAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function Header() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { wallets } = useWalletStore();
  const { isLoading: nftsLoading } = useAllNfts();
  const { toggleMobileSidebar } = useUiStore();

  return (
    <header className="h-14 border-b border-border-default bg-bg-surface/60 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Burger menu — mobile only */}
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 rounded-md text-text-muted hover:text-neon-green hover:bg-neon-green/5 transition-colors cursor-pointer lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Wallet size={14} />
          <span>{wallets.length} vault{wallets.length !== 1 ? "s" : ""} tracked</span>
          {wallets.length > 0 && nftsLoading && (
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green rad-pulse" />
          )}
        </div>
      </div>

      {/* Right side - wallet actions */}
      <div className="flex items-center gap-2">
        {connected && publicKey ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-md bg-neon-green/5 border border-neon-green/20">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <span className="text-[10px] md:text-xs text-neon-green font-medium">
                {shortenAddress(publicKey.toBase58())}
              </span>
            </div>
            <button
              onClick={() => disconnect()}
              className="p-1.5 rounded-md text-text-muted hover:text-blood hover:bg-blood/10 transition-colors cursor-pointer"
              title="Disconnect"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className={cn(
              "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-md text-[10px] md:text-xs font-medium uppercase tracking-wider",
              "bg-neon-green/10 border border-neon-green/30 text-neon-green",
              "hover:bg-neon-green/20 hover:border-neon-green/50",
              "transition-all duration-200 cursor-pointer"
            )}
          >
            <Plus size={12} />
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
