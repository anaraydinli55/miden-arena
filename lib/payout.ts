import { redis } from '@/lib/redis';
import { TOKENS, poolsKey } from '@/lib/ledger';

export type Outcome = 'YES' | 'NO' | 'VOID';
export type PlanItem = { token: string; wallet: string; base: number; kind: 'win' | 'refund' };

function splitField(field: string) {
  const i = field.lastIndexOf(':');
  return { wallet: field.slice(0, i), side: field.slice(i + 1) };
}

export async function buildPlan(marketId: string, outcome: Outcome) {
  const items: PlanItem[] = [];
  const problems: string[] = [];
  const summary: Record<string, { yes: number; no: number; paid: number; mode: string }> = {};

  for (const token of TOKENS) {
    const stakes = ((await redis.hgetall(`stakes:${marketId}:${token}`)) || {}) as Record<string, unknown>;
    const pools = ((await redis.hgetall(poolsKey(token))) || {}) as Record<string, unknown>;
    const yesBy: Record<string, number> = {};
    const noBy: Record<string, number> = {};
    let yes = 0;
    let no = 0;

    for (const [field, v] of Object.entries(stakes)) {
      const { wallet, side } = splitField(field);
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) {
        problems.push(`${token}: invalid stake ${field}=${String(v)}`);
        continue;
      }
      if (side === 'yes') {
        yesBy[wallet] = (yesBy[wallet] || 0) + n;
        yes += n;
      } else if (side === 'no') {
        noBy[wallet] = (noBy[wallet] || 0) + n;
        no += n;
      } else {
        problems.push(`${token}: unknown side in ${field}`);
      }
    }

    const poolYes = Number(pools[`${marketId}:yes`] || 0);
    const poolNo = Number(pools[`${marketId}:no`] || 0);
    if (yes !== poolYes || no !== poolNo) {
      problems.push(`${token}: stake index (${yes}/${no}) does not match pool (${poolYes}/${poolNo})`);
    }

    const total = yes + no;
    if (total === 0) continue;

    const winnersBy = outcome === 'YES' ? yesBy : noBy;
    const winnersTotal = outcome === 'YES' ? yes : no;
    const refund = outcome === 'VOID' || yes === 0 || no === 0 || winnersTotal === 0;
    let paid = 0;

    if (refund) {
      const all: Record<string, number> = {};
      for (const [w, n] of Object.entries(yesBy)) all[w] = (all[w] || 0) + n;
      for (const [w, n] of Object.entries(noBy)) all[w] = (all[w] || 0) + n;
      for (const [wallet, base] of Object.entries(all)) {
        items.push({ token, wallet, base, kind: 'refund' });
        paid += base;
      }
    } else {
      for (const [wallet, stake] of Object.entries(winnersBy)) {
        const base = Number((BigInt(stake) * BigInt(total)) / BigInt(winnersTotal));
        if (base > 0) {
          items.push({ token, wallet, base, kind: 'win' });
          paid += base;
        }
      }
    }
    summary[token] = { yes, no, paid, mode: refund ? 'refund' : 'split' };
  }
  return { items, problems, summary };
}
