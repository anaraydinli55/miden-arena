#!/usr/bin/env python3
"""Prints every market's pools per token, the number of distinct wallets and whether it is resolved.
Usage: set -a; . ./.env.local; set +a; python3 scripts/markets_overview.py"""
import json, os, urllib.request

URL, TOK = os.environ['UPSTASH_REDIS_REST_URL'], os.environ['UPSTASH_REDIS_REST_TOKEN']

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

def pairs(flat):
    return dict(zip(flat[0::2], flat[1::2])) if flat else {}

resolved = pairs(cmd('HGETALL', 'resolved:all'))
rows = {}
for t in ('ANR', 'SKS', 'ELA'):
    for field, v in pairs(cmd('HGETALL', f'pools:{t}')).items():
        market, side = field.rsplit(':', 1)
        rows.setdefault(market, {}).setdefault(t, {'yes': 0, 'no': 0})[side] = int(v)

for market in sorted(rows):
    state = f'RESOLVED {resolved[market]}' if market in resolved else 'open'
    print(f'{market}  [{state}]')
    for t, s in sorted(rows[market].items()):
        wallets = {f.rsplit(':', 1)[0] for f in pairs(cmd('HGETALL', f'stakes:{market}:{t}'))}
        kind = 'two-sided' if s['yes'] > 0 and s['no'] > 0 else 'one-sided'
        print(f"  {t}: YES {s['yes'] / 1e6:.4f}  NO {s['no'] / 1e6:.4f}  wallets {len(wallets)}  {kind}")
