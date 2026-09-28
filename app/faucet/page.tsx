"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

function getLocalBreadProvider() {
  if (typeof window === "undefined") return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

// Midenscan və Cüzdandakı 1000 ELA-ya aid rəsmi Faucet ID-ləri
const ANR_FAUCET_ID = "mtst1ap8thrsn8ta805gkqq5g4c227cqjen58_qr7qqq9wr6w";
const ELA_FAUCET_ID = "mtst1aqejw49mjj6ttvg44jkmhpzv3sxs5wq0_qr7qqq9wr6w";

const DECIMALS_MULTIPLIER = 1_000_000; // 6 Decimals (100 Token = 100,000,000 base units)

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
        throw new Error("Bread Wallet extension tapılmadı. Zəhmət olmasa cüzdanı quraşdırın.");
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
        throw new Error("Zəhmət olmasa əvvəlcə Bread Wallet-i qoşun.");
      }

      const targetFaucet = symbol === "ANR" ? ANR_FAUCET_ID : ELA_FAUCET_ID;
      const rawAmount = 100 * DECIMALS_MULTIPLIER; // 100 Tam Token

      setStatus({ type: "info", message: `🍞 Bread Wallet açılır... 100 ${symbol} claim əməliyyatını cüzdanda təsdiq edin.` });

      const txObj = {
        senderAddress: activeAccount,
        recipientAddress: activeAccount,
        faucetId: targetFaucet,
        noteType: "public" as const,
        amount: rawAmount,
      };

      console.log(`[Faucet UI] Requesting 100 ${symbol} via Bread Wallet:`, txObj);

      let txResponse: any = null;

      // 1. Birbaşa Bread Wallet Mint / Send Metodları
      if (typeof breadProvider.requestMint === "function") {
        txResponse = await breadProvider.requestMint({
          account: activeAccount,
          faucetId: targetFaucet,
          amount: rawAmount,
        });
      } else if (typeof breadProvider.requestSend === "function") {
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

      console.log(`[Faucet UI] Bread Wallet cavabı:`, txResponse);

      if (
        txResponse &&
        typeof txResponse === "object" &&
        (txResponse.error ||
          txResponse.success === false ||
          (typeof txResponse.status === "string" && /fail|error|reject/i.test(txResponse.status)))
      ) {
        throw new Error(txResponse.error?.message || txResponse.error || "Cüzdanda əməliyyat ləğv edildi.");
      }

      const realTxHash = extractTxHash(txResponse);

      setStatus({
        type: "success",
        message: `🎉 100 ${symbol} uğurla claim olundu! Cüzdanınızdakı balans 1000-dən 1100 ${symbol}-a yüksəldi.`,
        txHash: realTxHash || undefined,
      });
    } catch (err: any) {
      console.error(`[Faucet Error - ${symbol}]:`, err);
      const msg = err?.message || String(err);
      if (msg.includes("User rejected") || msg.includes("Cancel") || err?.code === 4001) {
        setStatus({ type: "error", message: "⚠️ İstifadəçi cüzdanda əməliyyatı ləğv etdi." });
      } else {
        setStatus({ type: "error", message: `❌ Xəta: ${msg}` });
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
          Testnet proqnoz bazarlarında iştirak etmək üçün ANR və ELA tokenlərini birbaşa Bread Wallet ilə claim edin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ANR Token Claim */}
        <div className="card rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-base">🪙 ANR Token</div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Primary Token</span>
          </div>
          <p className="text-xs text-white/50 font-mono">Faucet: {ANR_FAUCET_ID.slice(0, 16)}...</p>
          <button
            onClick={() => handleClaimToken("ANR")}
            disabled={loadingToken !== null}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {loadingToken === "ANR" ? "⏳ Cüzdanda Təsdiqlənir..." : "⚡ Claim 100 ANR"}
          </button>
        </div>

        {/* ELA Token Claim */}
        <div className="card rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-base">💎 ELA Token (Balans: 1000)</div>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Ecosystem Token</span>
          </div>
          <p className="text-xs text-white/50 font-mono">Faucet: {ELA_FAUCET_ID.slice(0, 16)}...</p>
          <button
            onClick={() => handleClaimToken("ELA")}
            disabled={loadingToken !== null}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-purple-500/20"
          >
            {loadingToken === "ELA" ? "⏳ Cüzdanda Təsdiqlənir..." : "⚡ Claim 100 ELA"}
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
