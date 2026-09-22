'use client';

import React, { useState, useEffect } from 'react';
import { OFFICIAL_MARKETS, MarketMeta } from '@/lib/markets';

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pools, setPools] = useState<Record<string, any>>({});
  const [wallet, setWallet] = useState<string>('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cüzdanı oxu
  useEffect(() => {
    const checkWallet = () => {
      if (typeof document !== 'undefined') {
        const text = document.body.innerText;
        const match = text.match(/mtst1[a-zA-Z0-9_.]{3,35}/i);
        if (match) setWallet(match[0]);
      }
    };
    checkWallet();
    const timer = setInterval(checkWallet, 1500);
    return () => clearInterval(timer);
  }, []);

  // Canlı real hovuzları gətir
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

  // Proqnoz etmək
  const handleBet = async (market: MarketMeta, choice: 'YES' | 'NO') => {
    if (!wallet) {
      setMessage({ text: '⚠️ Please connect your Miden wallet from the sidebar first.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    setSubmittingId(market.id);
    setMessage(null);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: market.id,
          choice,
          amount: 10,
          wallet_address: wallet,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPools((prev) => ({ ...prev, [market.id]: data.state }));
        setMessage({ text: `✓ Successfully staked 10 ANR on "${choice}" for this market!`, type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ text: `❌ ${data.error || 'Failed to submit'}`, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '❌ Network error', type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  // Müddəti bitmişləri avtomatik gizlət
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
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* Başlıq */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Live Markets</h1>
          <p className="text-gray-400 text-sm mt-1">
            Zero-Knowledge prediction markets running on Polygon Miden zkVM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-bold">
            ● {filteredMarkets.length} Active zk-Markets
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center justify-between animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{message.text}</span>
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

      {/* Real Bazarlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => {
          const poolData = pools[market.id] || {
            total_pool: 0,
            yes_pool: 0,
            no_pool: 0,
            yes_percent: 0,
            no_percent: 0,
          };

          const isSubmitting = submittingId === market.id;
          const hasStakes = (poolData.total_pool || 0) > 0;

          return (
            <div
              key={market.id}
              className="bg-[#121620] border border-gray-800/80 hover:border-gray-700 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/5 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
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

                {/* Real Hovuz və Vaxt */}
                <div className="flex items-center justify-between text-xs text-gray-400 py-3 px-3.5 rounded-xl bg-[#0d1017] border border-gray-800/60 mb-5 font-mono">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span>📊 {poolData.total_pool} {market.tokenSymbol}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                    <span>⏱ {formatTimeLeft(market.expiresAt)}</span>
                  </div>
                </div>
              </div>

              {/* Faiz Barı və Düymələr */}
              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1.5 font-mono">
                    <span className="text-emerald-400">
                      YES {hasStakes ? `${poolData.yes_percent}%` : '0%'} ({poolData.yes_pool} ANR)
                    </span>
                    <span className="text-rose-400">
                      NO {hasStakes ? `${poolData.no_percent}%` : '0%'} ({poolData.no_pool} ANR)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden flex">
                    {hasStakes ? (
                      <>
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${poolData.yes_percent}%` }}
                        ></div>
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${poolData.no_percent}%` }}
                        ></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-800"></div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleBet(market, 'YES')}
                    className="py-2.5 px-4 rounded-xl bg-[#e07a1e] hover:bg-[#c96914] text-white text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isSubmitting ? '...' : 'Yes (+10 ANR)'}
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleBet(market, 'NO')}
                    className="py-2.5 px-4 rounded-xl bg-[#1a202c] hover:bg-gray-800 text-gray-200 border border-gray-700 text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isSubmitting ? '...' : 'No (+10 ANR)'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
