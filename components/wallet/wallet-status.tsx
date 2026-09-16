"use client";

import { Wallet, Activity } from "lucide-react";
import { useWallet } from "./wallet-provider";

export default function WalletStatus() {
  const { connected, address, balance, network } = useWallet();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:flex">
        <Activity
          size={14}
          className={connected ? "text-cyan-400" : "text-gray-500"}
        />

        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">
            Network
          </div>

          <div className="text-xs text-gray-300">{network}</div>
        </div>
      </div>

      {connected && address && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Wallet size={15} className="text-cyan-400" />

          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500">
              Balance
            </div>

            <div className="text-xs font-medium text-white">
              {balance} MIDEN
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
