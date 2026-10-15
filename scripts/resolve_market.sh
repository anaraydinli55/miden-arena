#!/usr/bin/env bash
# Kullanim: scripts/resolve_market.sh <market_id> <YES|NO|VOID>
set -euo pipefail
M="${1:?market_id gerekli}"
O="${2:?YES, NO veya VOID gerekli}"
B="${BASE_URL:-https://miden-arena.vercel.app}"
A="$(cat ~/.admin-secret)"
H=(-H "x-admin-secret: $A" -H 'Content-Type: application/json')

echo "== kuru calistirma =="
curl -s -X POST "$B/api/admin/resolve" "${H[@]}" -d "{\"market_id\":\"$M\",\"outcome\":\"$O\",\"dry_run\":true}" | python3 -m json.tool
read -r -p "Plan dogru mu? Sonuclandirmak (GERI ALINAMAZ) icin 'evet' yazin: " ok
[ "$ok" = "evet" ] || { echo "iptal edildi"; exit 1; }

echo "== sonuclandirma =="
curl -s -X POST "$B/api/admin/resolve" "${H[@]}" -d "{\"market_id\":\"$M\",\"outcome\":\"$O\"}" | python3 -m json.tool
echo "== odemeler =="
python3 "$(dirname "$0")/admin_payout.py" "$M"
