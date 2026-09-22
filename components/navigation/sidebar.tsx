'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/components/wallet/wallet-provider';

export function Sidebar() {
  const pathname = usePathname();
  const { address, connected, connect, disconnect } = useWallet();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '⊞' },
    { name: 'Arena', href: '/arena', icon: '🏆' },
    { name: 'Markets', href: '/markets', icon: '📊' },
    { name: 'Reputation', href: '/reputation', icon: '👤' },
    { name: 'Leaderboard', href: '/leaderboard', icon: '🥇' },
    { name: 'Badges', href: '/badges', icon: '🎖️' },
    { name: 'Swap & Faucet', href: '/faucet', icon: '🔄' },
  ];

  return (
    <aside className="w-64 bg-[#0b0e14] border-r border-gray-800/80 min-h-screen flex flex-col justify-between p-4 select-none shrink-0">
      {/* Üst Loqo */}
      <div>
        <Link href="/" className="flex items-center gap-3 px-2 py-3 mb-6 group">
          <img
            src="/miden-arena.png"
            alt="Miden Arena Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-amber-500/10 border border-gray-800"
          />
          <div>
            <div className="font-black text-base text-white tracking-wider leading-none">MIDEN</div>
            <div className="text-[11px] font-extrabold text-cyan-400 tracking-widest leading-tight mt-0.5">ARENA</div>
          </div>
        </Link>

        {/* Menyu Keçidləri */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#141822] text-white border border-gray-800 shadow-md shadow-black/40'
                    : 'text-gray-400 hover:text-white hover:bg-[#121620]/60'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Aşağı Cüzdan və Şəbəkə Bölməsi */}
      <div className="space-y-3 pt-4 border-t border-gray-800/60">
        <div className="p-3.5 rounded-2xl bg-[#0f1319] border border-gray-800/80">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Wallet</div>
          
          {connected && address ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 font-mono text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="truncate">
                  {address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-4)}` : address}
                </span>
              </div>
              <button
                onClick={() => disconnect?.()}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition shrink-0"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect?.()}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Şəbəkə */}
        <div className="px-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Network</div>
          <div className="text-xs font-bold text-cyan-400 mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Miden Testnet
          </div>
        </div>
      </div>
    </aside>
  );
}
