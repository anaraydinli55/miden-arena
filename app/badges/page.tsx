'use client';

import React, { useEffect, useState } from 'react';

export default function BadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBadges = () => {
    fetch(`/api/user-stats?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.badges) setBadges(data.badges);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBadges();
    const interval = setInterval(loadBadges, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Achievements & Badges</h1>
        <p className="text-gray-400 mt-1">Unlock milestone badges by submitting predictions on Polygon Miden zkVM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((badge) => {
          const progressPercent = Math.min(Math.round((badge.current / badge.target) * 100), 100);

          return (
            <div
              key={badge.id}
              className={`border rounded-xl p-6 flex flex-col justify-between transition-all ${
                badge.unlocked
                  ? 'bg-[#0f1319] border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'bg-[#0b0e14] border-gray-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl p-2 rounded-xl bg-gray-800/50">
                    {badge.icon}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${
                      badge.unlocked
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {badge.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white">{badge.title}</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{badge.desc}</p>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-mono">
                  <span>Progress</span>
                  <span className={badge.unlocked ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                    {badge.current} / {badge.target} txs
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      badge.unlocked ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
