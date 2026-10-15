#!/usr/bin/env python3
"""Sonuclanmis bir pazarin odemelerini yapar: once escrow note'larini vault'a alir, sonra plani oder."""
import json, os, sys, time, urllib.error, urllib.request

B = os.environ.get('BASE_URL', 'https://miden-arena.vercel.app')
A = open(os.path.expanduser('~/.admin-secret')).read().strip()
M = sys.argv[1]

def call(body):
    req = urllib.request.Request(B + '/api/admin/payout', data=json.dumps(body).encode(),
        headers={'x-admin-secret': A, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=70))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or '{}')

for _ in range(5):
    r = call({'market_id': M, 'step': 'consume'})
    print('consume:', r)
    if not r.get('success') or r.get('consumed', 0) == 0:
        break
    time.sleep(25)

while True:
    r = call({'market_id': M})
    print('pay:', r)
    if not r.get('success') or r.get('remaining') == 0:
        break
    time.sleep(2)
