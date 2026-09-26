"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

function getLocalBreadProvider() {
  if (typeof window === "undefined") return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

const ANR_FAUCET_ID = "0x7e1d75334832f85106a9cd4757abb0";
const ELA_FAUCET_ID = "0x7e1d75334832f85106a9cd4757abb0";

function extractTxHash(response: any): string | null {
  if (!response) return null;
  if (typeof response === "string" && response.startsWith("0x")) return response;

  if (typeof response === "object") {
    if (typeof response.transactionHash === "string" && response.transactionHash.startsWith("0x")) return response.transactionHash;
    if (typeof response.transactionId === "string" && response.transactionId.startsWith("0x")) return response.transactionId;
    if (typeof response.txId === "string" && response.txId.startsWith("0x")) return response.txId;
    if (typeof response.hash === "string" && response.hash.startsWith("0x")) return response.hash;
    if (typeof response.id === "string" && response.id.startsWith("0x")) return response.id;
    if (response.result) return extractTxHash(response.result);
    if (response.transaction) return extractTxHash(response.transaction);
  }
  return null;
}

export default function FaucetPage() {
  const { address, connect } = useWallet();
  const [loadingToken, setLoadingToken] = useState<"ANR" | "ELA" | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string; txHash?: string } | null>(null);

  const handleClaimToken = async (symbol: "ANR" | "ELA") => {
    setStatus(null);
    setLoadingToken(symbol);

    try {
      const breadProvider = getLocalBreadProvider();
      if (!breadProvider) {
        throw new Error("Bread Wallet extension tapılmadı.");
      }

      let activeAccount = address;
      if (!activeAccount && typeof breadProvider.connect === "function") {
        const res = await breadProvider.connect().catch(() => null);
        activeAccount = res?.address || (res?.accounts && res.accounts[0]) || null;
      }
      if (!activeAccount) {
        activeAccount = await connect();
      }
      if (!activeAccount) {
        throw new Error("Cüzdan qoşulmadı.");
      }

      const targetFaucet = symbol === "ANR" ? ANR_FAUCET_ID : ELA_FAUCET_ID;

      const txObj = {
        senderAddress: activeAccount,
        recipientAddress: activeAccount,
        faucetId: targetFaucet,
        noteType: "public" as const,
        amount: 100,
      };

      setStatus({ type: "info", message: `🍞 Bread Wallet açılır... 100 ${symbol} təsdiq edin.` });

      let txResponse: any = null;

      if (typeof breadProvider.requestSend === "function") {
        txResponse = await breadProvider.requestSend(txObj);
      } else if (typeof breadProvider.requestSendTransaction === "function") {
        txResponse = await breadProvider.requestSendTransaction(txObj);
      } else if (typeof breadProvider.sendTransaction === "function") {
        txResponse = await breadProvider.sendTransaction(txObj);
      } else if (typeof breadProvider.request === "function") {
        txResponse = await breadProvider.request({
          method: "miden_sendTransaction",
          params: [txObj],
        });
      } else {
        throw new Error("Bread Wallet-də uyğun tranzaksiya metodu tapılmadı.");
      }

      if (
        txResponse &&
        typeof txResponse === "object" &&
        (txResponse.error ||
          txResponse.success === false ||
          (typeof txResponse.status === "string" && /fail|error|reject/i.test(txResponse.status)))
      ) {
        throw new Error(txResponse.error?.message || txResponse.error || "Bread Wallet əməliyyatı rədd etdi.");
      }

      const realTxHash = extractTxHash(txResponse);

      setStatus({
        type: "success",
        message: `🎉 100 ${symbol} uğurla mint olundu!`,
        txHash: realTxHash || undefined,
      });
    } catch (err: any) {
      if (err?.message?.includes("User rejected") || err?.message?.includes("Cancel") || err?.code === 4001) {
        setStatus({ type: "error", message: "⚠️ İstifadəçi cüzdanda əməliyyatı ləğv etdi." });
      } else {
        setStatus({ type: "error", message: `❌ Xəta: ${err?.message || "Mint icra olunmadı."}` });
      }
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
          Testnet tokenlərini birbaşa Bread Wallet vasitəsilə claim edə bilərsiniz.
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
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer"
          >
            {loadingToken === "ANR" ? "⏳ Cüzdanda Mint Edilir..." : "⚡ Claim 100 ANR"}
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
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer"
          >
            {loadingToken === "ELA" ? "⏳ Cüzdanda Mint Edilir..." : "⚡ Claim 100 ELA"}
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
