'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import { getBreadProvider } from '@/lib/miden/bread';

// TEMPORARY: which address format makes Bread label the sent token? Sends 0.01 ANR to your OTHER account.
const HEX = '0x7b9512fc7ffcd6d13e43d231bcf631';
const BECH = 'mtst1apae2yhu0l7dd5f7g0frr08kxy9xh69p';
const SFX = '_qr7qqq9wr6w';
const ESCROW = 'mtst1aq9qxfvlq0whp52wj7nfx3g0ngu6m28w';
const base = (a: string) => a.trim().split('_')[0];

export default function Page() {
  const { address, connect } = useWallet();
  const [to, setTo] = useState('mtst1az07jy668tew2qg8mqh6cx73qudh0sjy');
  const [log, setLog] = useState<string[]>([]);
  const add = (m: string) => setLog((l) => [m, ...l]);

  const run = async (label: string, faucetId: string, recipientAddress: string) => {
    if (base(recipientAddress) === ESCROW) return add('refused: that is the escrow');
    const from = address || (await connect());
    const p: any = getBreadProvider();
    const m = ['requestSend', 'requestSendTransaction', 'sendTransaction'].find((x) => typeof p?.[x] === 'function');
    if (!from || !m) return add('wallet or send method missing');
    add(label + ': sending');
    try {
      const r = await p[m]({ senderAddress: from, recipientAddress, faucetId, noteType: 'public', amount: 10000 });
      add(label + ' ok ' + JSON.stringify(r));
    } catch (e: any) {
      add(label + ' error ' + (e?.message || String(e)));
    }
  };

  const b = base(to);
  const btn = 'block rounded bg-cyan-500 px-4 py-2 text-black font-bold';
  return (
    <div className="p-8 text-white space-y-3">
      <p>Connected: {address || 'no'}. Each button sends 0.01 ANR, then check Bread Activity.</p>
      <input className="w-full bg-black/40 p-2 font-mono text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
      <button className={btn} onClick={() => run('A', BECH, b)}>A: bech32 faucet, bech32 recipient</button>
      <button className={btn} onClick={() => run('B', BECH + SFX, b + SFX)}>B: both with the suffix</button>
      <button className={btn} onClick={() => run('C', HEX, b)}>C: hex faucet, bech32 recipient</button>
      <pre className="text-xs whitespace-pre-wrap break-all">{log.join('\n')}</pre>
    </div>
  );
}
