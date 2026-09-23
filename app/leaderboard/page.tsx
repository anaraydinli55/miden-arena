'use client';

import React, { useEffect, useState } from 'react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    fetch(`/api/leaderboard?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 pt-10 max-w-7xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Global Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-1">Live ranking of Miden Arena participants based on XP and Volume</p>
      </div>

      <div className="bg-[#121620] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0d1017] text-gray-400 text-xs font-mono uppercase tracking-wider">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Wallet Address</th>
                <th className="py-4 px-6">Predictions</th>
                <th className="py-4 px-6">Volume</th>
                <th className="py-4 px-6 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm font-mono">
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 font-sans">
                    {loading ? 'Loading rankings...' : 'No activity yet.'}
                  </td>
                </tr>
              ) : (
                leaders.map((user) => (
                  <tr key={user.rawWallet} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-bold text-amber-400">#{user.rank}</td>
                    <td className="py-4 px-6 text-gray-200 font-semibold">
                      {user.wallet}
                    </td>
                    <td className="py-4 px-6 text-cyan-400 font-medium">{user.totalBets} txs</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">{user.volume} ANR</td>
                    <td className="py-4 px-6 text-right font-black text-white">{Number(user.xp).toLocaleString()} XP</td>
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
