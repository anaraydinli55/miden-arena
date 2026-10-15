"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { placeBet } from "@/lib/bet-client";
import { ESCROW_ACCOUNT_ID } from "@/lib/miden/tokens";
import { OFFICIAL_MARKETS } from "@/lib/markets";
import { PendingBets } from "@/components/pending-bets";

function getLocalBreadProvider() {
  if (typeof window === "undefined") return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

// Escrow account and faucet IDs come from lib/miden/tokens.ts (configured via env)
const MARKET_CONTRACT_ID = ESCROW_ACCOUNT_ID || "not-configured";
const PANEL_MARKET = OFFICIAL_MARKETS.find((m) => m.id === "miden-mainnet-q4") ?? OFFICIAL_MARKETS[0];
const DECIMALS_MULTIPLIER = 1_000_000; // 6 decimals

export function PredictionPanel() {
  const { connected, address, connect } = useWallet();

  const [choice, setChoice] = useState<"YES" | "NO" | null>("YES");
  const [selectedToken, setSelectedToken] = useState<"SKS" | "ANR" | "ELA">("ELA");
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [isTxSubmitted, setIsTxSubmitted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [livePool, setLivePool] = useState<{ total: number; yes: number; no: number }>({
    total: 0,
    yes: 0,
    no: 0,
  });

  const fetchLiveState = async () => {
    try {
      const res = await fetch(`/api/market?market_id=${PANEL_MARKET.id}&token=${selectedToken}`);
      if (res.ok) {
        const data = await res.json();
        setLivePool({
          total: data.total_pool || 0,
          yes: data.yes_pool || 0,
          no: data.no_pool || 0,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 15000);
    return () => clearInterval(interval);
  }, [selectedToken]);

  const submitPrediction = async () => {
    setStatus(null);
    setTxHash(null);
    setIsTxSubmitted(false);

    const breadProvider = getLocalBreadProvider();

    if (!breadProvider) {
      alert("Bread Wallet extension not found!");
      setStatus("❌ Bread Wallet extension not found.");
      return;
    }

    if (!choice) {
      setStatus("⚠️ Please choose YES or NO.");
      return;
    }

    setLoading(true);
    setStatus(`🍞 Opening Bread Wallet... Please confirm ${amount} ${selectedToken}.`);

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
        throw new Error("Bread Wallet connection was not approved.");
      }

      const inputUnits = Number(amount);
      if (!Number.isInteger(inputUnits) || inputUnits < 1 || inputUnits > 1000) {
        throw new Error("Amount must be a whole number between 1 and 1000.");
      }

      const result = await placeBet({
        wallet: activeAccount,
        marketId: PANEL_MARKET.id,
        choice,
        token: selectedToken,
        amount: inputUnits,
        onStatus: (m) => setStatus(m),
      });
      if (result.txHash) setTxHash(result.txHash);
      if (!result.ok) throw new Error(result.error);

      setIsTxSubmitted(true);
      setStatus(`✅ Bet recorded (${choice}: ${inputUnits} ${selectedToken}).`);
      fetchLiveState();
    } catch (err: any) {
      console.error("Bread Submission Error:", err);
      setIsTxSubmitted(false);
      const msg = err?.message || String(err);
      if (msg.includes("User rejected") || msg.includes("Cancel") || err?.code === 4001) {
        setStatus("⚠️ You cancelled the transaction in your wallet.");
      } else {
        setStatus(`❌ Wallet error: ${msg}`);
      }
      setTxHash(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card rounded-2xl p-5 border border-white/10 bg-white/[0.02]">
      <PendingBets onCredited={fetchLiveState} />
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
        <div>Market: <span className="text-white/80 font-medium">{PANEL_MARKET.title}</span></div>
        {livePool && (
          <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-white/80 font-semibold">
            <span className="text-emerald-400">🟢 YES: {livePool.yes} {selectedToken}</span>
            <span className="text-rose-400">🔴 NO: {livePool.no} {selectedToken}</span>
            <span className="text-cyan-300">📈 Total: {livePool.total} {selectedToken}</span>
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

      {/* Token selection: ELA / ANR / SKS */}
      <div className="mt-3">
        <label className="mb-1.5 block text-xs text-white/45">Choose an asset</label>
        <div className="grid grid-cols-3 gap-2">
          {(["ELA", "ANR", "SKS"] as const).map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => setSelectedToken(token)}
              className={`rounded-xl border py-2 text-xs font-bold transition ${
                selectedToken === token
                  ? "border-purple-400 bg-purple-400/20 text-purple-300"
                  : "border-white/10 bg-black/30 text-white/50 hover:bg-white/[0.05]"
              }`}
            >
              {token === "ELA" ? "💎 ELA" : token === "ANR" ? "🏛️ ANR" : "🪙 SKS"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-2 block text-xs text-white/45">
          {selectedToken} amount (whole units)
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
          <span className="text-amber-400">⚠️ Connect your wallet from the left menu.</span>
        )}
      </div>

      <button
        onClick={submitPrediction}
        disabled={loading}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-500/20 cursor-pointer"
      >
        {loading ? `⏳ Waiting for ${amount} ${selectedToken} confirmation...` : `⚡ Submit ${amount} ${selectedToken} Prediction`}
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

      {isTxSubmitted && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 space-y-2 shadow-lg shadow-emerald-500/10">
          <div className="font-bold flex items-center justify-between text-emerald-300">
            <span>🎉 On-chain explorer links:</span>
            <a
              href={`https://testnet.midenscan.com/account/${address}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-semibold text-[11px]"
            >
              Live blockchain view ↗
            </a>
          </div>

          <div className="font-mono text-[11px] text-emerald-300 break-all bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 space-y-1.5">
            <div>
              <span className="text-white/50">Sender account:</span>{" "}
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
              <span className="text-white/50">Target account:</span>{" "}
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
                  {txHash} ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
