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
    <aside className="w-64 bg-[#0b0e14] border-r border-gray-800/80 h-screen sticky top-0 flex flex-col justify-between p-4 select-none shrink-0 z-40">
      {/* Üst Loqo və Menyu Keçidləri */}
      <div>
        <Link href="/" className="flex items-center gap-3 px-2 py-2.5 mb-5 group">
          <img
            src="/miden-arena.png"
            alt="Miden Arena Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-md shadow-amber-500/10 border border-gray-800"
          />
          <div>
            <div className="font-black text-base text-white tracking-wider leading-none">MIDEN</div>
            <div className="text-[11px] font-extrabold text-cyan-400 tracking-widest leading-tight mt-0.5">ARENA</div>
          </div>
        </Link>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
      <div className="space-y-3 pt-3 border-t border-gray-800/60">
        <div className="p-3 rounded-2xl bg-[#0f1319] border border-gray-800/80">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Wallet</div>
          
          {connected && address ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 font-mono text-xs text-emerald-400">
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

        <div className="px-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Network</div>
          <div className="text-xs font-bold text-cyan-400 mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Miden Testnet
          </div>
        </div>
      </div>
    
      {/* Miden Official Social Links */}
      <div className="pt-4 mt-auto border-t border-gray-800/80 px-3 pb-2 flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-1">Community</span>
        <div className="flex items-center gap-2">
          <a
            href="https://x.com/0xmiden"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#161b22] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>@0xmiden</span>
          </a>
          <a
            href="https://t.me/BuildOnMiden"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#161b22] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            <span>Telegram</span>
          </a>
        </div>
      </div>
  
    </aside>
  );
}

export default Sidebar;
