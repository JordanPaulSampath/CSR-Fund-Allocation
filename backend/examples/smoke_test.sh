#!/usr/bin/env bash
# Full score -> allocate flow against a running server (localhost:8000).
set -e
BASE=${1:-http://localhost:8000}

echo "== login =="
T=$(curl -s -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d '{"username":"csr_manager","password":"saarthi2026"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo "token: ${T:0:24}..."

echo "== load samples =="
curl -s -X POST "$BASE/proposals/load-samples" -H "authorization: Bearer $T" \
  | python -c "import sys,json;print(len(json.load(sys.stdin)),'proposals loaded')"

echo "== add one proposal =="
curl -s -X POST "$BASE/proposals" -H "authorization: Bearer $T" \
  -H 'content-type: application/json' \
  -d '{"ngo_name":"Asha Trust","title":"Mobile Health Clinics","sector":"health","region":"Bihar","requested_amount":480000,"beneficiaries":1200}' \
  | python -m json.tool

echo "== allocate (optimizer) =="
curl -s -X POST "$BASE/allocate?total_budget=1500000" -H "authorization: Bearer $T" \
  | python -c "import sys,json;d=json.load(sys.stdin);print('solver',d['solver'],'| funded',len(d['funded']),'| spent',d['spent'],'| beneficiaries',d['total_beneficiaries'])"

echo "== optimizer vs ranked list =="
curl -s -X POST "$BASE/allocate/compare?total_budget=800000" -H "authorization: Bearer $T" \
  | python -c "import sys,json;print(json.load(sys.stdin)['headline'])"

echo "== stats =="
curl -s "$BASE/stats" | python -m json.tool
