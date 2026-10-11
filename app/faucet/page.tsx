'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import { sendViaBread } from '@/lib/miden/bread';
import {
  ANR_LOGO_URL,
  CLAIM_TOKENS,
  ClaimTokenKey,
  FEE_FAUCET_URL,
  FEE_REQUEST_AMOUNT,
  FEE_TOKEN,
  SWAP_VAULT_CONTRACT_ID,
} from '@/lib/miden/tokens';

type Status = { type: 'success' | 'error'; message: string; txHash?: string } | null;
type SwapToken = typeof FEE_TOKEN.symbol | 'ANR';

const SWAP_FAUCETS: Record<SwapToken, { faucetId: string; decimals: number }> = {
  USDCX: { faucetId: FEE_TOKEN.faucetId, decimals: FEE_TOKEN.decimals },
  ANR: { faucetId: CLAIM_TOKENS.ANR.faucetId, decimals: CLAIM_TOKENS.ANR.decimals },
};

export default function FaucetAndSwapPage() {
  const { address, connected, connect } = useWallet();
  const [activeTab, setActiveTab] = useState<'SWAP' | 'FAUCET'>('SWAP');

  const [claiming, setClaiming] = useState<ClaimTokenKey | null>(null);
  const [claimStatus, setClaimStatus] = useState<Partial<Record<ClaimTokenKey, Status>>>({});
  const [copied, setCopied] = useState(false);

  const [fromToken, setFromToken] = useState<SwapToken>('USDCX');
  const [fromAmount, setFromAmount] = useState<string>('10');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState<Status>(null);

  const toToken: SwapToken = fromToken === 'USDCX' ? 'ANR' : 'USDCX';
  const toAmount = (Number(fromAmount) || 0).toFixed(2);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const ensureAccount = async (): Promise<string | null> => {
    let acc = address;
    if (!connected || !acc) {
      try { acc = await connect(); } catch (e) { console.error('connect hatasi', e); }
    }
    return acc || null;
  };

  const handleClaim = async (key: ClaimTokenKey) => {
    const token = CLAIM_TOKENS[key];
    setClaimStatus((s) => ({ ...s, [key]: null }));
    const acc = await ensureAccount();
    if (!acc) {
      setClaimStatus((s) => ({ ...s, [key]: { type: 'error', message: '⚠️ Zəhmət olmasa Bread Wallet-i qoşun.' } }));
      return;
    }

    setClaiming(key);
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: acc, token: token.symbol, amount: token.amount, faucetId: token.faucetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Faucet xətası (${res.status})`);

      setClaimStatus((s) => ({
        ...s,
        [key]: { type: 'success', message: `🎉 ${token.amount} ${token.symbol} note-u göndərildi. Bread Wallet-də görünməsi bir az çəkə bilər.`, txHash: data.txHash },
      }));
    } catch (err: any) {
      setClaimStatus((s) => ({ ...s, [key]: { type: 'error', message: `❌ ${err.message || 'Mint xətası'}` } }));
    } finally {
      setClaiming(null);
    }
  };

  const handleExecuteSwap = async () => {
    setSwapStatus(null);
    const acc = await ensureAccount();
    if (!acc) {
      setSwapStatus({ type: 'error', message: '⚠️ Zəhmət olmasa Bread Wallet-i qoşun.' });
      return;
    }

    setSwapLoading(true);
    try {
      const numAmount = Number(fromAmount) || 10;
      const { faucetId, decimals } = SWAP_FAUCETS[fromToken];

      const txHash = await sendViaBread({
        senderAddress: acc,
        recipientAddress: acc, // TODO: vault note mantigi netlesince vault adresi ile degistirin
        faucetId,
        amount: numAmount * 10 ** decimals,
      });

      await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: acc,
          fromToken,
          toToken,
          fromAmount: numAmount,
          toAmount: numAmount,
          tx_hash: txHash,
        }),
      }).catch((e) => console.error('/api/swap xetasi', e));

      setSwapStatus({
        type: 'success',
        message: `✅ 1:1 Vault Swap göndərildi! ${numAmount} ${fromToken} ➔ ${numAmount} ${toToken}`,
        txHash,
      });
    } catch (err: any) {
      setSwapStatus({ type: 'error', message: `❌ ${err.message || 'Swap icra olunmadı'}` });
    } finally {
      setSwapLoading(false);
    }
  };

  const StatusBox = ({ s }: { s: Status }) =>
    s ? (
      <div className={`mt-5 p-4 rounded-2xl border text-xs font-semibold ${s.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
        <div>{s.message}</div>
        {s.txHash && (
          <a href={`https://testnet.midenscan.com/tx/${s.txHash}`} target="_blank" rel="noreferrer" className="text-cyan-400 underline block mt-1 font-mono">Midenscan Baxış ↗</a>
        )}
      </div>
    ) : null;

  const TokenBadge = ({ t }: { t: SwapToken }) => (
    <div className="flex items-center gap-2 bg-[#1a202c] px-3.5 py-2 rounded-xl border border-gray-700 shrink-0 font-bold text-sm">
      {t === 'USDCX' ? '⚡ USDCX' : <><img src={ANR_LOGO_URL} className="w-4 h-4 rounded-full" alt="ANR" /> ANR</>}
    </div>
  );

  return (
    <div className="p-8 pt-10 max-w-4xl mx-auto text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Token Faucet & Swap Vault</h1>
          <p className="text-gray-400 text-sm mt-1">Official 1:1 Liquidity Vault & Gas Hub on Miden zkVM</p>
        </div>
        <div className="flex items-center bg-[#121620] border border-gray-800 rounded-2xl p-1 gap-1">
          <button onClick={() => setActiveTab('SWAP')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'SWAP' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>🔄 1:1 ZK Vault Swap</button>
          <button onClick={() => setActiveTab('FAUCET')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'FAUCET' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}>🚰 Faucet Hub</button>
        </div>
      </div>

      {activeTab === 'SWAP' && (
        <div className="bg-[#121620] border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold">1:1 Miden Vault Swap</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fixed 1:1 exchange rate for Miden Arena testers (fees paid in {FEE_TOKEN.symbol})</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              1 USDCX = 1.00 ANR
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mb-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Convert</span><span>Available in Bread Wallet</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input type="number" min="1" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none" placeholder="0" />
              <TokenBadge t={fromToken} />
            </div>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <button onClick={() => setFromToken(fromToken === 'USDCX' ? 'ANR' : 'USDCX')} className="p-2.5 rounded-xl bg-[#1a202c] hover:bg-gray-800 border border-gray-700 text-amber-400 shadow-xl transition-all active:scale-95">⇅</button>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mt-2 mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Receive in Wallet (1:1)</span><span>Slippage: 0.0%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-mono font-bold text-emerald-400">{toAmount}</div>
              <TokenBadge t={toToken} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {['1', '5', '10', '25'].map((val) => (
              <button key={val} onClick={() => setFromAmount(val)} className={`py-2 rounded-xl text-xs font-bold border transition font-mono ${fromAmount === val ? 'bg-amber-500 text-black border-amber-500 font-extrabold' : 'bg-[#0d1017] text-gray-400 border-gray-800 hover:bg-gray-800'}`}>
                {val} {fromToken}
              </button>
            ))}
          </div>

          <button disabled={swapLoading} onClick={handleExecuteSwap} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50">
            {swapLoading ? 'Bread Wallet Vault Swap icra olunur...' : `🔄 Swap ${fromAmount} ${fromToken} ➔ ${toAmount} ${toToken} (1:1)`}
          </button>

          <div className="mt-4 pt-4 border-t border-gray-800/80 text-[11px] font-mono text-gray-400">
            Vault Contract: {SWAP_VAULT_CONTRACT_ID.slice(0, 10)}...{SWAP_VAULT_CONTRACT_ID.slice(-4)}
          </div>

          <StatusBox s={swapStatus} />
        </div>
      )}

      {activeTab === 'FAUCET' && (
        <div className="space-y-6">
          <div className="bg-[#121620] border border-cyan-500/30 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">Step 1: Gas Fee Required</span>
                  <span className="text-xs font-mono text-gray-400">{FEE_REQUEST_AMOUNT} {FEE_TOKEN.symbol}</span>
                </div>
                <h3 className="text-lg font-black text-white">Official {FEE_TOKEN.symbol} Gas Faucet</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Transaction fees on Miden testnet are paid in {FEE_TOKEN.symbol}. Claim it from the official faucet first, otherwise the ANR/ELA claims below will fail.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <button onClick={handleCopyAddress} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300 transition">
                  {copied ? '✓ Cüzdan Kopyalandı' : '📋 Kopyala Address'}
                </button>
                <a href={FEE_FAUCET_URL} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20">
                  🌐 Open Official Faucet ↗
                </a>
              </div>
            </div>
          </div>

          {(Object.keys(CLAIM_TOKENS) as ClaimTokenKey[]).map((key) => {
            const t = CLAIM_TOKENS[key];
            return (
              <div key={key} className="bg-[#121620] border border-gray-800 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  {key === 'ANR' ? (
                    <img src={ANR_LOGO_URL} className="w-14 h-14 rounded-2xl object-cover border border-gray-700" alt="ANR" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl border border-gray-700 flex items-center justify-center font-black text-cyan-400">{t.symbol}</div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Step 2 ({key === 'ANR' ? 'A' : 'B'})</span>
                    <h3 className="text-xl font-black text-white">Claim {t.amount} {t.symbol} Tokens</h3>
                    <p className="text-xs text-gray-400 font-mono">Faucet ID: {t.faucetId}</p>
                  </div>
                </div>

                <button disabled={claiming !== null} onClick={() => handleClaim(key)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50">
                  {claiming === key ? 'Bread Wallet Minting in Progress...' : `🚰 Claim ${t.amount} ${t.symbol} with Bread Wallet`}
                </button>

                <StatusBox s={claimStatus[key] ?? null} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
