'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Flame, Wallet } from 'lucide-react';
import { useWallet } from '@/components/wallet/wallet-provider';

interface LeaderboardUser {
  rank: number;
  address: string;
  predictionsCount: number;
  volume: string;
  xp: number;
}

export default function LeaderboardPage() {
  const { address: connectedAddress, connected, connect } = useWallet();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const url = connectedAddress 
        ? `/api/leaderboard?address=${encodeURIComponent(connectedAddress)}&t=${Date.now()}`
        : `/api/leaderboard?t=${Date.now()}`;
      
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 4000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const isCurrentUser = (addr: string) => {
    if (!connectedAddress || !addr) return false;
    return addr.toLowerCase() === connectedAddress.toLowerCase();
  };

  const topUser = users[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2.5">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-yellow-400" />
              Global Leaderboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Live ranking of Miden Arena participants based on on-chain activity and XP
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#161b22] border border-gray-800 px-3.5 py-1.5 rounded-xl text-xs text-gray-300 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Ranking
          </div>
        </div>

        {/* Real Stats Highlight (Mobildə 1 sütun, planşet/desktopda 3 sütun) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 md:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-lg md:text-xl shrink-0">
              🥇
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Top Leader</p>
              <p className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                {topUser && topUser.xp > 0 ? formatAddress(topUser.address) : 'No Leader Yet'}
              </p>
              <p className="text-[11px] sm:text-xs text-yellow-400 font-medium">
                {topUser && topUser.xp > 0 ? `${topUser.xp} Total XP` : '0 Total XP'}
              </p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 md:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Zap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Active Traders</p>
              <p className="text-lg md:text-xl font-black text-white mt-0.5">
                {users.length} {users.length === 1 ? 'Trader' : 'Traders'}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-400">Miden Testnet</p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 md:p-5 flex items-center gap-3.5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Flame className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Arena Tokens</p>
              <p className="text-lg md:text-xl font-black text-white mt-0.5">ELA & ANR</p>
              <p className="text-[11px] sm:text-xs text-purple-400">Zero-Knowledge Proofs</p>
            </div>
          </div>
        </div>

        {/* Not Connected Banner */}
        {!connected && (
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Connect your Bread Wallet</p>
                <p className="text-[11px] sm:text-xs text-gray-400">Track your position and view your highlighted ranking.</p>
              </div>
            </div>
            <button
              onClick={() => connect()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Leaderboard Table (Mobildə sağa-sola rahat sürüşən overflow) */}
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#12161c] text-[11px] sm:text-xs font-semibold uppercase text-gray-400">
                  <th className="py-3.5 px-4 sm:px-6">Rank</th>
                  <th className="py-3.5 px-4 sm:px-6">Wallet Address</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Predictions</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Volume</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs sm:text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-300">No predictions placed yet</p>
                      <p className="text-xs text-gray-500 mt-0.5">Submit the first ZK prediction to take #1 rank!</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = isCurrentUser(u.address);
                    return (
                      <tr 
                        key={u.address}
                        className={`transition-colors duration-150 ${
                          isSelf 
                            ? 'bg-emerald-950/25 border-l-4 border-l-emerald-400 hover:bg-emerald-950/35' 
                            : 'hover:bg-gray-800/30'
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-bold">
                          {u.rank === 1 && <span className="text-base text-yellow-400">🥇 #1</span>}
                          {u.rank === 2 && <span className="text-sm text-gray-300">🥈 #2</span>}
                          {u.rank === 3 && <span className="text-sm text-amber-600">🥉 #3</span>}
                          {u.rank > 3 && <span className="text-gray-400 font-medium">#{u.rank}</span>}
                        </td>
                        
                        <td className="py-3.5 px-4 sm:px-6 font-mono flex items-center gap-2">
                          {isSelf && (
                            <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              YOU
                            </span>
                          )}
                          <span className={`${isSelf ? 'text-emerald-300 font-bold' : 'text-gray-300 font-medium'}`}>
                            {formatAddress(u.address)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-center font-semibold text-gray-300">
                          {u.predictionsCount}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-gray-200">
                          {u.volume}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-yellow-400 flex items-center justify-end gap-1">
                          <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
                          {u.xp.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
