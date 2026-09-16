"use client";

import { useWallet } from "@/components/wallet/wallet-provider";

export default function ConnectWallet() {
  const { connected, address, connect, disconnect, error } = useWallet();

  const handleConnectClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Connect button pressed manually");
    await connect();
  };

  if (connected && address) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-mono text-cyan-300">
          <span className="truncate">🟢 {address.slice(0, 8)}...{address.slice(-4)}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              disconnect();
            }}
            className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      <button
        onClick={handleConnectClick}
        type="button"
        className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-95 z-50 relative"
      >
        🍞 Connect Bread Wallet
      </button>
      {error && (
        <div className="text-[10px] text-rose-400 px-1 truncate">
          {error}
        </div>
      )}
    </div>
  );
}
