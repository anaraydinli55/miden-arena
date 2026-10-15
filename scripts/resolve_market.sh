#!/usr/bin/env bash
# Usage: scripts/resolve_market.sh <market_id> <YES|NO|VOID>
set -euo pipefail
M="${1:?market_id required}"
O="${2:?YES, NO or VOID required}"
B="${BASE_URL:-https://miden-arena.vercel.app}"
A="$(cat ~/.admin-secret)"
H=(-H "x-admin-secret: $A" -H 'Content-Type: application/json')

echo "== dry run =="
curl -s -X POST "$B/api/admin/resolve" "${H[@]}" -d "{\"market_id\":\"$M\",\"outcome\":\"$O\",\"dry_run\":true}" | python3 -m json.tool
read -r -p "Is the plan correct? Type 'yes' to resolve (CANNOT be undone): " ok
[ "$ok" = "yes" ] || { echo "cancelled"; exit 1; }

echo "== resolving =="
curl -s -X POST "$B/api/admin/resolve" "${H[@]}" -d "{\"market_id\":\"$M\",\"outcome\":\"$O\"}" | python3 -m json.tool
echo "== payouts =="
python3 "$(dirname "$0")/admin_payout.py" "$M"
