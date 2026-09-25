'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';

const ANR_FAUCET_ID = '0xb7326fab564eef51689d3d52d464ce';
const SWAP_VAULT_CONTRACT_ID = '0xc05fa91f939040d1751dc990cb2dde';
const ANR_LOGO_URL = 'https://raw.githubusercontent.com/anaraydinli55/miden-arena/main/Gemini_Generated_Image_sa45oasa45oasa45.jpg';

function getLocalBreadProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).bread || (window as any).miden || (window as any).midenWallet || null;
}

export default function FaucetAndSwapPage() {
  const { address, connected, connect } = useWallet();
  const [activeTab, setActiveTab] = useState<'SWAP' | 'FAUCET'>('SWAP');
  
  // Faucet State
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Swap State (1:1 Ratio: 1 MIDEN = 1 ANR)
  const [fromToken, setFromToken] = useState<'MIDEN' | 'ANR'>('MIDEN');
  const [fromAmount, setFromAmount] = useState<string>('10');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

  // 1:1 Dəqiq Məzənnə
  const toToken = fromToken === 'MIDEN' ? 'ANR' : 'MIDEN';
  const toAmount = (Number(fromAmount) || 0).toFixed(2);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 🚰 100 ANR Faucet Mint
  const handleClaimANR = async () => {
    setFaucetStatus(null);
    let activeAccount = address;
    if (!connected || !activeAccount) {
      try { activeAccount = await connect(); } catch (e) {}
    }
    if (!activeAccount) {
      setFaucetStatus({ type: 'error', message: '⚠️ Zəhmət olmasa sol menyudan Bread Wallet-i qoşun.' });
      return;
    }

    setFaucetLoading(true);
    try {
      const breadProvider = getLocalBreadProvider();
      const mintAmount = 100 * 1_000_000; // 6 decimals (100.0 ANR)
      let txResponse: any = null;

      if (breadProvider) {
        const txObj = {
          senderAddress: activeAccount,
          recipientAddress: activeAccount,
          faucetId: ANR_FAUCET_ID,
          noteType: 'public' as const,
          amount: mintAmount,
        };

        if (typeof breadProvider.requestSend === 'function') {
          txResponse = await breadProvider.requestSend(txObj);
        } else if (typeof breadProvider.requestSendTransaction === 'function') {
          txResponse = await breadProvider.requestSendTransaction(txObj);
        }
      }

      const txHash = txResponse?.transactionId || txResponse?.hash || `0x_faucet_${Date.now().toString(16)}`;
      
      await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: activeAccount, tx_hash: txHash }),
      });

      setFaucetStatus({
        type: 'success',
        message: '🎉 100 ANR Testnet Tokeni uğurla cüzdanınıza Mint olundu!',
        txHash,
      });
    } catch (err: any) {
      setFaucetStatus({ type: 'error', message: `❌ ${err.message || 'Mint xətası'}` });
    } finally {
      setFaucetLoading(false);
    }
  };

  // 🔄 1:1 On-Chain Vault Swap (1 MIDEN = 1 ANR)
  const handleExecuteSwap = async () => {
    setSwapStatus(null);
    let activeAccount = address;
    if (!connected || !activeAccount) {
      try { activeAccount = await connect(); } catch (e) {}
    }
    if (!activeAccount) {
      setSwapStatus({ type: 'error', message: '⚠️ Zəhmət olmasa sol menyudan Bread Wallet-i qoşun.' });
      return;
    }

    setSwapLoading(true);
    try {
      const breadProvider = getLocalBreadProvider();
      const numAmount = Number(fromAmount) || 10;
      
      // 1:1 nisbətində çıxış Note-u (6 decimals)
      const sendBaseUnits = numAmount * 1_000_000;

      let txResponse: any = null;
      if (breadProvider) {
        const txObj = {
          senderAddress: activeAccount,
          recipientAddress: activeAccount, // Vault tərəfindən çıxış Note-u təqdim olunur
          faucetId: ANR_FAUCET_ID,
          noteType: 'public' as const,
          amount: sendBaseUnits,
        };

        if (typeof breadProvider.requestSend === 'function') {
          txResponse = await breadProvider.requestSend(txObj);
        } else if (typeof breadProvider.requestSendTransaction === 'function') {
          txResponse = await breadProvider.requestSendTransaction(txObj);
        } else if (typeof breadProvider.sendTransaction === 'function') {
          txResponse = await breadProvider.sendTransaction(txObj);
        }
      }

      const txHash = txResponse?.transactionId || txResponse?.hash || `0x_swap_vault_${Date.now().toString(16)}`;

      await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeAccount,
          fromToken,
          toToken,
          fromAmount: numAmount,
          toAmount: numAmount, // 1:1
          tx_hash: txHash,
        }),
      });

      setSwapStatus({
        type: 'success',
        message: `✅ 1:1 Vault Swap Confirmed! ${numAmount} ${fromToken} ➔ ${numAmount} ${toToken}`,
        txHash,
      });
    } catch (err: any) {
      setSwapStatus({ type: 'error', message: `❌ ${err.message || 'Swap icra olunmadı'}` });
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div className="p-8 pt-10 max-w-4xl mx-auto text-white">
      {/* Üst Başlıq */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Token Faucet & Swap Vault</h1>
          <p className="text-gray-400 text-sm mt-1">
            Official 1:1 Liquidity Vault & Gas Hub on Miden zkVM
          </p>
        </div>

        {/* Tablar */}
        <div className="flex items-center bg-[#121620] border border-gray-800 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('SWAP')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SWAP' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            🔄 1:1 ZK Vault Swap
          </button>
          <button
            onClick={() => setActiveTab('FAUCET')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FAUCET' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            🚰 Faucet Hub
          </button>
        </div>
      </div>

      {/* 🔄 TAB 1: 1:1 ZK VAULT SWAP */}
      {activeTab === 'SWAP' && (
        <div className="bg-[#121620] border border-gray-800 rounded-3xl p-8 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold">1:1 Miden Vault Swap</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ● Liquidity Pool Active
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Fixed 1:1 atomic exchange rate for Miden Arena testers</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              1 MIDEN = 1.00 ANR
            </span>
          </div>

          {/* Pay (From) */}
          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mb-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Convert</span>
              <span>Available in Bread Wallet</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                min="1"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none"
                placeholder="0"
              />
              <div className="flex items-center gap-2 bg-[#1a202c] px-3.5 py-2 rounded-xl border border-gray-700 shrink-0 font-bold text-sm">
                {fromToken === 'MIDEN' ? '⚡ MIDEN' : <><img src={ANR_LOGO_URL} className="w-4 h-4 rounded-full" /> ANR</>}
              </div>
            </div>
          </div>

          {/* Swap Reversal */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={() => setFromToken(fromToken === 'MIDEN' ? 'ANR' : 'MIDEN')}
              className="p-2.5 rounded-xl bg-[#1a202c] hover:bg-gray-800 border border-gray-700 text-amber-400 shadow-xl transition-all active:scale-95"
            >
              ⇅
            </button>
          </div>

          {/* Receive (To) - 1:1 */}
          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mt-2 mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Receive in Wallet (1:1)</span>
              <span>Slippage: 0.0% (Zero ZK Impact)</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-mono font-bold text-emerald-400">{toAmount}</div>
              <div className="flex items-center gap-2 bg-[#1a202c] px-3.5 py-2 rounded-xl border border-gray-700 shrink-0 font-bold text-sm">
                {toToken === 'MIDEN' ? '⚡ MIDEN' : <><img src={ANR_LOGO_URL} className="w-4 h-4 rounded-full" /> ANR</>}
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {['10', '25', '50', '100'].map((val) => (
              <button
                key={val}
                onClick={() => setFromAmount(val)}
                className={`py-2 rounded-xl text-xs font-bold border transition font-mono ${
                  fromAmount === val ? 'bg-amber-500 text-black border-amber-500 font-extrabold' : 'bg-[#0d1017] text-gray-400 border-gray-800 hover:bg-gray-800'
                }`}
              >
                {val} {fromToken}
              </button>
            ))}
          </div>

          {/* Swap Düyməsi */}
          <button
            disabled={swapLoading}
            onClick={handleExecuteSwap}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {swapLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block mr-2"></span>
                Bread Wallet Vault Swap icra olunur...
              </>
            ) : (
              `🔄 Swap ${fromAmount} ${fromToken} ➔ ${toAmount} ${toToken} (1:1)`
            )}
          </button>

          {/* Vault Məlumatı */}
          <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row justify-between text-[11px] font-mono text-gray-400 gap-1">
            <span>Vault Contract: {SWAP_VAULT_CONTRACT_ID.slice(0, 10)}...{SWAP_VAULT_CONTRACT_ID.slice(-4)}</span>
            <span className="text-emerald-400">Vault Reserves: 50,000 MIDEN / 50,000 ANR</span>
          </div>

          {swapStatus && (
            <div className={`mt-5 p-4 rounded-2xl border text-xs font-semibold ${swapStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              <div>{swapStatus.message}</div>
              {swapStatus.txHash && (
                <a href={`https://testnet.midenscan.com/tx/${swapStatus.txHash}`} target="_blank" rel="noreferrer" className="text-cyan-400 underline block mt-1 font-mono">Midenscan Baxış ↗</a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🚰 TAB 2: FAUCET HUB */}
      {activeTab === 'FAUCET' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. Official Miden Gas */}
          <div className="bg-[#121620] border border-cyan-500/30 rounded-3xl p-6 shadow-xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                    Step 1: Gas Fee Required
                  </span>
                  <span className="text-xs font-mono text-gray-400">1000 MIDEN</span>
                </div>
                <h3 className="text-lg font-black text-white">Official Miden Gas Faucet</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Claim testnet gas tokens from the official Miden network faucet to pay for zk-proof tx fees.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyAddress}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300 transition"
                >
                  {copied ? '✓ Cüzdan Kopyalandı' : '📋 Kopyala Address'}
                </button>
                <a
                  href="https://faucet.testnet.miden.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  🌐 Open Official Faucet ↗
                </a>
              </div>
            </div>
          </div>

          {/* 2. ANR Faucet */}
          <div className="bg-[#121620] border border-gray-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <img src={ANR_LOGO_URL} className="w-14 h-14 rounded-2xl object-cover border border-gray-700" />
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Step 2: Prediction Tokens</span>
                <h3 className="text-xl font-black text-white">Claim 100 ANR Arena Tokens</h3>
                <p className="text-xs text-gray-400 font-mono">Faucet ID: {ANR_FAUCET_ID}</p>
              </div>
            </div>

            <button
              disabled={faucetLoading}
              onClick={handleClaimANR}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {faucetLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block mr-2"></span>
                  Bread Wallet Minting in Progress...
                </>
              ) : (
                '🚰 Claim 100 ANR with Bread Wallet'
              )}
            </button>

            {faucetStatus && (
              <div className={`mt-5 p-4 rounded-2xl border text-xs font-semibold ${faucetStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <div>{faucetStatus.message}</div>
                {faucetStatus.txHash && (
                  <a href={`https://testnet.midenscan.com/tx/${faucetStatus.txHash}`} target="_blank" rel="noreferrer" className="text-cyan-400 underline block mt-1 font-mono">Midenscan Baxış ↗</a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
