'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/components/wallet/wallet-provider';
import { checkPendingBet, getPendingBets, type PendingBet } from '@/lib/bet-client';

export function PendingBets({ onCredited }: { onCredited?: () => void }) {
  const { address } = useWallet();
  const [pending, setPending] = useState<PendingBet[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPending(address ? getPendingBets(address) : []);
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkNow = async () => {
    setBusy(true);
    setNote(null);
    let credited = 0;
    let waiting = 0;
    for (const p of getPendingBets(address || '')) {
      const r = await checkPendingBet(p);
      if (r === 'credited') credited++;
      else if (r === 'waiting') waiting++;
    }
    refresh();
    setBusy(false);
    if (credited > 0) {
      setNote(`${credited} deposit(s) counted.`);
      onCredited?.();
    } else if (waiting > 0) {
      setNote('Still waiting for the chain. Try again in a minute.');
    } else {
      setNote('Nothing left to check.');
    }
  };

  if (!pending.length && !note) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
      {pending.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span>You have {pending.length} deposit(s) waiting for confirmation.</span>
          <button
            type="button"
            disabled={busy}
            onClick={checkNow}
            className="rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-black disabled:opacity-50"
          >
            {busy ? 'Checking...' : 'Check now'}
          </button>
        </div>
      )}
      {note && <div className="mt-2 text-amber-100/80">{note}</div>}
    </div>
  );
}
