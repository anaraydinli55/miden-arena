"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { sendViaBread } from "@/lib/miden/bread";
import { BET_TOKENS, ESCROW_ACCOUNT_ID } from "@/lib/miden/tokens";

function getLocalBreadProvider() {
  if (typeof window === "undefined") return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

// Escrow hesabi ve faucet ID-leri lib/miden/tokens.ts-den gelir (env ile konfiqurasiya)
const MARKET_CONTRACT_ID = ESCROW_ACCOUNT_ID || "not-configured";
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
    total: 105,
    yes: 95,
    no: 10,
  });

  const fetchLiveState = async () => {
    try {
      const res = await fetch("/api/market");
      if (res.ok) {
        const data = await res.json();
        setLivePool({
          total: data.total_pool || 105,
          yes: data.yes_pool || 95,
          no: data.no_pool || 10,
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
    setStatus(`🍞 Bread Wallet təsdiq pəncərəsi açılır... Zəhmət olmasa ${amount} ${selectedToken} təsdiq edin.`);

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

      const inputUnits = Number(amount);
      if (!Number.isFinite(inputUnits) || inputUnits <= 0) {
        throw new Error("Məbləğ düzgün deyil.");
      }
      if (!ESCROW_ACCOUNT_ID) {
        throw new Error("Bahis qəbulu hələ aktiv deyil: escrow hesabı konfiqurasiya olunmayıb.");
      }
      const targetFaucet = BET_TOKENS[selectedToken];
      if (!targetFaucet) {
        throw new Error(`${selectedToken} faucet ID-si konfiqurasiya olunmayıb.`);
      }

      const confirmedTx = await sendViaBread({
        senderAddress: activeAccount,
        recipientAddress: ESCROW_ACCOUNT_ID,
        faucetId: targetFaucet,
        amount: Math.round(inputUnits * DECIMALS_MULTIPLIER),
      });

      setIsTxSubmitted(true);
      setTxHash(confirmedTx);
      setStatus(`✅ Cüzdan tranzaksiyanı göndərdi (${choice}: ${inputUnits} ${selectedToken}).`);

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: activeAccount,
          choice,
          amount: inputUnits,
          token: selectedToken,
          tx_hash: confirmedTx,
        }),
      }).catch(() => null);
      if (!res || !res.ok) {
        setStatus("⚠️ Tranzaksiya göndərildi, amma bahis serverdə qeydə alınmadı.");
        return;
      }

      setLivePool((prev) => ({
        total: prev.total + inputUnits,
        yes: choice === "YES" ? prev.yes + inputUnits : prev.yes,
        no: choice === "NO" ? prev.no + inputUnits : prev.no,
      }));
    } catch (err: any) {
      console.error("Bread Submission Error:", err);
      setIsTxSubmitted(false);
      const msg = err?.message || String(err);
      if (msg.includes("User rejected") || msg.includes("Cancel") || err?.code === 4001) {
        setStatus("⚠️ İstifadəçi tranzaksiyanı cüzdanda ləğv etdi.");
      } else {
        setStatus(`❌ Cüzdan Xətası: ${msg}`);
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

      {/* Token Seçimi: ELA / ANR / SKS */}
      <div className="mt-3">
        <label className="mb-1.5 block text-xs text-white/45">Mərc Aktivini Seçin</label>
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
              {token === "ELA" ? "💎 ELA (1000)" : token === "ANR" ? "🏛️ ANR" : "🪙 SKS"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-2 block text-xs text-white/45">
          {selectedToken} Məbləği (Tam Vahid)
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
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-500/20 cursor-pointer"
      >
        {loading ? `⏳ Cüzdandan ${amount} ${selectedToken} Gözlənilir...` : `⚡ Submit ${amount} ${selectedToken} Prediction`}
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
            <span>🎉 Real On-Chain Explorer Linkləri:</span>
            <a
              href={`https://testnet.midenscan.com/account/${address}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-semibold text-[11px]"
            >
              Canlı Blokçeyn Baxışı ↗
            </a>
          </div>

          <div className="font-mono text-[11px] text-emerald-300 break-all bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 space-y-1.5">
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
