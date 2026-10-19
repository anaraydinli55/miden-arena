'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import { getBreadProvider } from '@/lib/miden/bread';
import { CLAIM_TOKENS } from '@/lib/miden/tokens';

// TEMPORARY test page: finds which address format makes Bread Wallet show the token name in Activity.
// Each button sends 0.01 ANR from the connected account to the recipient below.
// Use your OTHER Bread account as the recipient, never the escrow.
const ANR_HEX = CLAIM_TOKENS.ANR.faucetId;
const ANR_BECH32 = 'mtst1apae2yhu0l7dd5f7g0frr08kxy9xh69p';
const SUFFIX = '_qr7qqq9wr6w';
const ESCROW_BECH32 = 'mtst1aq9qxfvlq0whp52wj7nfx3g0ngu6m28w';

const base = (a: string) => a.trim().split('_')[0];

export default function BreadLabelsTest() {
  const { address, connected, connect } = useWallet();
  const [recipient, setRecipient] = useState('mtst1az07jy668tew2qg8mqh6cx73qudh0sjy');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const add = (m: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l]);

  const run = async (label: string, faucetId: string, to: string) => {
    const norm = base(to).toLowerCase();
    if (norm === ESCROW_BECH32 || norm.startsWith('0x0a03259f')) {
      add('refused: the recipient is the escrow account');
      return;
    }
    let from = address;
    if (!connected || !from) from = await connect();
    const provider = getBreadProvider();
    if (!provider || !from) {
      add('Bread Wallet is not connected');
      return;
    }
    const method = ['requestSend', 'requestSendTransaction', 'sendTransaction'].find(
      (m) => typeof provider[m] === 'function'
    );
    if (!method) {
      add('no send method on the provider');
      return;
    }
    setBusy(true);
    add(`${label}: sending 0.01 ANR (faucetId=${faucetId}, to=${to})`);
    try {
      const res = await provider[method]({
        senderAddress: from,
        recipientAddress: to,
        faucetId,
        noteType: 'public',
        amount: 10_000,
      });
      add(`${label}: done ${JSON.stringify(res)}`);
    } catch (e: any) {
      add(`${label}: error ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const to = base(recipient);
  const variants: [string, string, string][] = [
    ['A: bech32 faucet, bech32 recipient', ANR_BECH32, to],
    ['B: bech32 faucet and recipient, both with the suffix', ANR_BECH32 + SUFFIX, to + SUFFIX],
    ['C: hex faucet, bech32 recipient', ANR_HEX, to],
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-black">Bread label test (temporary)</h1>
      <p className="text-sm text-gray-400 mt-2">
        Sends 0.01 ANR from the connected account to the recipient. After each send, open Bread Wallet
        Activity and note whether the sent row says ANR or Unknown.
      </p>
      <div className="mt-4 text-xs font-mono text-gray-400">Connected: {address || 'not connected'}</div>
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="mt-3 w-full rounded-xl border border-gray-700 bg-[#0d1017] px-4 py-2.5 text-sm font-mono"
      />
      <div className="mt-4 grid gap-3">
        {variants.map(([label, faucetId, recipientAddress]) => (
          <button
            key={label}
            disabled={busy}
            onClick={() => run(label, faucetId, recipientAddress)}
            className="rounded-xl bg-cyan-500 px-4 py-3 text-left text-sm font-bold text-black disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      <pre className="mt-6 whitespace-pre-wrap break-all rounded-xl bg-black/40 p-4 text-xs text-gray-300">
        {log.join('\n') || 'log is empty'}
      </pre>
    </div>
  );
}
