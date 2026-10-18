#!/usr/bin/env python3
"""Reopens a market that was resolved by mistake. Refuses when the market has any stake, pool, plan or payout data.
Usage: set -a; . ./.env.local; set +a; python3 scripts/reopen_empty_market.py <market_id>"""
import json, os, sys, urllib.request

URL, TOK = os.environ['UPSTASH_REDIS_REST_URL'], os.environ['UPSTASH_REDIS_REST_TOKEN']
M = sys.argv[1]

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

def pairs(flat):
    return dict(zip(flat[0::2], flat[1::2])) if flat else {}

problems = []
for t in ('ANR', 'SKS', 'ELA'):
    if cmd('HLEN', f'stakes:{M}:{t}'):
        problems.append(f'stakes:{M}:{t} is not empty')
    if any(f.startswith(M + ':') for f in pairs(cmd('HGETALL', f'pools:{t}'))):
        problems.append(f'pools:{t} has fields for {M}')
if cmd('EXISTS', f'plan:{M}'):
    problems.append(f'plan:{M} exists')
cur, found = '0', []
while True:
    cur, batch = cmd('SCAN', cur, 'MATCH', f'payout:{M}:*', 'COUNT', '200')
    found += batch
    if cur == '0':
        break
if found:
    problems.append(f'payout records: {found}')

if problems:
    print('REFUSING to reopen, the market has data:', problems)
    sys.exit(1)

cmd('DEL', f'resolved:{M}')
cmd('HDEL', 'resolved:all', M)
print('reopened', M, '| resolved:all =', pairs(cmd('HGETALL', 'resolved:all')))
