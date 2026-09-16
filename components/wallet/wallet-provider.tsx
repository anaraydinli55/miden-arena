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
    return (
      (window as any).bread ||
      (window as any).miden ||
      (window as any).midenWallet ||
      (window as any).__MIDEN_WALLET__ ||
      null
    );
  };

  useEffect(() => {
    const handleAccountSync = async () => {
      const provider = getProvider();
      if (!provider) return;

      try {
        if (provider.address) {
          setAddress(provider.address);
          setConnected(true);
        } else if (provider.publicKey) {
          setAddress(provider.publicKey);
          setConnected(true);
        }
      } catch (e) {}

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
        provider.on("disconnect", () => {
          setConnected(false);
          setAddress(null);
        });
      }
    };

    handleAccountSync();
    window.addEventListener("load", handleAccountSync);
    return () => window.removeEventListener("load", handleAccountSync);
  }, []);

  const connect = async (): Promise<string | null> => {
    setError(null);
    const provider = getProvider();

    console.log("Connect button clicked! Provider detected:", provider);

    if (!provider) {
      alert("⚠️ Bread Wallet / Miden Wallet Chrome Extension tapılmadı!\nZəhmət olmasa extension-ın brauzerdə aktiv olduğundan əmin olun.");
      return null;
    }

    try {
      let activeAcc: string | null = null;

      // Popup açan bütün mümkün Miden/Bread metodlarını yoxlayırıq:
      if (typeof provider.requestConnection === "function") {
        console.log("Triggering provider.requestConnection()...");
        const res = await provider.requestConnection();
        activeAcc = res?.address || res?.publicKey || (res?.accounts && res.accounts[0]) || null;
      } else if (typeof provider.connect === "function") {
        console.log("Triggering provider.connect()...");
        const res = await provider.connect();
        activeAcc = res?.address || (res?.accounts && res.accounts[0]) || null;
      } else if (typeof provider.request === "function") {
        console.log("Triggering provider.request(miden_requestConnection)...");
        try {
          const res = await provider.request({ method: "miden_requestConnection" });
          activeAcc = res?.address || (res?.accounts && res.accounts[0]) || null;
        } catch (e) {
          const accs = await provider.request({ method: "miden_requestAccounts" });
          activeAcc = accs?.[0] || null;
        }
      }

      if (!activeAcc && provider.address) {
        activeAcc = provider.address;
      }

      console.log("Connected account successfully retrieved:", activeAcc);

      if (activeAcc) {
        setAddress(activeAcc);
        setConnected(true);
        return activeAcc;
      } else {
        throw new Error("Cüzdandan hesab ünvanı qayıtmadı.");
      }
    } catch (e: any) {
      console.error("Connect failed:", e);
      setError(e?.message || "Cüzdan bağlantısı rədd edildi.");
    }
    return null;
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

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
