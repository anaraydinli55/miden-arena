"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WalletContextType = {
  connected: boolean;
  address: string | null;
  balance: string;
  network: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // F5 basanda hemise qosulmamis baslayir
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0 SKS");
  const [network] = useState("Miden Testnet");
  const [error, setError] = useState<string | null>(null);

  const getProvider = () => {
    if (typeof window === "undefined") return null;
    return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
  };

  const connect = async () => {
    setError(null);
    const provider = getProvider();

    if (!provider) {
      const msg = "Bread / Miden Wallet extension tapılmadı.";
      setError(msg);
      alert(msg);
      return;
    }

    try {
      let accountAddress: string | null = null;

      if (typeof provider.requestConnection === "function") {
        const res = await provider.requestConnection();
        accountAddress = res?.address || res?.publicKey || provider.address || null;
      } else if (typeof provider.connect === "function") {
        const res = await provider.connect();
        accountAddress = res?.address || res?.accounts?.[0] || provider.address || null;
      } else if (typeof provider.request === "function") {
        const accounts = await provider.request({ method: "miden_requestAccounts" });
        accountAddress = accounts?.[0] || null;
      }

      if (!accountAddress && provider.address) {
        accountAddress = provider.address;
      }

      if (!accountAddress) {
        throw new Error("Cüzdandan hesab seçilmədi.");
      }

      setAddress(accountAddress);
      setConnected(true);
      setError(null);
    } catch (err: any) {
      console.error("Connection error:", err);
      setConnected(false);
      setAddress(null);
      setError(err?.message || "Bağlantı xətası");
    }
  };

  const disconnect = () => {
    const provider = getProvider();
    if (provider && typeof provider.disconnect === "function") {
      try {
        provider.disconnect();
      } catch (e) {}
    }
    setConnected(false);
    setAddress(null);
  };

  const value = useMemo(
    () => ({
      connected,
      address,
      balance,
      network,
      error,
      connect,
      disconnect,
    }),
    [connected, address, balance, network, error]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
