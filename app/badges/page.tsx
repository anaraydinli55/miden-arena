'use client';

import React, { useEffect, useState } from 'react';

export default function BadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.badges) setBadges(data.badges);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Achievements & Badges</h1>
        <p className="text-gray-400 mt-1">Unlock badges by interacting with Miden zkVM smart contracts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`border rounded-xl p-6 transition-all ${
              badge.unlocked
                ? 'bg-[#0f1319] border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'bg-[#0b0e14] border-gray-800/50 opacity-50 grayscale'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${badge.unlocked ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>
                🏆
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  badge.unlocked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {badge.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
              </span>
            </div>

            <h3 className="font-bold text-lg">{badge.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
