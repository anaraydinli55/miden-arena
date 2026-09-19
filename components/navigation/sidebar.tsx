"use client";

import Link from "next/link";
import {
  Trophy,
  LayoutDashboard,
  BarChart3,
  User,
  Award,
} from "lucide-react";
import ConnectWallet from "@/components/wallet/connect-wallet";

const LOGO_URL = "https://raw.githubusercontent.com/anaraydinli55/miden-arena/main/Gemini_Generated_Image_sa45oasa45oasa45.jpg";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/arena",
    label: "Arena",
    icon: Trophy,
  },
  {
    href: "/markets",
    label: "Markets",
    icon: BarChart3,
  },
  {
    href: "/reputation",
    label: "Reputation",
    icon: User,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
  },
  {
    href: "/badges",
    label: "Badges",
    icon: Award,
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#08090d]">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <img
          src={LOGO_URL}
          alt="Miden Arena Logo"
          className="h-10 w-10 rounded-xl object-cover border border-cyan-400/40 shadow-md shadow-cyan-500/20"
        />
        <div>
          <div className="text-lg font-bold tracking-wider text-white">
            MIDEN
          </div>
          <div className="text-xs font-semibold tracking-[0.3em] text-cyan-400">
            ARENA
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
            Wallet
          </div>
          <ConnectWallet />
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-[10px] text-gray-500">NETWORK</div>
          <div className="mt-1 text-xs text-cyan-400">
            Miden Testnet
          </div>
        </div>
      </div>
    </aside>
  );
}
