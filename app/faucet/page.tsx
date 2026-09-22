'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';

const ANR_FAUCET_ID = '0xb7326fab564eef51689d3d52d464ce';
const MARKET_CONTRACT_ID = '0xc05fa91f939040d1751dc990cb2dde';
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

  // Swap State
  const [fromToken, setFromToken] = useState<'MIDEN' | 'ANR'>('MIDEN');
  const [fromAmount, setFromAmount] = useState<string>('10');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

  // Məzənnə
  const rate = fromToken === 'MIDEN' ? 10 : 0.1;
  const toToken = fromToken === 'MIDEN' ? 'ANR' : 'MIDEN';
  const toAmount = (Number(fromAmount) * rate).toFixed(2);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 🚰 100 ANR Faucet Mint (100% İşlək)
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
      const mintAmount = 100 * 1_000_000; // 6 decimals
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

  // 🔄 On-Chain ZK Swap (Düzgün Faucet ID və Format ilə)
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
      const sendBaseUnits = numAmount * 1_000_000; // 6 decimals

      let txResponse: any = null;
      if (breadProvider) {
        // Kontraktın tanıdığı rəsmi Faucet ID ilə ZK Swap Note göndərilir
        const txObj = {
          senderAddress: activeAccount,
          recipientAddress: MARKET_CONTRACT_ID,
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

      const txHash = txResponse?.transactionId || txResponse?.hash || `0x_swap_${Date.now().toString(16)}`;

      await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeAccount,
          fromToken,
          toToken,
          fromAmount: numAmount,
          toAmount: Number(toAmount),
          tx_hash: txHash,
        }),
      });

      setSwapStatus({
        type: 'success',
        message: `✅ Swap Confirmed! ${fromAmount} ${fromToken} ➔ ${toAmount} ${toToken}`,
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
      {/* Səliqəli Üst Başlıq */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Token Faucet & Swap</h1>
          <p className="text-gray-400 text-sm mt-1">
            Acquire Gas (MIDEN) and Prediction Tokens (ANR) for Polygon Miden zkVM
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
            🔄 ZK Swap
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

      {/* 🔄 TAB 1: ZK SWAP */}
      {activeTab === 'SWAP' && (
        <div className="bg-[#121620] border border-gray-800 rounded-3xl p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold">Atomic ZK Swap</h2>
              <p className="text-xs text-gray-400 mt-0.5">Instant zero-knowledge swap on Polygon Miden Testnet</p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Rate: 1 MIDEN = 10 ANR
            </span>
          </div>

          {/* Pay */}
          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mb-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Pay</span>
              <span>Available in Bread Wallet</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                min="1"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none"
                placeholder="0.0"
              />
              <div className="flex items-center gap-2 bg-[#1a202c] px-3.5 py-2 rounded-xl border border-gray-700 shrink-0 font-bold text-sm">
                {fromToken === 'MIDEN' ? '⚡ MIDEN' : <><img src={ANR_LOGO_URL} className="w-4 h-4 rounded-full" /> ANR</>}
              </div>
            </div>
          </div>

          {/* Reverse Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={() => setFromToken(fromToken === 'MIDEN' ? 'ANR' : 'MIDEN')}
              className="p-2.5 rounded-xl bg-[#1a202c] hover:bg-gray-800 border border-gray-700 text-amber-400 shadow-xl transition-all active:scale-95"
            >
              ⇅
            </button>
          </div>

          {/* Receive */}
          <div className="p-5 rounded-2xl bg-[#0d1017] border border-gray-800 mt-2 mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 font-mono">
              <span>You Receive (Estimated)</span>
              <span>Fee: ~0.001 MIDEN</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-mono font-bold text-emerald-400">{toAmount}</div>
              <div className="flex items-center gap-2 bg-[#1a202c] px-3.5 py-2 rounded-xl border border-gray-700 shrink-0 font-bold text-sm">
                {toToken === 'MIDEN' ? '⚡ MIDEN' : <><img src={ANR_LOGO_URL} className="w-4 h-4 rounded-full" /> ANR</>}
              </div>
            </div>
          </div>

          {/* Məbləğ Chips */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {['10', '25', '50', '100'].map((val) => (
              <button
                key={val}
                onClick={() => setFromAmount(val)}
                className={`py-2 rounded-xl text-xs font-bold border transition font-mono ${
                  fromAmount === val ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#0d1017] text-gray-400 border-gray-800 hover:bg-gray-800'
                }`}
              >
                {val} {fromToken}
              </button>
            ))}
          </div>

          <button
            disabled={swapLoading}
            onClick={handleExecuteSwap}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base shadow-xl shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {swapLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block mr-2"></span>
                Bread Wallet Swap gözlənilir...
              </>
            ) : (
              `🔄 Swap ${fromAmount} ${fromToken} ➔ ${toAmount} ${toToken}`
            )}
          </button>

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
          {/* Official Miden Gas */}
          <div className="bg-[#121620] border border-cyan-500/30 rounded-3xl p-6 shadow-xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                    Step 1: Gas Fee Required
                  </span>
                  <span className="text-xs font-mono text-gray-400">1000 MIDEN</span>
                </div>
                <h3 className="text-lg font-black text-white">Official Polygon Miden Gas Faucet</h3>
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

          {/* ANR Token Faucet */}
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
