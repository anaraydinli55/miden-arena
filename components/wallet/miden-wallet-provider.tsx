"use client";

import {
  WalletProvider,
  WalletModalProvider,
  MidenWalletAdapter,
} from "@miden-sdk/miden-wallet-adapter";
import { useMemo, type ReactNode } from "react";

export default function MidenWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const wallets = useMemo(
    () => [new MidenWalletAdapter({ appName: "Miden Arena" })],
    []
  );

  return (
    <WalletProvider wallets={wallets}>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
}
