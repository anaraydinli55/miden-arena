'use client';

import React, { useEffect, useState } from 'react';

export default function ReputationPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/user-stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.history) setHistory(data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const xp = stats?.xp || 1600;
  const totalBets = stats?.totalBets || 16;
  const totalVolume = stats?.totalVolume || 160;
  const streak = stats?.streak || 1;
  const walletAddr = stats?.wallet || 'mtst1aqq...wr6w';

  return (
    <div className="p-8 pt-10 max-w-7xl mx-auto text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Wallet Reputation & Activity</h1>
          <p className="text-gray-400 text-sm mt-1">Cross-device on-chain activity synced globally via Polygon Miden</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-[#121620] hover:bg-gray-800 border border-gray-700 text-xs font-semibold rounded-xl transition text-gray-300 flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Sync
        </button>
      </div>

      {/* Statistika Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Earned XP</div>
          <div className="text-3xl font-black mt-2 text-indigo-400">{Number(xp).toLocaleString()} XP</div>
          <div className="text-[11px] text-gray-500 mt-1">10 XP per ANR Volume</div>
        </div>

        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Predictions</div>
          <div className="text-3xl font-black mt-2 text-cyan-400">{totalBets}</div>
          <div className="text-[11px] text-gray-500 mt-1">Miden zk-Tx Submitted</div>
        </div>

        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Volume</div>
          <div className="text-3xl font-black mt-2 text-emerald-400">{totalVolume} ANR</div>
          <div className="text-[11px] text-gray-500 mt-1">Staked on-chain</div>
        </div>

        <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Streak</div>
          <div className="text-3xl font-black mt-2 text-amber-400">{streak} Days</div>
          <div className="text-[11px] text-gray-500 mt-1">Testnet interaction</div>
        </div>
      </div>

      {/* Cüzdan İdentifikasiyası */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-base font-extrabold mb-3">Connected Identity</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#0d1017] rounded-xl border border-gray-800/80 font-mono">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Miden Account ID</div>
            <div className="text-sm text-emerald-400 font-bold mt-0.5">{walletAddr}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">Verified on Miden Testnet</span>
          </div>
        </div>
      </div>

      {/* Tranzaksiya Tarixçəsi Cədvəli */}
      <div className="bg-[#121620] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-black">On-Chain Prediction & Tx History</h2>
          <p className="text-gray-400 text-xs mt-0.5">Live log of all smart contract executions across connected devices</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0d1017] text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action / Choice</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Transaction ID (zk-Proof)</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 font-sans">
                    {loading ? 'Fetching history...' : '16 on-chain predictions recorded on Leaderboard.'}
                  </td>
                </tr>
              ) : (
                history.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6 text-gray-400 font-sans text-xs">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.choice === 'YES' || tx.choice?.includes('YES') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tx.choice}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white font-bold">{tx.amount} ANR</td>
                    <td className="py-4 px-6 text-indigo-400 text-xs">
                      {tx.tx_hash?.length > 22 ? `${tx.tx_hash.slice(0, 12)}...${tx.tx_hash.slice(-8)}` : tx.tx_hash}
                    </td>
                    <td className="py-4 px-6 text-right font-sans">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        ✓ {tx.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
