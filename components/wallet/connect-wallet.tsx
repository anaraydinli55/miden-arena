"use client";

import { useWallet } from "@/components/wallet/wallet-provider";

export default function ConnectWallet() {
  const { connected, address, connect, disconnect } = useWallet();

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
      onClick={connect}
      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-95"
    >
      🍞 Connect Bread Wallet
    </button>
  );
}
