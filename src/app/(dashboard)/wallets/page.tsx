"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, Plus, Trash2, Edit3, Check, X, Plug } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { isValidSolanaAddress } from "@/lib/utils/validation";
import { GlitchText } from "@/components/shared/glitch-text";
import { shortenAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function WalletsPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { wallets, addWallet, removeWallet, renameWallet, setWalletConnected } =
    useWalletStore();

  const [newAddress, setNewAddress] = useState("");
  const [newName, setNewName] = useState("");
  const [addressError, setAddressError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Auto-add connected wallet if not tracked (in useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (connected && publicKey) {
      const addr = publicKey.toBase58();
      if (!useWalletStore.getState().hasWallet(addr)) {
        addWallet(addr, "Connected Wallet", true);
      } else {
        setWalletConnected(addr, true);
      }
    }
  }, [connected, publicKey, addWallet, setWalletConnected]);

  const handleAddManual = () => {
    setAddressError("");
    const trimmed = newAddress.trim();

    if (!trimmed) {
      setAddressError("Address required");
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setAddressError("Invalid Solana address");
      return;
    }

    if (useWalletStore.getState().hasWallet(trimmed)) {
      setAddressError("Wallet already tracked");
      return;
    }

    addWallet(trimmed, newName.trim() || `Wallet ${wallets.length + 1}`, false);
    setNewAddress("");
    setNewName("");
  };

  const startEdit = (address: string, currentName: string) => {
    setEditingId(address);
    setEditName(currentName);
  };

  const saveEdit = (address: string) => {
    if (editName.trim()) {
      renameWallet(address, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Wallets" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Manage your vaults — split wallet support
        </p>
      </div>

      {/* Add Wallet Section */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Add Vault
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connect Wallet */}
          <button
            onClick={() => setVisible(true)}
            className={cn(
              "flex items-center justify-center gap-2 py-3 rounded-md text-xs font-medium uppercase tracking-wider",
              "bg-neon-green/10 border border-neon-green/30 text-neon-green",
              "hover:bg-neon-green/20 hover:border-neon-green/50",
              "transition-all duration-200 cursor-pointer"
            )}
          >
            <Plug size={14} />
            Connect Wallet
          </button>

          {/* Manual Entry */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Vault Name"
                className="w-full sm:w-28 bg-bg-primary border border-border-default rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green/30"
              />
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => {
                    setNewAddress(e.target.value);
                    setAddressError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                  placeholder="Solana wallet address"
                  className={cn(
                    "flex-1 bg-bg-primary border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-green/30",
                    addressError ? "border-blood" : "border-border-default"
                  )}
                />
                <button
                  onClick={handleAddManual}
                  className="px-3 py-2 rounded-md text-xs bg-rust/10 border border-rust/30 text-rust hover:bg-rust/20 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {addressError && (
              <p className="text-blood text-[10px]">{addressError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Wallet List */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Tracked Vaults ({wallets.length})
          </h3>
        </div>

        {wallets.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">
            No vaults tracked yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-border-default/50">
            {wallets.map((wallet) => (
              <div
                key={wallet.address}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 hover:bg-bg-hover/30 transition-colors"
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    wallet.isConnected ? "bg-neon-green" : "bg-text-muted"
                  )}
                />

                {/* Name (editable) */}
                <div className="flex-1 min-w-0">
                  {editingId === wallet.address ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(wallet.address);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="bg-bg-primary border border-neon-green/30 rounded px-2 py-0.5 text-xs text-text-primary focus:outline-none"
                      />
                      <button
                        onClick={() => saveEdit(wallet.address)}
                        className="text-neon-green cursor-pointer"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-text-muted cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-text-primary font-medium">
                        {wallet.name}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono truncate">
                        {wallet.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Connection status */}
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 hidden sm:inline-block",
                    wallet.isConnected
                      ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                      : "bg-bg-hover text-text-muted border border-border-default"
                  )}
                >
                  {wallet.isConnected ? "Connected" : "Manual"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(wallet.address, wallet.name)}
                    className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => removeWallet(wallet.address)}
                    className="p-1.5 rounded text-text-muted hover:text-blood hover:bg-blood/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
