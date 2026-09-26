"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

export default function FaucetPage() {
  const { address, connect } = useWallet();
  const [loadingToken, setLoadingToken] = useState<"ANR" | "ELA" | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string; txHash?: string } | null>(null);

  const handleClaimToken = async (symbol: "ANR" | "ELA") => {
    setStatus(null);
    setLoadingToken(symbol);

    try {
      let activeAccount = address;
      if (!activeAccount) {
        activeAccount = await connect();
      }
      if (!activeAccount) {
        throw new Error("Zəhmət olmasa əvvəlcə Bread Wallet-i qoşun.");
      }

      setStatus({ type: "info", message: `⏳ ${symbol} Public Note yaradılır və zəncirə göndərilir...` });

      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: activeAccount,
          token: symbol,
          amount: 100,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Faucet sorğusu icra olunmadı.");
      }

      setStatus({
        type: "success",
        message: `🎉 100 ${symbol} Public Note yaradıldı! Bread Wallet-i açın və Activity bölməsində gələn Note-u 'Accept / Consume' edin.`,
        txHash: data.txHash,
      });
    } catch (err: any) {
      setStatus({ type: "error", message: `❌ Xəta: ${err?.message || "Claim icra olunmadı."}` });
    } finally {
      setLoadingToken(null);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <div className="card rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
          TESTNET FAUCET
        </span>
        <h1 className="text-2xl font-bold text-white">Miden Arena Testnet Token Faucet</h1>
        <p className="text-xs text-white/60 leading-relaxed">
          Testnet proqnoz bazarlarında iştirak etmək üçün test tokenlərini birbaşa cüzdanınıza claim edə bilərsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-base">🪙 ANR Token</div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Primary Token</span>
          </div>
          <button
            onClick={() => handleClaimToken("ANR")}
            disabled={loadingToken !== null}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {loadingToken === "ANR" ? "⏳ Note Yaradılır..." : "⚡ Claim 100 ANR"}
          </button>
        </div>

        <div className="card rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-base">💎 ELA Token</div>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Ecosystem Token</span>
          </div>
          <button
            onClick={() => handleClaimToken("ELA")}
            disabled={loadingToken !== null}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-purple-500/20"
          >
            {loadingToken === "ELA" ? "⏳ Note Yaradılır..." : "⚡ Claim 100 ELA"}
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`rounded-xl border p-4 text-xs space-y-1.5 ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : status.type === "info"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="font-medium">{status.message}</div>
          {status.txHash && status.txHash.startsWith("0x") && (
            <div className="pt-1 text-[11px] font-mono">
              Tx Hash:{" "}
              <a
                href={`https://testnet.midenscan.com/tx/${status.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline hover:text-cyan-200"
              >
                {status.txHash} ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
