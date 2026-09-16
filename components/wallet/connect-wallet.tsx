"use client";

import { useWallet } from "@miden-sdk/miden-wallet-adapter";

export default function ConnectWallet() {
  const { connected, address, connect, disconnect, select, wallet, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      if (wallet) {
        await connect();
        return;
      }

      if (wallets && wallets.length > 0) {
        const targetWallet = wallets[0];
        select(targetWallet.adapter.name);
        // Birbaşa adapterin özünə connect edirik (State gecikməsi olmur)
        await targetWallet.adapter.connect();
      }
    } catch (e: any) {
      console.error("Connect error:", e);
    }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-mono text-cyan-300">
          🟢 {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10 hover:text-white transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-95"
    >
      🍞 Connect Bread / Miden Wallet
    </button>
  );
}
