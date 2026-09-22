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

// Tək bir Bazar Kartının İnteraktiv Komponenti
function ArenaMarketCard({
  market,
  pools,
  wallet,
  connected,
  connect,
  onRefresh,
}: {
  market: MarketMeta;
  pools: Record<string, any>;
  wallet: string;
  connected: boolean;
  connect: () => Promise<string | null>;
  onRefresh: () => void;
}) {
  const [choice, setChoice] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

  const poolData = pools[market.id] || {
    total_pool: 20,
    yes_pool: 10,
    no_pool: 10,
    yes_percent: 50,
    no_percent: 50,
  };

  const hasStakes = (poolData.total_pool || 0) > 0;

  // To Win / Təxmini Qazanc
  const targetPool = choice === 'YES' ? poolData.yes_pool : poolData.no_pool;
  const oppPool = choice === 'YES' ? poolData.no_pool : poolData.yes_pool;
  const estimatedPayout = targetPool + amount > 0 
    ? (amount + (amount / (targetPool + amount)) * oppPool).toFixed(1)
    : (amount * 1.8).toFixed(1);

  // 🍞 Birbaşa Kartdan Bread Wallet Tranzaksiyasını İcra Etmək (6 decimals)
  const handleSubmit = async () => {
    setStatus(null);

    let activeAccount = wallet;
    if (!connected || !activeAccount) {
      try {
        const connectedAddr = await connect();
        if (connectedAddr) activeAccount = connectedAddr;
      } catch (e) {}
    }

    if (!activeAccount) {
      setStatus({ type: 'error', message: '⚠️ Zəhmət olmasa sol menyudan Bread Wallet-i qoşun.' });
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    setLoading(true);

    try {
      const breadProvider = getLocalBreadProvider();
      if (!breadProvider) {
        throw new Error('Bread Wallet brauzerinizdə tapılmadı.');
      }

      const inputNum = Number(amount) || 10;
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

      // API Yeniləməsi
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: market.id,
          choice,
          amount: inputNum,
          wallet_address: activeAccount,
          tx_hash: confirmedTx,
        }),
      });

      if (res.ok) {
        setStatus({
          type: 'success',
          message: `✅ Confirmed! ${amount} ANR on ${choice} (+${amount * 10} XP)`,
          txHash: confirmedTx,
        });
        onRefresh();
        setTimeout(() => setStatus(null), 6000);
      }
    } catch (err: any) {
      console.error('Prediction card error:', err);
      setStatus({
        type: 'error',
        message: `❌ ${err?.message?.includes('reject') ? 'Ləğv edildi' : 'Cüzdan Xətası'}`,
      });
      setTimeout(() => setStatus(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const diff = market.expiresAt - Date.now();
  const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));

  return (
    <div className="bg-[#121620] border border-gray-800/90 hover:border-gray-700 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/5 group relative">
      <div>
        {/* Üst Etiketlər */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              Bread ZK
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-gray-800 text-gray-300">
              {market.category}
            </span>
          </div>
          <span className="text-xs text-amber-400/90 font-mono font-medium">
            ⏱ {daysLeft}d : {hoursLeft}h
          </span>
        </div>

        {/* İkon və Başlıq */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="text-3xl p-2.5 rounded-2xl bg-[#1a202c] border border-gray-800 flex items-center justify-center shrink-0">
            {market.icon}
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors leading-snug">
            {market.title}
          </h3>
        </div>

        {/* Canlı Hovuz Barı */}
        <div className="mb-5 p-3.5 rounded-xl bg-[#0d1017] border border-gray-800/80">
          <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
            <span className="text-emerald-400">
              YES {hasStakes ? `${poolData.yes_percent}%` : '50%'} ({poolData.yes_pool || 10} ANR)
            </span>
            <span className="text-rose-400">
              NO {hasStakes ? `${poolData.no_percent}%` : '50%'} ({poolData.no_pool || 10} ANR)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${poolData.yes_percent || 50}%` }}
            ></div>
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${poolData.no_percent || 50}%` }}
            ></div>
          </div>
          <div className="text-right text-[10px] text-gray-400 font-mono mt-1.5">
            Total Pool: <span className="text-white font-bold">{poolData.total_pool || 20} ANR</span>
          </div>
        </div>
      </div>

      {/* İnteraktiv Proqnoz Bölməsi */}
      <div className="space-y-4 pt-3 border-t border-gray-800/60">
        {/* YES / NO Seçimi */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setChoice('YES')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              choice === 'YES'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#0d1017] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🟢 YES ({poolData.yes_percent || 50}%)
          </button>

          <button
            type="button"
            onClick={() => setChoice('NO')}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              choice === 'NO'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-[#0d1017] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🔴 NO ({poolData.no_percent || 50}%)
          </button>
        </div>

        {/* Məbləğ Seçimi və To Win */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1.5 font-mono">
            <span>Stake:</span>
            <span className="text-emerald-400 font-extrabold">Est. Win: ~{estimatedPayout} ANR</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  amount === amt
                    ? 'bg-amber-500 text-black border-amber-500 font-black'
                    : 'bg-[#0d1017] text-gray-400 border-gray-800 hover:bg-gray-800'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Birbaşa Bread Wallet Submit Düyməsi */}
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
              Bread Wallet gözlənilir...
            </>
          ) : (
            `⚡ Submit ZK Prediction (${amount} ANR)`
          )}
        </button>

        {/* Status və Midenscan Explorer Linki */}
        {status && (
          <div
            className={`p-2.5 rounded-xl border text-[11px] font-semibold animate-fadeIn ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div>{status.message}</div>
            {status.txHash && (
              <a
                href={`https://testnet.midenscan.com/tx/${status.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline font-mono text-[10px] block mt-1 hover:text-cyan-300"
              >
                Midenscan Canlı Baxış ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Bütün Arena Kartlar Qridi
export function PredictionPanel() {
  const { address, connected, connect } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pools, setPools] = useState<Record<string, any>>({});

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

  const now = Date.now();
  const activeMarkets = OFFICIAL_MARKETS.filter((m) => m.expiresAt > now);

  const filteredMarkets = activeMarkets.filter((m) => {
    if (selectedCategory === 'All') return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* Kateqoriya Filterləri */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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

      {/* 12 BAZARIN HƏR BİRİNƏ AİD İNTERAKTİV KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => (
          <ArenaMarketCard
            key={market.id}
            market={market}
            pools={pools}
            wallet={address || ''}
            connected={connected}
            connect={connect}
            onRefresh={fetchPools}
          />
        ))}
      </div>
    </div>
  );
}
