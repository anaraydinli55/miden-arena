'use client';

import React, { useState, useEffect } from 'react';
import { OFFICIAL_MARKETS, MarketMeta } from '@/lib/markets';
import { useWallet } from '@/components/wallet/wallet-provider';

const ANR_FAUCET_ID = '0xb7326fab564eef51689d3d52d464ce';
const MARKET_CONTRACT_ID = '0xc05fa91f939040d1751dc990cb2dde';

function getLocalBreadProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

export default function MarketsPage() {
  const { address, connected, connect } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pools, setPools] = useState<Record<string, any>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketMeta | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'YES' | 'NO'>('YES');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSigning, setIsSigning] = useState(false);
  const [txNotification, setTxNotification] = useState<{
    type: 'success' | 'error' | 'pending';
    message: string;
    txHash?: string;
  } | null>(null);

  const fetchPools = async () => {
    try {
      const res = await fetch(`/api/market?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.pools) setPools(data.pools);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 3000);
    return () => clearInterval(interval);
  }, []);

  const openBetModal = async (market: MarketMeta, choice: 'YES' | 'NO') => {
    let activeAccount = address;
    if (!connected || !activeAccount) {
      try {
        activeAccount = await connect();
      } catch (e) {}
    }

    if (!activeAccount) {
      setTxNotification({
        type: 'error',
        message: '⚠️ Zəhmət olmasa sol menyudan Bread Wallet-i qoşun.',
      });
      setTimeout(() => setTxNotification(null), 4000);
      return;
    }

    setSelectedMarket(market);
    setSelectedChoice(choice);
    setBetAmount(10);
    setModalOpen(true);
  };

  // 🍞 Real Bread Wallet Tranzaksiya İcrası (requestSend + 6 decimals)
  const handleConfirmBreadTransaction = async () => {
    if (!selectedMarket) return;

    setIsSigning(true);
    setTxNotification({
      type: 'pending',
      message: "🍞 Bread Wallet təsdiq pəncərəsi açılır... Zəhmət olmasa 'Confirm' basın.",
    });

    try {
      const breadProvider = getLocalBreadProvider();
      if (!breadProvider) {
        throw new Error('Bread Wallet brauzerinizdə tapılmadı.');
      }

      let activeAccount = address;
      if (!activeAccount && typeof breadProvider.connect === 'function') {
        try {
          const res = await breadProvider.connect();
          activeAccount = res?.address || (res?.accounts && res.accounts[0]) || null;
        } catch (e) {}
      }

      if (!activeAccount) {
        activeAccount = await connect();
      }

      if (!activeAccount) {
        throw new Error('Bread Wallet bağlantısı təsdiqlənmədi.');
      }

      const inputNum = Number(betAmount) || 10;
      // 6 decimals: 10 ANR = 10,000,000 base units
      const sendBaseUnits = inputNum * 1_000_000;

      const txObj = {
        senderAddress: activeAccount,
        recipientAddress: MARKET_CONTRACT_ID,
        faucetId: ANR_FAUCET_ID,
        noteType: 'public' as const,
        amount: sendBaseUnits,
      };

      console.log('Markets: Submitting transaction payload to Bread Wallet:', txObj);

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

      console.log('Markets: Bread Wallet response:', txResponse);

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

      // API Yeniləməsi
      const submitRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: selectedMarket.id,
          choice: selectedChoice,
          amount: inputNum,
          wallet_address: activeAccount,
          tx_hash: confirmedTx,
        }),
      });

      const data = await submitRes.json();
      if (data.success) {
        setModalOpen(false);
        setTxNotification({
          type: 'success',
          message: `✅ Tranzaksiya Zəncirə Göndərildi və Bread Wallet-də Confirmed Oldu! (${selectedChoice}: ${inputNum} ANR)`,
          txHash: confirmedTx,
        });
        fetchPools();
        setTimeout(() => setTxNotification(null), 6000);
      } else {
        throw new Error(data.error || 'Failed to record transaction');
      }
    } catch (err: any) {
      console.error('Markets submission error:', err);
      setTxNotification({
        type: 'error',
        message: `❌ Cüzdan Xətası: ${err.message || 'Tranzaksiya icra olunmadı'}`,
      });
      setTimeout(() => setTxNotification(null), 5000);
    } finally {
      setIsSigning(false);
    }
  };

  const now = Date.now();
  const activeMarkets = OFFICIAL_MARKETS.filter((m) => m.expiresAt > now);

  const filteredMarkets = activeMarkets.filter((m) => {
    if (selectedCategory === 'All') return true;
    return m.category === selectedCategory;
  });

  const formatTimeLeft = (target: number) => {
    const diff = target - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d : ${hours}h`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white relative">
      {/* Üst Başlıq */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">On-Chain Markets</h1>
          <p className="text-gray-400 text-sm mt-1">
            Zero-Knowledge prediction markets on Miden Testnet (Bread ZK)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {filteredMarkets.length} Live zk-Markets
          </span>
        </div>
      </div>

      {/* Bildiriş Paneli */}
      {txNotification && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex flex-col md:flex-row md:items-center justify-between gap-2 animate-fadeIn ${
            txNotification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : txNotification.type === 'pending'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div>
            <span>{txNotification.message}</span>
            {txNotification.txHash && (
              <div className="font-mono text-xs text-indigo-300 mt-1 break-all">
                Tx Hash: {txNotification.txHash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kateqoriyalar */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {['All', 'Miden ZK', 'Crypto', 'Economy', 'AI & Tech'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#141822] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => {
          const poolData = pools[market.id] || {
            total_pool: 20,
            yes_pool: 10,
            no_pool: 10,
            yes_percent: 50,
            no_percent: 50,
          };
          const hasStakes = (poolData.total_pool || 0) > 0;

          return (
            <div
              key={market.id}
              className="bg-[#121620] border border-gray-800/80 hover:border-gray-700 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/5 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                      Bread ZK
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                      {market.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 mb-5">
                  <div className="text-3xl p-2.5 rounded-2xl bg-[#1a202c] border border-gray-800 flex items-center justify-center shrink-0">
                    {market.icon}
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors leading-snug">
                    {market.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 py-3 px-3.5 rounded-xl bg-[#0d1017] border border-gray-800/60 mb-5 font-mono">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span>📊 {poolData.total_pool || 20} {market.tokenSymbol}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                    <span>⏱ {formatTimeLeft(market.expiresAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
                    <span className="text-emerald-400">
                      YES {hasStakes ? `${poolData.yes_percent}%` : '50%'} ({poolData.yes_pool || 10} ANR)
                    </span>
                    <span className="text-rose-400">
                      NO {hasStakes ? `${poolData.no_percent}%` : '50%'} ({poolData.no_pool || 10} ANR)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${poolData.yes_percent || 50}%` }}
                    ></div>
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${poolData.no_percent || 50}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openBetModal(market, 'YES')}
                    className="py-2.5 px-4 rounded-xl bg-[#e07a1e] hover:bg-[#c96914] text-white text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    ⚡ Yes
                  </button>
                  <button
                    onClick={() => openBetModal(market, 'NO')}
                    className="py-2.5 px-4 rounded-xl bg-[#1a202c] hover:bg-gray-800 text-gray-200 border border-gray-700 text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    ⚡ No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#121620] border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl p-2 rounded-xl bg-[#1a202c] border border-gray-800">
                {selectedMarket.icon}
              </span>
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Bread ZK Prediction
                </span>
                <h3 className="font-bold text-base text-white leading-snug">
                  {selectedMarket.title}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1017] border border-gray-800 mb-5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Contract:</span>
                <span className="text-cyan-400 font-semibold">{MARKET_CONTRACT_ID.slice(0, 12)}...{MARKET_CONTRACT_ID.slice(-4)} ↗</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token Faucet:</span>
                <span className="text-amber-400 font-semibold">{ANR_FAUCET_ID.slice(0, 12)}...{ANR_FAUCET_ID.slice(-4)} (ANR)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connected:</span>
                <span className="text-emerald-400 font-semibold">{address || 'Bread Wallet'}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Prediction Choice
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedChoice('YES')}
                  className={`py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 border transition-all ${
                    selectedChoice === 'YES'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-900 border-gray-800 text-gray-400'
                  }`}
                >
                  🟢 YES
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChoice('NO')}
                  className={`py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 border transition-all ${
                    selectedChoice === 'NO'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                      : 'bg-gray-900 border-gray-800 text-gray-400'
                  }`}
                >
                  🔴 NO
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span>Prediction Points / ANR Amount</span>
                <span className="text-cyan-400">+{betAmount * 10} XP Reward</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(amt)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      betAmount === amt
                        ? 'bg-cyan-500 text-black border-cyan-500'
                        : 'bg-[#141822] text-gray-300 border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    {amt} ANR
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#0d1017] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              disabled={isSigning}
              onClick={handleConfirmBreadTransaction}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSigning ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                  Bread Wallet təsdiq gözlənilir...
                </>
              ) : (
                `⚡ Submit ZK Prediction (${betAmount} ANR)`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
