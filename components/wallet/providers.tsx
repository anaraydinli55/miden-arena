"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ClientProviders = dynamic(
  () =>
    import("@miden-sdk/miden-wallet-adapter").then((mod) => {
      const { WalletProvider, WalletModalProvider } = mod;
      return import("@miden-sdk/miden-wallet-adapter-miden").then((midenMod) => {
        const { MidenWalletAdapter } = midenMod;
        return function RealProviders({ children }: { children: ReactNode }) {
          // localStorage-deki zedelenmis "undefined" stringini temizleyirik
          if (typeof window !== "undefined") {
            try {
              for (const key of Object.keys(localStorage)) {
                if (localStorage.getItem(key) === "undefined") {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {}
          }

          const wallets = [new MidenWalletAdapter({ appName: "Miden Arena" })];
          return (
            <WalletProvider wallets={wallets} autoConnect={false}>
              <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
          );
        };
      });
    }),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
