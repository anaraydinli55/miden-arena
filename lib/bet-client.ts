import { sendViaBread } from '@/lib/miden/bread';
import { BET_TOKENS, ESCROW_ACCOUNT_ID } from '@/lib/miden/tokens';

export type PlaceBetParams = {
  wallet: string;
  marketId: string;
  choice: 'YES' | 'NO';
  token: 'ANR' | 'SKS' | 'ELA';
  amount: number; // tam birim
  onStatus?: (message: string) => void;
};

export type PlaceBetResult =
  | { ok: true; txHash: string; noteId?: string }
  | { ok: false; error: string; txHash?: string; pending?: boolean };

async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

export async function placeBet(p: PlaceBetParams): Promise<PlaceBetResult> {
  if (!ESCROW_ACCOUNT_ID) return { ok: false, error: 'Bahis qəbulu hələ aktiv deyil.' };
  const faucetId = BET_TOKENS[p.token];
  if (!faucetId) return { ok: false, error: `${p.token} konfiqurasiya olunmayıb.` };

  p.onStatus?.('Niyyət yaradılır...');
  const intent = await post('/api/bet/intent', {
    wallet: p.wallet,
    market_id: p.marketId,
    choice: p.choice,
    token: p.token,
    amount: p.amount,
  });
  if (!intent.data?.success) {
    return { ok: false, error: intent.data?.error || `Server xətası (${intent.status})` };
  }
  const total = Number(intent.data.total_base_units);

  p.onStatus?.('Bread Wallet-də təsdiq edin...');
  let txHash: string;
  try {
    txHash = await sendViaBread({
      senderAddress: p.wallet,
      recipientAddress: ESCROW_ACCOUNT_ID,
      faucetId,
      amount: total,
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Cüzdan göndərmədi' };
  }

  p.onStatus?.('Depozit zəncirdə yoxlanılır...');
  for (let i = 0; i < 18; i++) {
    const c = await post('/api/bet/confirm', { wallet: p.wallet, token: p.token, total_base_units: total });
    if (c.data?.success) return { ok: true, txHash, noteId: c.data.note_id };
    const retry = c.data?.pending || c.status === 502 || c.status === 504;
    if (!retry) return { ok: false, txHash, error: c.data?.error || `Server xətası (${c.status})` };
    await new Promise((r) => setTimeout(r, 5000));
  }
  return {
    ok: false,
    txHash,
    pending: true,
    error: 'Depozit göndərildi, amma hələ təsdiqlənmədi. Bir az sonra yenidən yoxlayın.',
  };
}
