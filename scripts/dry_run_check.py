#!/usr/bin/env python3
"""Reads a dry-run plan (JSON on stdin) and checks the arithmetic.
If UPSTASH_* is set and a market id is given, it also recomputes every winner's payout from the stake index.
Usage: curl ... | python3 scripts/dry_run_check.py [market_id]"""
import json, os, sys, urllib.request

d = json.load(sys.stdin)
market = sys.argv[1] if len(sys.argv) > 1 else None
URL, TOK = os.environ.get('UPSTASH_REDIS_REST_URL'), os.environ.get('UPSTASH_REDIS_REST_TOKEN')

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

print('problems:', d.get('problems'))
for t, s in d.get('summary', {}).items():
    total = s['yes'] + s['no']
    items = [i for i in d['items'] if i['token'] == t]
    paid = sum(i['base'] for i in items)
    ok = paid <= total and total - paid <= len(items)
    print(f"{t}: mode={s['mode']} yes={s['yes']} no={s['no']} total={total} paid={paid} "
          f"dust={total - paid} payees={len(items)} -> {'OK' if ok else 'CHECK'}")
    if market and URL and TOK and s['mode'] == 'split':
        side = 'yes' if d['outcome'] == 'YES' else 'no'
        flat = cmd('HGETALL', f'stakes:{market}:{t}') or []
        stakes = {k: int(v) for k, v in zip(flat[0::2], flat[1::2])}
        winners = {k.rsplit(':', 1)[0]: v for k, v in stakes.items() if k.endswith(':' + side)}
        wtotal = sum(winners.values())
        bad = []
        for i in items:
            expected = winners.get(i['wallet'], 0) * total // wtotal
            if expected != i['base']:
                bad.append((i['wallet'], i['base'], expected))
        print('   independent recomputation:', 'OK' if not bad else f'MISMATCH {bad}')
        for w, v in winners.items():
            print(f'   winner stake {w}: {v} ({v / wtotal:.1%} of the winning side)')
for i in d.get('items', []):
    print('  ', i['token'], i['kind'], i['wallet'], i['base'])
