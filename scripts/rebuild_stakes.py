#!/usr/bin/env python3
"""Rebuilds the per-wallet stake index (stakes:{market}:{token}) from the verified deposit history.
Idempotent: it overwrites values instead of incrementing them."""
import collections, json, os, urllib.request

URL, TOK = os.environ['UPSTASH_REDIS_REST_URL'], os.environ['UPSTASH_REDIS_REST_TOKEN']

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

def pairs(flat):
    return dict(zip(flat[0::2], flat[1::2])) if flat else {}

wallets = list(pairs(cmd('HGETALL', 'lb:users')).keys())
stakes = collections.defaultdict(int)
for w in wallets:
    for raw in cmd('LRANGE', f'history:{w}', '0', '-1') or []:
        h = json.loads(raw)
        if h.get('status') != 'Deposit verified':
            continue
        side = 'yes' if h['choice'] == 'YES' else 'no'
        stakes[(h['market_id'], h['token'], side, w)] += round(float(h['amount']) * 1_000_000)

by_key = collections.defaultdict(dict)
for (m, t, side, w), v in stakes.items():
    by_key[f'stakes:{m}:{t}'][f'{w}:{side}'] = v

for key, fields in by_key.items():
    existing = pairs(cmd('HGETALL', key))
    stale = [f for f in existing if f not in fields]
    if stale:
        cmd('HDEL', key, *stale)
    args = ['HSET', key]
    for f, v in fields.items():
        args += [f, str(v)]
    cmd(*args)
    print('rebuilt', key, fields)

for t in ('ANR', 'SKS', 'ELA'):
    pools = pairs(cmd('HGETALL', f'pools:{t}'))
    sums = collections.defaultdict(int)
    for (m, tok, side, w), v in stakes.items():
        if tok == t:
            sums[f'{m}:{side}'] += v
    bad = {k: (pools.get(k), sums.get(k)) for k in set(pools) | set(sums)
           if str(sums.get(k, 0)) != str(pools.get(k, 0))}
    print(t, 'consistent' if not bad else f'MISMATCH (pool, index): {bad}')
