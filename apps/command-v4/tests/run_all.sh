#!/bin/bash
# Runs every browser suite and the server/maintenance tests; exits 1 if any suite exits non-zero or prints a FAIL line.
# Usage (from apps/command-v4, fixture API on 127.0.0.1:8765 for connected suites):
#   bash tests/run_all.sh [logdir]          RADAR_HTML=path/to/other.html bash tests/run_all.sh   (test another build)
cd "$(dirname "$0")/.." || exit 1
LOG=${1:-/tmp/radar-test-logs}; mkdir -p "$LOG"; BAD=0
# the connected suites need the fixture API (apps/api/tests/e2e_server.py, TEST FIXTURE data) on 127.0.0.1:8765
if ! curl -s -o /dev/null 127.0.0.1:8765/api/v1/online/status; then
  (cd ../api && PYTHONPATH=".:${PYTHONPATH:-}" python3 tests/e2e_server.py > "$LOG/e2e_server.log" 2>&1) & SRV=$!
  trap 'kill $SRV 2>/dev/null' EXIT
  for i in $(seq 1 60); do curl -s -o /dev/null 127.0.0.1:8765/api/v1/online/status && break; sleep 0.5; done
fi
for t in v49_fixes v49_changes v48_quality v48 v47 v46_online connected v44 nav v45_visual v45_fix v45_assistant assistant review nin; do
  timeout 900 node "tests/$t.js" > "$LOG/$t.log" 2>&1; ec=$?
  p=$(grep -c '^PASS' "$LOG/$t.log"); f=$(grep -c '^FAIL' "$LOG/$t.log")
  echo "$t: $p passed, $f failed, exit $ec"
  if [ "$ec" != 0 ] || [ "$f" != 0 ]; then BAD=1; fi
done
# Presentation preferences and bilingual UI have their own browser acceptance suites.
for t in v492_interface v493_interface_browser v494_bilingual_browser v495_popovers; do
  timeout 900 node "tests/$t.cjs" > "$LOG/$t.log" 2>&1; ec=$?
  p=$(grep -c '^PASS' "$LOG/$t.log"); f=$(grep -c '^FAIL' "$LOG/$t.log")
  echo "$t: $p passed, $f failed, exit $ec"
  if [ "$ec" != 0 ] || [ "$f" != 0 ]; then BAD=1; fi
done
# An early browser/process exit must not pass a partly executed changes suite.
if [ "$(grep -c '^PASS' "$LOG/v49_fixes.log")" -lt 16 ]; then echo "FAIL: v49_fixes did not complete all 16 checks"; BAD=1; fi
for m in test_ppt_spacing.cjs report-regression.cjs; do node "../../tests/maintenance/$m" > "$LOG/$m.log" 2>&1; ec=$?; echo "$m: exit $ec"; [ "$ec" != 0 ] && BAD=1; done
(cd ../.. && python3 -m pytest -q tests/maintenance/test_promote.py tests/maintenance/test_prepare_v49.py > "$LOG/maintenance-pytest.log" 2>&1); ec=$?; echo "maintenance pytest: $(tail -1 "$LOG/maintenance-pytest.log") (exit $ec)"; [ "$ec" != 0 ] && BAD=1
(cd ../api && python3 -m pytest -q ../../tests/maintenance/test_guards.py > "$LOG/guards.log" 2>&1); ec=$?; echo "test_guards: $(tail -1 "$LOG/guards.log") (exit $ec)"; [ "$ec" != 0 ] && BAD=1
(cd ../api && python3 -m pytest -q > "$LOG/api-pytest.log" 2>&1); ec=$?; echo "api pytest: $(tail -1 "$LOG/api-pytest.log") (exit $ec)"; [ "$ec" != 0 ] && BAD=1
echo "OVERALL: $([ $BAD = 0 ] && echo PASS || echo FAIL)"
exit $BAD
