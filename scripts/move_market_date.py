#!/usr/bin/env python3
"""Moves a market's expiry date (and optionally rewrites a phrase in its title) in lib/markets.ts.
Refuses resolved markets, and markets that already hold stakes unless --allow-staked is given,
because changing the question under existing bets is unfair.
Usage (repo root):
  set -a; . ./.env.local; set +a
  python3 scripts/move_market_date.py <market_id> <YYYY-MM-DD> [--replace "old" "new"] [--allow-staked]"""
import argparse, json, os, re, sys, urllib.request
from datetime import datetime, timezone

ap = argparse.ArgumentParser()
ap.add_argument('market')
ap.add_argument('date', help='new end date, YYYY-MM-DD (expires at 23:59:59 UTC)')
ap.add_argument('--replace', nargs=2, metavar=('OLD', 'NEW'), help='replace a phrase in the title')
ap.add_argument('--allow-staked', action='store_true')
args = ap.parse_args()

try:
    day = datetime.strptime(args.date, '%Y-%m-%d')
except ValueError:
    sys.exit('the date must look like 2026-12-31')
if day.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
    sys.exit('the new date is in the past')
expires = day.strftime('%Y-%m-%dT23:59:59Z')

URL, TOK = os.environ.get('UPSTASH_REDIS_REST_URL'), os.environ.get('UPSTASH_REDIS_REST_TOKEN')
if not (URL and TOK):
    sys.exit('load the Upstash variables first: set -a; . ./.env.local; set +a')

def cmd(*a):
    req = urllib.request.Request(URL, data=json.dumps(list(a)).encode(),
        headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))['result']

def pairs(flat):
    return dict(zip(flat[0::2], flat[1::2])) if flat else {}

M = args.market
if M in pairs(cmd('HGETALL', 'resolved:all')):
    sys.exit(f'{M} is resolved and cannot be moved')

staked = {}
for t in ('ANR', 'SKS', 'ELA'):
    for f, v in pairs(cmd('HGETALL', f'pools:{t}')).items():
        if f.startswith(M + ':') and int(v) > 0:
            staked[f"{t} {f.rsplit(':', 1)[1]}"] = int(v)
if staked and not args.allow_staked:
    print(f'{M} already holds stakes (base units): {staked}')
    sys.exit('refusing: moving it changes the question under existing bets. Re-run with --allow-staked '
             'if that is acceptable (test tokens), or add a new market with a new id instead.')

p = 'lib/markets.ts'
s = open(p, encoding='utf-8').read()
try:
    start = s.index(f"id: '{M}'")
except ValueError:
    sys.exit(f'market id {M} not found in {p}')
end = s.index('},', start)
block = s[start:end]
new, n = re.subn(r"new Date\('[^']+'\)", f"new Date('{expires}')", block, count=1)
if n != 1:
    sys.exit('expiry not found in the market block')
if args.replace:
    old, rep = args.replace
    if old not in new:
        sys.exit(f'phrase not found in the block: {old!r}')
    new = new.replace(old, rep)
open(p, 'w', encoding='utf-8').write(s[:start] + new + s[end:])
print('updated', M)
for line in new.splitlines():
    if re.search(r"id:|title:|expiresAt:", line):
        print('  ', line.strip())
