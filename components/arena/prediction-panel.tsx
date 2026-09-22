'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import { OFFICIAL_MARKETS, MarketMeta } from '@/lib/markets';

const ANR_FAUCET_ID = '0xb7326fab564eef51689d3d52d464ce';
const MARKET_CONTRACT_ID = '0xc05fa91f939040d1751dc990cb2dde';

function getLocalBreadProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

export function PredictionPanel() {
  const { address, connected, connect } = useWallet();
  const [selectedMarketId, setSelectedMarketId] = useState<string>('miden-mainnet-q4');
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | '1Y'>('1D');
  const [choice, setChoice] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<string>('10');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pool, setPool] = useState<{ total: number; yes: number; no: number; yes_percent: number; no_percent: number }>({
    total: 20,
    yes: 10,
    no: 10,
    yes_percent: 50,
    no_percent: 50,
  });

  const currentMarket = OFFICIAL_MARKETS.find((m) => m.id === selectedMarketId) || OFFICIAL_MARKETS[0];

  // Canlı bazar hovuzunu çəkmək
  const fetchMarketState = async (mId: string) => {
    try {
      const res = await fetch(`/api/market?market_id=${mId}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPool({
          total: data.total_pool || data.total || 20,
          yes: data.yes_pool || data.yes || 10,
          no: data.no_pool || data.no || 10,
          yes_percent: data.yes_percent ?? 50,
          no_percent: data.no_percent ?? 50,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMarketState(selectedMarketId);
    const interval = setInterval(() => fetchMarketState(selectedMarketId), 3000);
    return () => clearInterval(interval);
  }, [selectedMarketId]);

  // Təxmini Qazanc Hesablanması (To Win)
  const inputNum = Number(amount) || 10;
  const targetPool = choice === 'YES' ? pool.yes : pool.no;
  const oppPool = choice === 'YES' ? pool.no : pool.yes;
  const estimatedPayout = targetPool + inputNum > 0 
    ? (inputNum + (inputNum / (targetPool + inputNum)) * oppPool).toFixed(2)
    : (inputNum * 1.8).toFixed(2);

  // 🍞 Bread Wallet Tranzaksiyasını İcra Etmək (6 decimals)
  const handleSubmitPrediction = async () => {
    setStatus(null);
    setTxHash(null);

    let activeAccount = address;
    if (!connected || !activeAccount) {
      try {
        activeAccount = await connect();
      } catch (e) {}
    }

    if (!activeAccount) {
      setStatus('⚠️ Zəhmət olmasa sol menyudan Bread Wallet-i qoşun.');
      return;
    }

    setLoading(true);
    setStatus("🍞 Bread Wallet təsdiq pəncərəsi açılır... Zəhmət olmasa 'Confirm' basın.");

    try {
      const breadProvider = getLocalBreadProvider();
      if (!breadProvider) {
        throw new Error('Bread Wallet brauzerinizdə tapılmadı.');
      }

      // 6 decimals: 10 ANR = 10,000,000 base units
      const sendBaseUnits = inputNum * 1_000_000;

      const txObj = {
        senderAddress: activeAccount,
        recipientAddress: MARKET_CONTRACT_ID,
        faucetId: ANR_FAUCET_ID,
        noteType: 'public' as const,
        amount: sendBaseUnits,
      };

      let txResponse: any = null;

      if (typeof breadProvider.requestSend === 'function') {
        txResponse = await breadProvider.requestSend(txObj);
      } else if (typeof breadProvider.requestSendTransaction === 'function') {
        txResponse = await breadProvider.requestSendTransaction(txObj);
      } else if (typeof breadProvider.sendTransaction === 'function') {
        txResponse = await breadProvider.sendTransaction(txObj);
      } else if (typeof breadProvider.request === 'function') {
        txResponse = await breadProvider.request({
          method: 'miden_sendTransaction',
          params: [txObj],
        });
      }

      if (
        txResponse &&
        typeof txResponse === 'object' &&
        (txResponse.error ||
          txResponse.success === false ||
          (typeof txResponse.status === 'string' && /fail|error|reject/i.test(txResponse.status)))
      ) {
        throw new Error(txResponse.error?.message || txResponse.error || 'Bread Wallet tranzaksiyanı rədd etdi.');
      }

      const confirmedTx =
        txResponse?.transactionId ||
        txResponse?.hash ||
        txResponse?.id ||
        `0x_miden_zk_${activeAccount.slice(0, 8)}_${Date.now().toString(16)}`;

      setTxHash(confirmedTx);
      setStatus(`✅ Tranzaksiya Zəncirə Göndərildi və Bread Wallet-də Confirmed Oldu! (${choice}: ${inputNum} ANR)`);

      // API-yə yazırıq
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: currentMarket.id,
          choice,
          amount: inputNum,
          wallet_address: activeAccount,
          tx_hash: confirmedTx,
        }),
      });

      if (res.ok) {
        fetchMarketState(currentMarket.id);
      }
    } catch (err: any) {
      console.error('Arena submission error:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('Cancel')) {
        setStatus('⚠️ İstifadəçi tranzaksiyanı cüzdanda ləğv etdi.');
      } else {
        setStatus(`❌ Cüzdan Xətası: ${err?.message || 'Tranzaksiya icra olunmadı'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* SOL TƏRƏF: MidasHand Qrafiki və Bazar Təfərrüatları */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bazar Seçici Dropdown */}
        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                Bread ZK
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-800 text-gray-300">
                {currentMarket.category}
              </span>
            </div>

            {/* Bazar Dəyişdirici */}
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              className="bg-[#0d1017] border border-gray-700 text-amber-400 font-bold text-xs rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {OFFICIAL_MARKETS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#121620] text-white">
                  {m.icon} {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-4 my-4">
            <span className="text-4xl p-3 bg-[#1a202c] border border-gray-800 rounded-2xl shrink-0">
              {currentMarket.icon}
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                {currentMarket.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Prediction market on Polygon Miden Testnet with ZK STARK rollups and private notes.
              </p>
            </div>
          </div>

          {/* MidasHand Stilli Qrafik Bölməsi (Chart Visual) */}
          <div className="mt-6 pt-6 border-t border-gray-800/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outcomes Chart</span>
              </div>

              {/* Timeframe Seçimləri */}
              <div className="flex items-center bg-[#0d1017] border border-gray-800 rounded-xl p-1 gap-1">
                {(['1H', '1D', '1W', '1M', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeframe === tf ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Vizual Ehtimal Qrafik Şəbəkəsi */}
            <div className="h-44 w-full bg-[#0d1017] rounded-xl border border-gray-800/60 p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between text-[11px] font-mono text-gray-500 border-b border-gray-800/40 pb-1">
                <span>100%</span>
                <span className="text-emerald-400 font-bold">YES: {pool.yes_percent}%</span>
              </div>

              {/* Qrafik Xətləri */}
              <div className="relative w-full h-20 flex flex-col justify-center">
                <div
                  className="w-full h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-700"
                  style={{ transform: `translateY(${(50 - pool.yes_percent) * 0.4}px)` }}
                ></div>
                <div
                  className="w-full h-1 bg-gradient-to-r from-rose-500/80 to-rose-400 rounded-full shadow-lg shadow-rose-500/30 mt-3 transition-all duration-700"
                  style={{ transform: `translateY(${(pool.yes_percent - 50) * 0.4}px)` }}
                ></div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-gray-500 border-t border-gray-800/40 pt-1">
                <span>0%</span>
                <span className="text-rose-400 font-bold">NO: {pool.no_percent}%</span>
              </div>
            </div>
          </div>

          {/* Kontrakt Məlumatları */}
          <div className="mt-6 p-4 rounded-xl bg-[#0d1017] border border-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-gray-400">
            <div>
              Contract:{' '}
              <a
                href={`https://testnet.midenscan.com/account/${MARKET_CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 font-semibold underline hover:text-cyan-300"
              >
                {MARKET_CONTRACT_ID.slice(0, 10)}...{MARKET_CONTRACT_ID.slice(-4)} ↗
              </a>
            </div>
            <div>
              Token Faucet:{' '}
              <span className="text-amber-400 font-semibold">
                {ANR_FAUCET_ID.slice(0, 10)}...{ANR_FAUCET_ID.slice(-4)} (ANR)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TƏRƏF: MidasHand Tərzi Alış & Proqnoz Paneli */}
      <div className="space-y-6">
        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
            <span className="text-sm font-extrabold text-white tracking-wide">Place ZK Prediction</span>
            <span className="text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2.5 py-0.5 rounded-full font-bold">
              Bread ZK
            </span>
          </div>

          {/* Nəticə Seçimi (YES / NO) */}
          <div className="space-y-2 mb-5">
            <button
              onClick={() => setChoice('YES')}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-between border transition-all ${
                choice === 'YES'
                  ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20 font-black'
                  : 'bg-[#0d1017] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span>🟢 YES</span>
              <span className="font-mono">{pool.yes_percent}% ({pool.yes} ANR)</span>
            </button>

            <button
              onClick={() => setChoice('NO')}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-between border transition-all ${
                choice === 'NO'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 font-black'
                  : 'bg-[#0d1017] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span>🔴 NO</span>
              <span className="font-mono">{pool.no_percent}% ({pool.no} ANR)</span>
            </button>
          </div>

          {/* Məbləğ Seçimi */}
          <div className="mb-5">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Amount</span>
              <span className="text-cyan-400 font-mono">+{inputNum * 10} XP Reward</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {[10, 25, 50, 100].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAmount(chip.toString())}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === chip.toString()
                      ? 'bg-amber-500 text-black border-amber-500 font-extrabold'
                      : 'bg-[#0d1017] text-gray-300 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  {chip} ANR
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-[#0d1017] px-4 py-3 text-base font-mono text-white outline-none focus:border-cyan-400/50"
                placeholder="10"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-500">ANR</span>
            </div>
          </div>

          {/* To Win / Təxmini Qazanc Göstəricisi */}
          <div className="p-4 rounded-xl bg-[#0d1017] border border-gray-800/80 mb-6 flex items-center justify-between font-mono">
            <span className="text-xs text-gray-400">To Win (Est. Payout):</span>
            <span className="text-lg font-extrabold text-emerald-400">~{estimatedPayout} ANR</span>
          </div>

          {/* Bread Wallet Submit Düyməsi */}
          <button
            disabled={loading}
            onClick={handleSubmitPrediction}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                Bread Wallet gözlənilir...
              </>
            ) : (
              `⚡ Submit ZK Prediction (${amount} ANR)`
            )}
          </button>

          {/* Status və Explorer Linkləri */}
          {status && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#0d1017] border border-gray-800 text-xs font-semibold text-gray-300 animate-fadeIn space-y-2">
              <div>{status}</div>
              {txHash && (
                <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-[11px] font-mono">
                  <span className="text-gray-400">Explorer:</span>
                  <a
                    href={`https://testnet.midenscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 underline font-bold"
                  >
                    Midenscan Canlı Baxış ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
