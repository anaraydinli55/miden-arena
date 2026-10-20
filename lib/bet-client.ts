import { sendViaBread } from '@/lib/miden/bread';
import { BET_TOKEN_ADDRESSES, ESCROW_ACCOUNT_ID, ESCROW_ADDRESS } from '@/lib/miden/tokens';

export type BetToken = 'ANR' | 'SKS' | 'ELA';

export type PlaceBetParams = {
  wallet: string;
  marketId: string;
  choice: 'YES' | 'NO';
  token: BetToken;
  amount: number; // whole units
  onStatus?: (message: string) => void;
};

export type PlaceBetResult =
  | { ok: true; txHash: string; noteId?: string }
  | { ok: false; error: string; txHash?: string; pending?: boolean };

export type PendingBet = { wallet: string; token: BetToken; total: number; ts: number };

const PENDING_KEY = 'miden-arena:pending-bets';
const PENDING_TTL_MS = 6 * 60 * 60 * 1000; // same lifetime as the server-side intent

const normWallet = (w: string) => String(w || '').trim().toLowerCase().split('_')[0];

function readPending(): PendingBet[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(window.localStorage.getItem(PENDING_KEY) || '[]') as PendingBet[];
    return list.filter((p) => Date.now() - p.ts < PENDING_TTL_MS);
  } catch {
    return [];
  }
}

function writePending(list: PendingBet[]) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable: nothing to do
  }
}

const samePending = (a: PendingBet, b: PendingBet) =>
  a.wallet === b.wallet && a.token === b.token && a.total === b.total;

export function getPendingBets(wallet: string): PendingBet[] {
  const w = normWallet(wallet);
  return w ? readPending().filter((p) => p.wallet === w) : [];
}

function addPendingBet(p: PendingBet) {
  writePending([...readPending().filter((x) => !samePending(x, p)), p]);
}

function removePendingBet(p: PendingBet) {
  writePending(readPending().filter((x) => !samePending(x, p)));
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

export async function checkPendingBet(p: PendingBet): Promise<'credited' | 'waiting' | 'expired' | 'error'> {
  const c = await post('/api/bet/confirm', { wallet: p.wallet, token: p.token, total_base_units: p.total });
  if (c.data?.success) {
    removePendingBet(p);
    return 'credited';
  }
  if (c.status === 404 && !c.data?.pending) {
    removePendingBet(p);
    return 'expired';
  }
  if (c.status === 409) {
    removePendingBet(p);
    return 'error';
  }
  if (c.data?.pending || c.status === 502 || c.status === 504) return 'waiting';
  return 'error';
}

export async function placeBet(p: PlaceBetParams): Promise<PlaceBetResult> {
  if (!ESCROW_ACCOUNT_ID) return { ok: false, error: 'Betting is not open yet.' };
  const faucetId = BET_TOKEN_ADDRESSES[p.token];
  if (!faucetId) return { ok: false, error: `${p.token} is not configured.` };

  p.onStatus?.('Creating your bet...');
  const intent = await post('/api/bet/intent', {
    wallet: p.wallet,
    market_id: p.marketId,
    choice: p.choice,
    token: p.token,
    amount: p.amount,
  });
  if (!intent.data?.success) {
    return { ok: false, error: intent.data?.error || `Server error (${intent.status})` };
  }
  const total = Number(intent.data.total_base_units);

  p.onStatus?.('Confirm the transaction in Bread Wallet...');
  let txHash: string;
  try {
    txHash = await sendViaBread({
      senderAddress: p.wallet,
      recipientAddress: ESCROW_ADDRESS,
      faucetId,
      amount: total,
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'The wallet did not send the transaction' };
  }

  p.onStatus?.('Verifying the deposit on chain...');
  for (let i = 0; i < 18; i++) {
    const c = await post('/api/bet/confirm', { wallet: p.wallet, token: p.token, total_base_units: total });
    if (c.data?.success) return { ok: true, txHash, noteId: c.data.note_id };
    const retry = c.data?.pending || c.status === 502 || c.status === 504;
    if (!retry) return { ok: false, txHash, error: c.data?.error || `Server error (${c.status})` };
    await new Promise((r) => setTimeout(r, 5000));
  }

  addPendingBet({ wallet: normWallet(p.wallet), token: p.token, total, ts: Date.now() });
  return {
    ok: false,
    txHash,
    pending: true,
    error: 'Your deposit was sent but is not confirmed yet. Use "Check now" in the banner to count it later.',
  };
}
