"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { SendTransaction } from "@miden-sdk/miden-wallet-adapter";

// Rəsmi Testnet tərəfindən tanınan Faucet və Market identifikatorları
const SKS_FAUCET_ID = "mtst1arut8ltmq8yxzu2az9x2nsgl0qmrjh86_qr7qqq9wr6w";
const TARGET_MARKET_RECIPIENT = "mtst1arut8ltmq8yxzu2az9x2nsgl0qmrjh86_qr7qqq9wr6w";
const MARKET_CONTRACT_ID = "0x4fd1531ea602bd513c5b87df3d8332";

export function PredictionPanel() {
  const { connected, address, connect } = useWallet();

  const [choice, setChoice] = useState<"YES" | "NO" | null>("YES");
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [livePool, setLivePool] = useState<{ total: number; yes: number; no: number } | null>(null);

  const getProvider = () => {
    if (typeof window === "undefined") return null;
    return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
  };

  const fetchLiveState = async () => {
    try {
      const res = await fetch("/api/market");
      if (res.ok) {
        const data = await res.json();
        setLivePool({
          total: data.total_pool,
          yes: data.yes_pool,
          no: data.no_pool,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 3000);
    return () => clearInterval(interval);
  }, []);

  const submitPrediction = async () => {
    setStatus(null);
    setTxHash(null);

    const provider = getProvider();
    if (!provider) {
      alert("Bread Wallet extension tapılmadı!");
      setStatus("❌ Bread Wallet extension tapılmadı.");
      return;
    }

    if (!choice) {
      setStatus("⚠️ Zəhmət olmasa YES və ya NO seçin.");
      return;
    }

    setLoading(true);
    setStatus("🍞 Bread Wallet təsdiq pəncərəsi açılır...");

    try {
      let activeAccount = address;

      if (!activeAccount && typeof provider.requestConnection === "function") {
        const conn = await provider.requestConnection().catch(() => null);
        activeAccount = conn?.address || conn?.publicKey || (conn?.accounts && conn.accounts[0]) || null;
      }

      if (!activeAccount && typeof provider.request === "function") {
        const accs = await provider.request({ method: "miden_accounts" }).catch(() => null);
        if (accs && accs.length > 0) activeAccount = accs[0]?.address || accs[0];
      }

      if (!activeAccount) {
        activeAccount = await connect();
      }

      if (!activeAccount) {
        throw new Error("Cüzdanın aktiv hesabı oxuna bilmədi.");
      }

      const sendAmount = (Number(amount) || 10) * 1_000_000;

      // Rəsmi Testnet-in qəbul etdiyi SendTransaction
      const transaction = new SendTransaction(
        activeAccount,
        TARGET_MARKET_RECIPIENT,
        SKS_FAUCET_ID,
        "public",
        sendAmount as any
      );

      console.log("Submitting verified Testnet SendTransaction:", transaction);

      let txResponse: any = null;

      if (typeof provider.requestSend === "function") {
        txResponse = await provider.requestSend(transaction);
      } else if (typeof provider.requestSendTransaction === "function") {
        txResponse = await provider.requestSendTransaction(transaction);
      } else if (typeof provider.sendTransaction === "function") {
        txResponse = await provider.sendTransaction(transaction);
      } else if (typeof provider.request === "function") {
        txResponse = await provider.request({
          method: "miden_sendTransaction",
          params: [transaction],
        });
      }

      console.log("Wallet confirmation response:", txResponse);

      let realTxId: string | null = null;
      if (typeof txResponse === "string" && txResponse.startsWith("0x")) {
        realTxId = txResponse;
      } else if (txResponse && typeof txResponse === "object") {
        realTxId = txResponse.txId || txResponse.hash || txResponse.id || null;
      }

      if (!realTxId) {
        throw new Error("Cüzdan tranzaksiyanı təsdiqləmədi və ya Tx ID qaytarmadı.");
      }

      // Canlı API state-i yeniləyirik
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice: choice,
          amount: Number(amount) || 10,
          txHash: realTxId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLivePool({
          total: data.updated_state.total_pool,
          yes: data.updated_state.yes_pool,
          no: data.updated_state.no_pool,
        });
      }

      setTxHash(realTxId);
      setStatus(`✅ On-Chain Tranzaksiya Uğurla Təsdiqləndi! (${choice}: ${amount} SKS)`);
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err?.message?.includes("User rejected") || err?.message?.includes("Cancel") || err?.code === 4001) {
        setStatus("⚠️ İstifadəçi tranzaksiyanı cüzdanda ləğv etdi.");
      } else {
        setStatus(`❌ Cüzdan Xətası: ${err?.message || "Tranzaksiya icra olunmadı"}`);
      }
      setTxHash(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card rounded-2xl p-5 border border-white/10 bg-white/[0.02]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Private Prediction</div>
        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
          Bread ZK
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-white/5 bg-black/40 p-3 text-[11px] text-white/50 space-y-1">
        <div>Contract: <span className="font-mono text-cyan-300">{MARKET_CONTRACT_ID.slice(0, 10)}...{MARKET_CONTRACT_ID.slice(-4)}</span></div>
        <div>Market: <span className="text-white/80 font-medium">#1 (Will Miden mainnet launch before Q2 2027?)</span></div>
        {livePool && (
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-white/80 font-semibold">
            <span className="text-emerald-400">🟢 YES: {livePool.yes} SKS</span>
            <span className="text-rose-400">🔴 NO: {livePool.no} SKS</span>
            <span className="text-cyan-300">📈 Total: {livePool.total} SKS</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["YES", "NO"] as const).map((x) => (
          <button
            key={x}
            onClick={() => {
              setChoice(x);
              setStatus(null);
            }}
            className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
              choice === x
                ? x === "YES"
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-rose-500 bg-rose-500/20 text-rose-400"
                : "border-white/10 bg-white/[.03] text-white/60 hover:bg-white/[.08]"
            }`}
          >
            {x === "YES" ? "🟢 YES" : "🔴 NO"}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <label className="mb-2 block text-xs text-white/45">
          Prediction Points / SKS Amount
        </label>

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min="1"
          step="1"
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
        />
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
        {connected && address ? (
          <span className="text-emerald-400">🟢 Connected: {address.slice(0, 10)}...{address.slice(-4)}</span>
        ) : (
          <span className="text-amber-400">⚠️ Sol menyudan cüzdanı qoşun.</span>
        )}
      </div>

      <button
        onClick={submitPrediction}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer"
      >
        {loading ? "⏳ Cüzdandan 'Confirm' Gözlənilir..." : "⚡ Submit ZK Prediction"}
      </button>

      {status && (
        <div className={`mt-3 rounded-xl border p-3 text-xs ${
          status.startsWith("✅")
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : status.startsWith("⚠️")
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : status.startsWith("❌")
            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
            : "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
        }`}>
          {status}
        </div>
      )}

      {txHash && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-200 space-y-1">
          <div className="font-bold flex items-center justify-between">
            <span>🎉 Real On-Chain Tx Hash:</span>
            <a 
              href={`https://testnet.midenscan.com/tx/${txHash}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-normal"
            >
              Midenscan ↗
            </a>
          </div>
          <div className="font-mono text-emerald-400 break-all">{txHash}</div>
        </div>
      )}
    </div>
  );
}
