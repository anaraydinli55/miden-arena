"use client";

import { useState } from "react";

function getProvider(): any {
  if (typeof window === "undefined") return null;
  return (
    (window as any).bread ||
    (window as any).miden ||
    (window as any).midenWallet ||
    null
  );
}

export function DeployMarketAccount() {
  const [status, setStatus] = useState<string | null>(null);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setStatus(null);
    setNewAccountId(null);

    const provider = getProvider();
    if (!provider) {
      setStatus("❌ Bread Wallet extension tapılmadı. Əvvəlcə cüzdanı qoşun.");
      return;
    }

    setLoading(true);
    setStatus("🍞 Bread Wallet-də yeni hesab yaratma pəncərəsi açılır...");

    try {
      let result: any = null;

      if (typeof provider.createAccount === "function") {
        result = await provider.createAccount({
          accountType: "RegularAccountImmutableCode",
          storageMode: "public",
        });
      } else if (typeof provider.request === "function") {
        result = await provider.request({
          method: "miden_createAccount",
          params: [{ accountType: "RegularAccountImmutableCode", storageMode: "public" }],
        });
      } else {
        throw new Error("Bu cüzdan versiyasında createAccount metodu tapılmadı.");
      }

      console.log("createAccount raw result:", result);

      const accountId: string | undefined =
        typeof result === "string" ? result : result?.accountId || result?.id || result?.address;

      if (!accountId) {
        throw new Error("Cüzdan accountId qaytarmadı.");
      }

      console.log("Yeni real market hesabı yaradıldı:", accountId);
      setNewAccountId(accountId);
      setStatus("✅ Hesab zəncirdə uğurla yaradıldı! Aşağıdakı ID-ni kopyalayın:");
    } catch (e: any) {
      console.error("createAccount failed:", e);
      setStatus(`❌ Xəta: ${e?.message || "Hesab yaradılmadı."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
      <div className="text-xs font-bold text-amber-300">
        ⚡ Bir Dəfəlik Alət: Real On-Chain Market Hesabı Yarat
      </div>
      <p className="text-[11px] text-white/60">
        Bu düymə Bread Wallet vasitəsilə Miden Testnet-də həqiqi on-chain hesab yaradacaq.
      </p>

      <button
        onClick={handleCreate}
        disabled={loading}
        type="button"
        className="w-full cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:opacity-90 active:scale-95 disabled:opacity-50"
      >
        {loading ? "⏳ Bread Wallet-dən 'Confirm' Gözlənilir..." : "🚀 Yeni Market Hesabı Yarat"}
      </button>

      {status && <div className="text-xs text-white/80">{status}</div>}

      {newAccountId && (
        <div className="mt-2 rounded-lg border border-emerald-500/30 bg-black/60 p-2 font-mono text-xs text-emerald-300 break-all select-all">
          {newAccountId}
        </div>
      )}
    </div>
  );
}
