'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Swords, 
  TrendingUp, 
  Award, 
  Trophy, 
  Coins, 
  Menu, 
  X, 
  Wallet 
} from 'lucide-react';
import { useWallet } from '@/components/wallet/wallet-provider';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Arena', href: '/arena', icon: Swords },
  { name: 'Markets', href: '/markets', icon: TrendingUp },
  { name: 'Reputation', href: '/reputation', icon: Award },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Badges', href: '/badges', icon: Award },
  { name: 'Swap & Faucet', href: '/faucet', icon: Coins },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, connected, connect } = useWallet();

  const formatAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

  return (
    <>
      {/* 📱 1. MOBİL ÜÇÜN SABİT YUXARI HEADER (Yalnız Mobildə Görünür) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0e14]/95 backdrop-blur-md border-b border-gray-800/80 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Menu"
            className="p-2 rounded-xl bg-gray-800/60 text-gray-300 hover:text-white border border-gray-700/50 active:scale-95 transition-transform"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center font-black text-black text-xs shadow-md">
              M
            </div>
            <span className="font-black text-sm tracking-wide text-white uppercase">Miden Arena</span>
          </Link>
        </div>

        <button
          onClick={() => !connected && connect()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>{connected && address ? formatAddr(address) : 'Connect'}</span>
        </button>
      </header>

      {/* 📱 2. MOBİL DRAWER OVERLAY (Arxa fon qaralması) */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 💻 3. DESKTOP & MOBİL SIDEBAR PANELİ */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0b0e14] border-r border-gray-800/80 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo & Close Button */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800/60">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-yellow-500/20">
                M
              </div>
              <div>
                <h1 className="font-black text-sm tracking-wider text-white uppercase">Miden</h1>
                <p className="text-[10px] font-bold text-yellow-400 tracking-widest uppercase">Arena zkVM</p>
              </div>
            </Link>

            {/* Mobildə Bağla Düyməsi */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white bg-gray-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigasiya Linkləri */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 🌐 Miden Rəsmi Sosial Şəbəkələr (Twitter & Telegram) */}
        <div className="p-4 border-t border-gray-800/80 bg-[#0d1117]/60 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Miden Community</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://x.com/0xmiden"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#161b22] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-[11px] font-semibold transition-all"
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
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#161b22] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-[11px] font-semibold transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current text-blue-400" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
