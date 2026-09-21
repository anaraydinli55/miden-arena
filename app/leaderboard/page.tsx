'use client';

import React, { useEffect, useState } from 'react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
        <p className="text-gray-400 mt-1">Live ranking of Miden Arena participants based on XP and Volume</p>
      </div>

      <div className="bg-[#0f1319] border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#141822] text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Wallet Address</th>
                <th className="py-4 px-6">Predictions</th>
                <th className="py-4 px-6">Volume</th>
                <th className="py-4 px-6 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    {loading ? 'Loading real rankings...' : 'No activity yet. Submit a prediction in Arena to claim Rank #1!'}
                  </td>
                </tr>
              ) : (
                leaders.map((user) => (
                  <tr key={user.wallet} className="hover:bg-[#141822]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-indigo-400">#{user.rank}</td>
                    <td className="py-4 px-6 font-mono text-gray-300">
                      {user.wallet.length > 20
                        ? `${user.wallet.slice(0, 10)}...${user.wallet.slice(-8)}`
                        : user.wallet}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{user.totalBets} txs</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">{user.volume} ANR</td>
                    <td className="py-4 px-6 text-right font-bold text-white">{user.xp.toLocaleString()} XP</td>
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
