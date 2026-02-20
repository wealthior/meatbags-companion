import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TrackedWallet } from "@/types/wallet";
import type { LoyaltyMultiplier } from "@/types/nft";

interface WalletState {
  /** All tracked wallets (both connected and manual) */
  wallets: TrackedWallet[];
  /** Add a new wallet to track */
  addWallet: (address: string, name: string, isConnected?: boolean) => void;
  /** Remove a wallet by address */
  removeWallet: (address: string) => void;
  /** Rename a wallet */
  renameWallet: (address: string, newName: string) => void;
  /** Update a wallet's connected status */
  setWalletConnected: (address: string, isConnected: boolean) => void;
  /** Set detected loyalty multiplier for a wallet */
  setDetectedMultiplier: (address: string, multiplier: LoyaltyMultiplier) => void;
  /** Check if a wallet address is already tracked */
  hasWallet: (address: string) => boolean;
  /** Clear all wallets */
  clearAll: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],

      addWallet: (address, name, isConnected = false) => {
        if (get().hasWallet(address)) return;
        set((state) => ({
          wallets: [
            ...state.wallets,
            {
              address,
              name,
              isConnected,
              addedAt: Date.now(),
            },
          ],
        }));
      },

      removeWallet: (address) =>
        set((state) => ({
          wallets: state.wallets.filter((w) => w.address !== address),
        })),

      renameWallet: (address, newName) =>
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.address === address ? { ...w, name: newName } : w
          ),
        })),

      setWalletConnected: (address, isConnected) =>
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.address === address ? { ...w, isConnected } : w
          ),
        })),

      setDetectedMultiplier: (address, multiplier) =>
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.address === address ? { ...w, detectedMultiplier: multiplier } : w
          ),
        })),

      hasWallet: (address) => get().wallets.some((w) => w.address === address),

      clearAll: () => set({ wallets: [] }),
    }),
    {
      name: "meatbags-wallets",
    }
  )
);
