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
  connect: () => Promise<string | null>;
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

  const getActiveAccount = async () => {
    const provider = getProvider();
    if (!provider) return null;

    try {
      if (typeof provider.request === "function") {
        const accs = await provider.request({ method: "miden_accounts" }).catch(() => null);
        if (accs && accs.length > 0) return accs[0]?.address || accs[0];
      }
      if (typeof provider.requestConnection === "function") {
        const conn = await provider.requestConnection().catch(() => null);
        return conn?.address || conn?.publicKey || (conn?.accounts && conn.accounts[0]) || null;
      }
      if (provider.address) return provider.address;
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    getActiveAccount().then((acc) => {
      if (acc) {
        setAddress(acc);
        setConnected(true);
      }
    });

    if (typeof provider.on === "function") {
      provider.on("accountsChanged", (accounts: any[]) => {
        if (accounts && accounts.length > 0) {
          const acc = typeof accounts[0] === "string" ? accounts[0] : accounts[0]?.address || accounts[0]?.id;
          setAddress(acc);
          setConnected(true);
        } else {
          setConnected(false);
          setAddress(null);
        }
      });
    }
  }, []);

  const connect = async (): Promise<string | null> => {
    setError(null);
    const provider = getProvider();

    if (!provider) {
      alert("Bread Wallet extension brauzerdə tapılmadı!");
      return null;
    }

    try {
      let activeAcc: string | null = null;
      if (typeof provider.requestConnection === "function") {
        const res = await provider.requestConnection();
        activeAcc = res?.address || res?.publicKey || (res?.accounts && res.accounts[0]) || null;
      } else if (typeof provider.request === "function") {
        const res = await provider.request({ method: "miden_requestAccounts" });
        activeAcc = res?.[0] || null;
      }

      if (!activeAcc && provider.address) {
        activeAcc = provider.address;
      }

      if (activeAcc) {
        setAddress(activeAcc);
        setConnected(true);
        return activeAcc;
      }
    } catch (e: any) {
      console.error("Connect error:", e);
      setError(e?.message || "Cüzdan bağlantısı rədd edildi.");
    }
    return null;
  };

  const disconnect = () => {
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

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
