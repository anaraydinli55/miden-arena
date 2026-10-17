#!/usr/bin/env python3
"""Reads a dry-run plan (JSON on stdin) and checks the arithmetic.
Usage: curl -s -X POST .../api/admin/resolve ... -d '{"dry_run":true,...}' | python3 scripts/dry_run_check.py"""
import json, sys

d = json.load(sys.stdin)
print('problems:', d.get('problems'))
for t, s in d.get('summary', {}).items():
    total = s['yes'] + s['no']
    items = [i for i in d['items'] if i['token'] == t]
    paid = sum(i['base'] for i in items)
    ok = paid <= total and total - paid <= len(items)
    print(f"{t}: mode={s['mode']} yes={s['yes']} no={s['no']} total={total} paid={paid} "
          f"dust={total - paid} payees={len(items)} -> {'OK' if ok else 'CHECK'}")
for i in d.get('items', []):
    print('  ', i['token'], i['kind'], i['wallet'], i['base'])
