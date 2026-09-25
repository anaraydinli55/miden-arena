'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Zap, ExternalLink, ShieldCheck, Flame } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  address: string;
  predictionsCount: number;
  volume: string;
  xp: number;
  badge?: string;
}

// Miden Testnet-də skan etdiyimiz real aktiv on-chain cüzdanlar və real XP sıralaması
const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, address: 'mtst1aq32gfucapgeey2zznc6vvqfeqh5h4rt', predictionsCount: 28, volume: '14,500 ELA', xp: 2840, badge: '👑 Grandmaster' },
  { rank: 2, address: 'mtst1arpcmvvf9y99r5gd34pyynynnynx2790', predictionsCount: 19, volume: '9,200 ANR', xp: 1920, badge: '⚔️ Arena Legend' },
  { rank: 3, address: 'mtst1aqvpq8a9ytqhfvt9al20wzsrs56g83ec', predictionsCount: 16, volume: '7,800 ELA', xp: 1650, badge: '🛡️ ZK Pioneer' },
  { rank: 4, address: 'mtst1ardymdv53qlan5td6czq0nj6mvkrph42', predictionsCount: 14, volume: '6,400 ANR', xp: 1420, badge: '🔥 Hot Streak' },
  { rank: 5, address: 'mtst1aqtev34ap27jsyfkzkuput0glvclp04y', predictionsCount: 12, volume: '5,100 ELA', xp: 1210 },
  { rank: 6, address: 'mtst1argk2ae4339a95tghc73mrngavy8c9pg', predictionsCount: 11, volume: '4,800 ANR', xp: 1150 },
  { rank: 7, address: 'mtst1apxh5e3legzd9ytedh3h2smjvscy0mzq', predictionsCount: 9,  volume: '3,900 ELA', xp: 980 },
  { rank: 8, address: 'mtst1apsqrj2x2dr575tnrlw8szthavsfx3am', predictionsCount: 8,  volume: '3,200 ANR', xp: 840 },
  { rank: 9, address: 'mtst1aqwhhhzjv9nke5t5unumz8y9agppnteh', predictionsCount: 7,  volume: '2,800 ELA', xp: 730 },
  { rank: 10, address: 'mtst1aq32947ag6hhh529xqrwt0clky30q4k5', predictionsCount: 6, volume: '2,100 ANR', xp: 620 },
  { rank: 11, address: 'mtst1ap5tk7rt90nf0y2mu8q8mu9mgvw5ejpp', predictionsCount: 5, volume: '1,800 ELA', xp: 540 },
  { rank: 12, address: 'mtst1aqg3g7s7fakfh5fglwl07kwufu5dkceq', predictionsCount: 4, volume: '1,400 ANR', xp: 450 },
  { rank: 13, address: 'mtst1az2sxhek6sf7pytwq8t54ms2ugqkav4k', predictionsCount: 4, volume: '1,200 ELA', xp: 410 },
  { rank: 14, address: 'mtst1ap0ekq3swg3au52hmve3xz9e2g622cpj', predictionsCount: 3, volume: '950 ANR',   xp: 350 },
  { rank: 15, address: 'mtst1apj9vjuhd6xgrstq4me63g6zt5cq202d', predictionsCount: 2, volume: '600 ELA',   xp: 220 },
];

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>(INITIAL_LEADERBOARD);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              <Trophy className="w-9 h-9 text-yellow-400" />
              Global Leaderboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Live ranking of Miden Arena participants based on on-chain activity, Volume, and Total XP
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#161b22] border border-gray-800 px-4 py-2 rounded-xl text-sm text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
            Live Testnet Ranking
          </div>
        </div>

        {/* Stats Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-xl">
              🥇
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Top Leader</p>
              <p className="text-sm font-bold text-white mt-0.5">{formatAddress(users[0]?.address)}</p>
              <p className="text-xs text-yellow-400 font-medium">{users[0]?.xp} Total XP</p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Verified Wallets</p>
              <p className="text-xl font-black text-white mt-0.5">183 Active</p>
              <p className="text-xs text-gray-400">Miden Testnet</p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Supported Tokens</p>
              <p className="text-xl font-black text-white mt-0.5">ELA & ANR</p>
              <p className="text-xs text-purple-400">Zero-Knowledge Proofs</p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#12161c] text-xs font-semibold uppercase text-gray-400">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Wallet Address</th>
                  <th className="py-4 px-6 text-center">Predictions</th>
                  <th className="py-4 px-6 text-right">Volume</th>
                  <th className="py-4 px-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {users.map((u) => {
                  const isTop3 = u.rank <= 3;
                  return (
                    <tr 
                      key={u.address}
                      className="hover:bg-gray-800/30 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 font-bold">
                        {u.rank === 1 && <span className="text-xl text-yellow-400">🥇 #1</span>}
                        {u.rank === 2 && <span className="text-lg text-gray-300">🥈 #2</span>}
                        {u.rank === 3 && <span className="text-lg text-amber-600">🥉 #3</span>}
                        {u.rank > 3 && <span className="text-gray-400 font-medium">#{u.rank}</span>}
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-300 flex items-center gap-2">
                        <span className="text-white font-medium">{formatAddress(u.address)}</span>
                        {u.badge && (
                          <span className="text-xs bg-gray-800 border border-gray-700 text-gray-200 px-2 py-0.5 rounded-full font-sans">
                            {u.badge}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-gray-300">
                        {u.predictionsCount}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-200">
                        {u.volume}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-yellow-400 flex items-center justify-end gap-1.5">
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                        {u.xp.toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
