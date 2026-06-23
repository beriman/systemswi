#!/bin/bash
set -e

BASE="http://localhost:3000"

echo "=== Test 1: GET /api/production/analytics ==="
R1=$(curl -s -o /tmp/r1.json -w "%{http_code}" "$BASE/api/production/analytics")
echo "Status: $R1"
cat /tmp/r1.json
echo ""

echo "=== Test 2: GET /api/production/yield ==="
R2=$(curl -s -o /tmp/r2.json -w "%{http_code}" "$BASE/api/production/yield")
echo "Status: $R2"
cat /tmp/r2.json | head -c 500
echo ""

echo "=== Test 3: GET /api/production/cost-variance ==="
R3=$(curl -s -o /tmp/r3.json -w "%{http_code}" "$BASE/api/production/cost-variance")
echo "Status: $R3"
cat /tmp/r3.json | head -c 500
echo ""

echo "=== Test 4: GET /api/production/waste ==="
R4=$(curl -s -o /tmp/r4.json -w "%{http_code}" "$BASE/api/production/waste")
echo "Status: $R4"
cat /tmp/r4.json | head -c 500
echo ""

echo "=== Test 5: POST /api/production/waste ==="
R5=$(curl -s -o /tmp/r5.json -w "%{http_code}" -X POST "$BASE/api/production/waste" \
  -H "Content-Type: application/json" \
  -d '{"productionId":"PROD-TEST-001","batchCode":"BATCH-TEST-001","brand":"Test Brand","product":"Test Product","qtyRejected":5,"reason":"Test reason","disposition":"Scrap","costImpact":100000,"notes":"Test waste event"}')
echo "Status: $R5"
cat /tmp/r5.json
echo ""

echo "=== Test 6: GET /api/production/monthly ==="
R6=$(curl -s -o /tmp/r6.json -w "%{http_code}" "$BASE/api/production/monthly")
echo "Status: $R6"
cat /tmp/r6.json | head -c 500
echo ""

echo "=== Test 7: GET /api/production/timeline ==="
R7=$(curl -s -o /tmp/r7.json -w "%{http_code}" "$BASE/api/production/timeline")
echo "Status: $R7"
cat /tmp/r7.json | head -c 500
echo ""

echo "=== Test 8: GET /production-analytics page ==="
R8=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/production-analytics")
echo "Status: $R8"

echo ""
echo "=== SUMMARY ==="
echo "Analytics: $R1"
echo "Yield: $R2"
echo "Cost Variance: $R3"
echo "Waste GET: $R4"
echo "Waste POST: $R5"
echo "Monthly: $R6"
echo "Timeline: $R7"
echo "UI Page: $R8"
