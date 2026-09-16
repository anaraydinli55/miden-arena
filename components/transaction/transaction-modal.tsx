"use client";

import { X, ShieldCheck, Fuel } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../wallet/wallet-provider";
import TransactionStatus from "./transaction-status";

type Props = {
  open: boolean;
  onClose: () => void;
  market: string;
  position: "YES" | "NO";
};

export default function TransactionModal({
  open,
  onClose,
  market,
  position,
}: Props) {
  const { connected } = useWallet();

  const [amount, setAmount] = useState("10");
  const [state, setState] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");

  if (!open) return null;

  const gasFee = "Calculated by Miden";
  const total = `${amount} + gas`;

  const confirmTransaction = async () => {
    if (!connected) return;

    setState("pending");

    /*
     * Real Miden transaction signing will be called here.
     *
     * This must eventually:
     * 1. Build the transaction
     * 2. Calculate the actual Miden fee
     * 3. Ask the wallet to sign
     * 4. Submit the transaction
     * 5. Wait for confirmation
     */

    setTimeout(() => {
      setState("success");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d12] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <div className="text-lg font-semibold text-white">
              Confirm Prediction
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Miden transaction
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="text-xs text-gray-500">MARKET</div>
            <div className="mt-1 text-sm text-white">{market}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-gray-500">POSITION</div>

              <div
                className={`mt-1 text-lg font-bold ${
                  position === "YES" ? "text-cyan-400" : "text-red-400"
                }`}
              >
                {position}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] text-gray-500">NETWORK</div>

              <div className="mt-1 text-sm text-white">Miden Testnet</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">AMOUNT</label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="0"
                className="w-full bg-transparent px-4 py-3 text-white outline-none"
              />

              <span className="pr-4 text-xs text-gray-500">MIDEN</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <Fuel size={14} />
                Gas Fee
              </span>

              <span className="text-xs text-gray-300">{gasFee}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-white">Total</span>

              <span className="text-sm font-semibold text-white">
                {total} MIDEN
              </span>
            </div>
          </div>

          <div className="flex gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-cyan-400"
            />

            <div className="text-[11px] leading-relaxed text-gray-400">
              This action requires a wallet signature. The final network fee
              will be determined by the Miden transaction.
            </div>
          </div>

          <TransactionStatus state={state} />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={confirmTransaction}
              disabled={!connected || state === "pending"}
              className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state === "pending" ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
