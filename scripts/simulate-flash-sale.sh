#!/usr/bin/env bash
# ==========================================================
# PulsePass: Flash Sale Concurrency Stress Test (Bash / curl)
# ==========================================================

BASE_URL="http://localhost:8080"
EVENT_ID=1
SEAT_ID=5
CONCURRENT_REQUESTS=20

echo "=========================================================="
echo "   PULSEPASS: DISTRIBUTED FLASH SALE CONCURRENCY TEST     "
echo "=========================================================="

echo "[1/3] Authenticating test clients..."
TOKEN1=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@platform.com","password":"customer123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

TOKEN2=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@example.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN1" ]; then
  echo "Error: Failed to obtain auth token. Is the backend running at $BASE_URL?"
  exit 1
fi

echo "Tokens obtained successfully."
echo "[2/3] Dispatching $CONCURRENT_REQUESTS parallel lock attempts for Seat $SEAT_ID..."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for i in $(seq 1 $CONCURRENT_REQUESTS); do
  TOKEN=$TOKEN1
  if [ $((i % 2)) -eq 0 ]; then
    TOKEN=$TOKEN2
  fi

  (
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      "$BASE_URL/api/v1/events/$EVENT_ID/seats/lock" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"seatIds\":[$SEAT_ID]}")
    echo "$HTTP_CODE" >> "$TMPDIR/results.txt"
  ) &
done

wait

echo "[3/3] Results:"
SUCCESS_COUNT=$(grep -c "200" "$TMPDIR/results.txt" || true)
CONFLICT_COUNT=$(grep -c "409" "$TMPDIR/results.txt" || true)

echo "Successful Locks (200 OK): $SUCCESS_COUNT (Expected: 1)"
echo "Conflicts (409 Conflict) : $CONFLICT_COUNT (Expected: $((CONCURRENT_REQUESTS - 1)))"

if [ "$SUCCESS_COUNT" -eq 1 ]; then
  echo "VERIFICATION PASSED: ZERO DOUBLE-ALLOCATIONS DETECTED."
else
  echo "VERIFICATION FAILED: Inconsistent state detected."
fi
