'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export default function ReputationPage() {
  const { accountId } = useWallet();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeWallet = accountId || (typeof window !== 'undefined' ? localStorage.getItem('miden_account_id') : '') || 'mtst1_default_tester';

  const loadData = async () => {
    try {
      const res = await fetch(`/api/user-stats?wallet=${encodeURIComponent(activeWallet)}`);
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
    const interval = setInterval(loadData, 5000); // Hər 5 saniyədən bir digər cihazlardakı tx-ləri də yoxlayır
    return () => clearInterval(interval);
  }, [activeWallet]);

  const xp = stats?.xp || 0;
  const totalBets = stats?.totalBets || history.length;
  const totalVolume = stats?.totalVolume || 0;
  const streak = stats?.streak || (totalBets > 0 ? 1 : 0);

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wallet Reputation & Activity</h1>
        <p className="text-gray-400 mt-1">Cross-device on-chain activity synced globally via Polygon Miden</p>
      </div>

      {/* Statistika Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Earned XP</div>
          <div className="text-3xl font-bold mt-2 text-indigo-400">{xp.toLocaleString()} XP</div>
          <div className="text-xs text-gray-500 mt-1">10 XP per ANR</div>
        </div>

        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Total Predictions</div>
          <div className="text-3xl font-bold mt-2 text-cyan-400">{totalBets}</div>
          <div className="text-xs text-gray-500 mt-1">All devices synced</div>
        </div>

        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Total Volume</div>
          <div className="text-3xl font-bold mt-2 text-emerald-400">{totalVolume} ANR</div>
          <div className="text-xs text-gray-500 mt-1">Staked in markets</div>
        </div>

        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Active Streak</div>
          <div className="text-3xl font-bold mt-2 text-amber-400">{streak > 0 ? `${streak} Days` : '0 Days'}</div>
          <div className="text-xs text-gray-500 mt-1">Testnet interaction</div>
        </div>
      </div>

      {/* Cüzdan İdentifikasiyası */}
      <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Connected Identity</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#141822] rounded-lg border border-gray-800/60">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Miden Account ID</div>
            <div className="font-mono text-sm text-green-400 mt-1 break-all">
              {activeWallet}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">Global Cloud Synced</span>
          </div>
        </div>
      </div>

      {/* Canlı Bütün Cihazların Tranzaksiya Tarixçəsi */}
      <div className="bg-[#0f1319] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold">On-Chain Prediction & Tx History</h2>
          <p className="text-gray-400 text-xs mt-1">Live log of all smart contract executions across any connected device</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#141822] text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action / Choice</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Transaction ID (zk-Proof)</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm font-mono">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 font-sans">
                    {loading ? 'Fetching cross-device history...' : 'No transactions recorded yet for this wallet. Place a bet in Arena!'}
                  </td>
                </tr>
              ) : (
                history.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-[#141822]/50 transition-colors">
                    <td className="py-4 px-6 text-gray-400 text-xs font-sans">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        tx.choice === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tx.choice}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white font-sans font-medium">{tx.amount} ANR</td>
                    <td className="py-4 px-6 text-indigo-400 text-xs">
                      {tx.tx_hash.length > 22 ? `${tx.tx_hash.slice(0, 12)}...${tx.tx_hash.slice(-8)}` : tx.tx_hash}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
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
