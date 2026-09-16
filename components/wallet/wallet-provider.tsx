"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
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
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0 SKS");
  const [network] = useState("Miden Testnet");
  const [error, setError] = useState<string | null>(null);

  const getProvider = () => {
    if (typeof window === "undefined") return null;
    return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
  };

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    if (typeof provider.on === "function") {
      provider.on("accountsChanged", (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setConnected(true);
        } else {
          setConnected(false);
          setAddress(null);
        }
      });
      provider.on("disconnect", () => {
        setConnected(false);
        setAddress(null);
      });
    }
  }, []);

  const connect = async () => {
    setError(null);
    const provider = getProvider();

    if (!provider) {
      alert("Bread Wallet extension brauzerinizdə tapılmadı. Zəhmət olmasa Bread Wallet Chrome Extension quraşdırın.");
      return;
    }

    try {
      let accountAddress: string | null = null;
      if (typeof provider.requestConnection === "function") {
        const res = await provider.requestConnection();
        accountAddress = res?.address || res?.publicKey || (res?.accounts && res?.accounts[0]) || null;
      } else if (typeof provider.connect === "function") {
        const res = await provider.connect();
        accountAddress = res?.address || (res?.accounts && res?.accounts[0]) || null;
      } else if (typeof provider.request === "function") {
        const accounts = await provider.request({ method: "miden_requestAccounts" });
        accountAddress = accounts?.[0] || null;
      }

      if (!accountAddress && provider.address) {
        accountAddress = provider.address;
      }

      if (accountAddress) {
        setAddress(accountAddress);
        setConnected(true);
      }
    } catch (e: any) {
      console.error("Connect error:", e);
      setError(e?.message || "Cüzdan bağlantısı rədd edildi.");
    }
  };

  const disconnect = () => {
    const provider = getProvider();
    if (provider && typeof provider.disconnect === "function") {
      try { provider.disconnect(); } catch (e) {}
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
