#!/usr/bin/env python3
"""Compares the escrow vault with the recorded stakes of the open markets.
Usage: set -a; . ./.env.local; set +a; python3 scripts/reconcile.py [--consume]
--consume first moves pending deposit notes into the vault (otherwise new bets look like a shortfall)."""
import json, os, sys, time, urllib.request

URL, TOK = os.environ['UPSTASH_REDIS_REST_URL'], os.environ['UPSTASH_REDIS_REST_TOKEN']
MINT = os.environ.get('MINT_URL', 'https://miden-mint-service.onrender.com')
SECRET = open(os.path.expanduser('~/.mint-secret-prod')).read().strip()

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

def mint(path, method='GET'):
    req = urllib.request.Request(MINT + path, method=method, headers={'Authorization': 'Bearer ' + SECRET})
    return json.load(urllib.request.urlopen(req, timeout=70))

def pairs(flat):
    return dict(zip(flat[0::2], flat[1::2])) if flat else {}

if '--consume' in sys.argv:
    print('consume:', mint('/escrow/consume', 'POST'))
    time.sleep(25)

resolved = pairs(cmd('HGETALL', 'resolved:all'))
vault = mint('/status')['escrowTokens']
for t in ('ANR', 'SKS', 'ELA'):
    pools = pairs(cmd('HGETALL', f'pools:{t}'))
    open_total = sum(int(v) for k, v in pools.items() if k.rsplit(':', 1)[0] not in resolved)
    v = vault.get(t)
    diff = None if v is None else v - open_total
    print(f'{t}: vault={v} open_markets={open_total} difference={diff}')
print('0 or a tiny dust: fine. Negative: unconsumed notes (use --consume). Positive: deposit without a ledger record.')
