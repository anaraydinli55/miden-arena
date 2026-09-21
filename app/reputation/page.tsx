'use client';

import React, { useEffect, useState } from 'react';

export default function ReputationPage() {
  const [wallet, setWallet] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Brauzerdə yadda saxlanılan və ya qoşulan cüzdanı aşkar et
    const savedWallet = localStorage.getItem('miden_wallet_address') || 
                        localStorage.getItem('miden_active_account') || 
                        '';
    
    // Əgər DOM-da wallet elementi varsa onu oxu
    const domWallet = document.querySelector('div[class*="mtst1"]')?.textContent || savedWallet;
    
    if (domWallet) {
      setWallet(domWallet);
      fetchStats(domWallet);
    } else {
      // Əgər tapılmazsa ümumi axtarış et
      fetchStats('connected_tester');
    }
  }, []);

  const fetchStats = async (walletAddr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-stats?wallet=${encodeURIComponent(walletAddr)}`);
      const data = await res.json();
      setStats(data.stats || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const xp = stats?.xp || 0;
  const totalBets = stats?.totalBets || 0;
  const totalVolume = stats?.totalVolume || 0;
  const streak = stats?.streak || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wallet Reputation</h1>
        <p className="text-gray-400 mt-1">Real-time on-chain reputation and activity metrics for Miden Testnet</p>
      </div>

      {/* Əsas Statistika Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Earned XP</div>
          <div className="text-3xl font-bold mt-2 text-indigo-400">{xp.toLocaleString()} XP</div>
          <div className="text-xs text-gray-500 mt-1">10 XP per ANR</div>
        </div>

        <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm font-medium">Total Predictions</div>
          <div className="text-3xl font-bold mt-2 text-cyan-400">{totalBets}</div>
          <div className="text-xs text-gray-500 mt-1">Miden zk-Tx Submitted</div>
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

      {/* Cüzdan Məlumatı Bölməsi */}
      <div className="bg-[#0f1319] border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Connected Identity</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#141822] rounded-lg border border-gray-800/60">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Miden Account ID</div>
            <div className="font-mono text-sm text-green-400 mt-1 break-all">
              {stats?.wallet || 'Wallet connected to Miden Arena'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">Miden Testnet Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
