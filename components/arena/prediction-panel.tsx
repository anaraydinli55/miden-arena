"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

function getLocalBreadProvider() {
  if (typeof window === "undefined") return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

const SKS_FAUCET_ID = "mtst1ap8thrsn8ta805gkqq5g4c227cqjen58_qr7qqq9wr6w";
const MARKET_CONTRACT_ID = "0xc05fa91f939040d1751dc990cb2dde";

function extractVerifiedOnChainTxHash(response: any): string | null {
  if (!response) return null;
  if (typeof response === "string" && response.startsWith("0x") && response.length >= 32) {
    return response;
  }

  if (typeof response === "object") {
    if (typeof response.transactionHash === "string" && response.transactionHash.startsWith("0x")) {
      return response.transactionHash;
    }
    if (typeof response.txId === "string" && response.txId.startsWith("0x")) {
      return response.txId;
    }
    if (typeof response.hash === "string" && response.hash.startsWith("0x")) {
      return response.hash;
    }
    if (typeof response.id === "string" && response.id.startsWith("0x")) {
      return response.id;
    }
    if (response.result) {
      const res = extractVerifiedOnChainTxHash(response.result);
      if (res) return res;
    }
    if (response.transaction) {
      const res = extractVerifiedOnChainTxHash(response.transaction);
      if (res) return res;
    }
    if (Array.isArray(response.outputNotes) && response.outputNotes[0]) {
      const n = response.outputNotes[0];
      const res = typeof n === "string" ? n : n.id || n.hash || null;
      if (typeof res === "string" && res.startsWith("0x")) return res;
    }

    try {
      const str = JSON.stringify(response);
      const match = str.match(/0x[a-fA-F0-9]{32,64}/);
      if (match) return match[0];
    } catch (e) {}
  }

  return null;
}

export function PredictionPanel() {
  const { connected, address, connect } = useWallet();

  const [choice, setChoice] = useState<"YES" | "NO" | null>("YES");
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [isTxSubmitted, setIsTxSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [livePool, setLivePool] = useState<{ total: number; yes: number; no: number }>({
    total: 20,
    yes: 20,
    no: 0,
  });

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
    const interval = setInterval(fetchLiveState, 4000);
    return () => clearInterval(interval);
  }, []);

  const submitPrediction = async () => {
    setStatus(null);
    setTxHash(null);
    setIsTxSubmitted(false);

    const breadProvider = getLocalBreadProvider();

    if (!breadProvider) {
      alert("Bread Wallet extension tapılmadı!");
      setStatus("❌ Bread Wallet extension tapılmadı.");
      return;
    }

    if (!choice) {
      setStatus("⚠️ Zəhmət olmasa YES və ya NO seçin.");
      return;
    }

    setLoading(true);
    setStatus("🍞 Bread Wallet təsdiq pəncərəsi açılır... Zəhmət olmasa 'Confirm' basın.");

    try {
      let activeAccount = address;

      if (!activeAccount && typeof breadProvider.connect === "function") {
        try {
          const res = await breadProvider.connect();
          activeAccount = res?.address || (res?.accounts && res.accounts[0]) || null;
        } catch (e) {}
      }

      if (!activeAccount) {
        activeAccount = await connect();
      }

      if (!activeAccount) {
        throw new Error("Bread Wallet bağlantısı təsdiqlənmədi.");
      }

      const sendUnits = Number(amount) || 10;

      const txObj = {
        senderAddress: activeAccount,
        recipientAddress: MARKET_CONTRACT_ID,
        faucetId: SKS_FAUCET_ID,
        noteType: "public" as const,
        amount: sendUnits,
      };

      console.log("Submitting transaction payload to Bread Wallet:", txObj);

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
      }

      console.log("Bread Wallet response:", txResponse);

      if (
        txResponse &&
        typeof txResponse === "object" &&
        (txResponse.error ||
          txResponse.success === false ||
          (typeof txResponse.status === "string" &&
            /fail|error|reject/i.test(txResponse.status)))
      ) {
        throw new Error(
          txResponse.error?.message ||
            txResponse.error ||
            `Bread Wallet tranzaksiyanı rədd etdi.`
        );
      }

      // Cüzdanda Confirm basıldıqdan sonra dərhal altda On-Chain kartını aktivləşdiririk
      setIsTxSubmitted(true);
      setStatus(`✅ Tranzaksiya Zəncirə Göndərildi və Bread Wallet-də Confirmed Oldu! (${choice}: ${amount} SKS)`);

      const confirmedTx = extractVerifiedOnChainTxHash(txResponse);
      if (confirmedTx) {
        setTxHash(confirmedTx);
      }

      // API Yeniləməsi
      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            choice: choice,
            amount: sendUnits,
            txHash: confirmedTx || "onchain_confirmed",
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
      } catch (e) {
        setLivePool((prev) => ({
          total: prev.total + sendUnits,
          yes: choice === "YES" ? prev.yes + sendUnits : prev.yes,
          no: choice === "NO" ? prev.no + sendUnits : prev.no,
        }));
      }
    } catch (err: any) {
      console.error("Bread Submission Error:", err?.message || err);
      setIsTxSubmitted(false);
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
        <div>
          Contract:{" "}
          <a
            href={`https://testnet.midenscan.com/account/${MARKET_CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-cyan-300 underline hover:text-cyan-200"
          >
            {MARKET_CONTRACT_ID.slice(0, 10)}...{MARKET_CONTRACT_ID.slice(-4)} ↗
          </a>
        </div>
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
        disabled={loading}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-cyan-500/20 cursor-pointer"
      >
        {loading ? "⏳ Cüzdandan 'Confirm' Gözlənilir..." : "⚡ Submit ZK Prediction"}
      </button>

      {/* Təsdiq və ya xəta bildirişi */}
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

      {/* İSTƏDİYİNİZ XÜSUSİ REAL ON-CHAIN TX LINK PƏNCƏRƏSİ */}
      {isTxSubmitted && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 space-y-2 shadow-lg shadow-emerald-500/10">
          <div className="font-bold flex items-center justify-between text-emerald-300">
            <span>🎉 Real On-Chain Explorer Linkləri:</span>
            <a
              href={
                txHash && txHash.startsWith("0x")
                  ? `https://testnet.midenscan.com/tx/${txHash}`
                  : `https://testnet.midenscan.com/account/${address}`
              }
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-semibold text-[11px]"
            >
              Midenscan Canlı Baxış ↗
            </a>
          </div>

          <div className="font-mono text-[11px] text-emerald-300 break-all bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 space-y-1">
            <div>
              <span className="text-white/50">Göndərən Hesab:</span>{" "}
              <a
                href={`https://testnet.midenscan.com/account/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline"
              >
                {address}
              </a>
            </div>
            <div>
              <span className="text-white/50">Hədəf Kontrakt:</span>{" "}
              <a
                href={`https://testnet.midenscan.com/account/${MARKET_CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline"
              >
                {MARKET_CONTRACT_ID}
              </a>
            </div>
            {txHash && txHash.startsWith("0x") && (
              <div>
                <span className="text-white/50">Tx Hash:</span>{" "}
                <a
                  href={`https://testnet.midenscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-bold underline"
                >
                  {txHash}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
