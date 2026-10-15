'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import {
  ANR_LOGO_URL,
  CLAIM_TOKENS,
  ClaimTokenKey,
  FEE_FAUCET_URL,
  FEE_REQUEST_AMOUNT,
  FEE_TOKEN,
} from '@/lib/miden/tokens';

type Status = { type: 'success' | 'error'; message: string; txHash?: string } | null;

export default function FaucetPage() {
  const { address, connected, connect } = useWallet();
  const [claiming, setClaiming] = useState<ClaimTokenKey | null>(null);
  const [claimStatus, setClaimStatus] = useState<Partial<Record<ClaimTokenKey, Status>>>({});
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClaim = async (key: ClaimTokenKey) => {
    const token = CLAIM_TOKENS[key];
    setClaimStatus((s) => ({ ...s, [key]: null }));

    let acc = address;
    if (!connected || !acc) {
      try {
        acc = await connect();
      } catch (e) {
        console.error('connect failed', e);
      }
    }
    if (!acc) {
      setClaimStatus((s) => ({
        ...s,
        [key]: { type: 'error', message: 'Please connect Bread Wallet from the left menu.' },
      }));
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
      if (!res.ok) throw new Error(data?.error || `Faucet error (${res.status})`);

      setClaimStatus((s) => ({
        ...s,
        [key]: {
          type: 'success',
          message: `${token.amount} ${token.symbol} sent. It should show up in Bread Wallet within a minute or two.`,
          txHash: data.txHash,
        },
      }));
    } catch (err: any) {
      setClaimStatus((s) => ({ ...s, [key]: { type: 'error', message: err.message || 'Mint failed' } }));
    } finally {
      setClaiming(null);
    }
  };

  const StatusBox = ({ s }: { s: Status }) =>
    s ? (
      <div
        className={`mt-5 p-4 rounded-2xl border text-xs font-semibold ${
          s.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}
      >
        <div>{s.message}</div>
        {s.txHash && (
          <a
            href={`https://testnet.midenscan.com/tx/${s.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 underline block mt-1 font-mono"
          >
            View on Midenscan ↗
          </a>
        )}
      </div>
    ) : null;

  return (
    <div className="p-8 pt-10 max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Token Faucet</h1>
        <p className="text-gray-400 text-sm mt-1">
          Free testnet tokens for Miden Arena, sent as notes to your Bread Wallet
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#121620] border border-cyan-500/30 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                  Step 1: Network fee token
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {FEE_REQUEST_AMOUNT} {FEE_TOKEN.symbol}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">Official {FEE_TOKEN.symbol} faucet</h3>
              <p className="text-xs text-gray-400 mt-1">
                Transaction fees on Miden testnet are paid in {FEE_TOKEN.symbol}. Get some from the official faucet
                first, otherwise your wallet may not be able to collect the tokens below.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button
                onClick={handleCopyAddress}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300 transition"
              >
                {copied ? 'Copied ✓' : '📋 Copy address'}
              </button>
              <a
                href={FEE_FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                🌐 Open official faucet ↗
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
                  <div className="w-14 h-14 rounded-2xl border border-gray-700 flex items-center justify-center font-black text-cyan-400">
                    {t.symbol}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Step 2: Arena token</span>
                  <h3 className="text-xl font-black text-white">
                    Claim {t.amount} {t.symbol}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">Faucet ID: {t.faucetId}</p>
                </div>
              </div>

              <button
                disabled={claiming !== null}
                onClick={() => handleClaim(key)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {claiming === key ? 'Minting...' : `🚰 Claim ${t.amount} ${t.symbol}`}
              </button>

              <StatusBox s={claimStatus[key] ?? null} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
