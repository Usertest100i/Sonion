# Verification record

Prepared on 2026-10-08 with Node 24.19.0. Core suite: **30 passed, 0 failed, 0 skipped**. JavaScript syntax checks passed. These are focused functional checks, not proof of production readiness or complete coverage.

## Executed checks

| Check | Result |
| --- | --- |
| 01 Valid reports are normalized | Pass |
| 02 Blank titles are rejected | Pass |
| 03 Oversized descriptions are rejected | Pass |
| 04 Unknown categories are rejected | Pass |
| 05 Fractional reported impact is rejected | Pass |
| 06 Negative reported impact is rejected | Pass |
| 07 Out-of-range urgency is rejected | Pass |
| 08 Nonfinite coordinates are rejected | Pass |
| 09 Map bounds are enforced | Pass |
| 10 Null input is rejected | Pass |
| 11 Priority score saturates at 100 | Pass |
| 12 Increasing urgency raises priority | Pass |
| 13 Score exposes both contributing factors | Pass |
| 14 Ranking puts highest priority first | Pass |
| 15 Assignment requires a recognized team | Pass |
| 16 Resolving clears assignment | Pass |
| 17 API starts with six fictional reports | Pass |
| 18 Create, assign, resolve and persist an audit trail | Pass |
| 19 Cross-origin writes are blocked | Pass |
| 20 Static file allowlist prevents data exposure | Pass |
| 21 Malformed JSON and oversized bodies are rejected | Pass |
| 22 Concurrent creates survive a server restart | Pass |
| 23 Updating an unknown report returns 404 | Pass |
| 24 Invalid updates cannot change an existing report | Pass |
| 25 Disk failure leaves memory intact and the next save can recover | Pass |
| 26 Corrupt and structurally invalid stores fail without overwriting data | Pass |
| 27 Unexpected Host names cannot reach the local API | Pass |
| 28 Equal priorities rank oldest first without mutating input | Pass |
| 29 The 1000-report capacity returns a conflict without writing | Pass |
| 30 User text remains JSON data and cannot inject server-owned fields | Pass |

## Additional browser checks — not executed successfully

Chromium was not installed in the preparation environment. The installer returned invalid/truncated downloads. The browser runner therefore stopped before its first scenario. These scenarios are provided and configured in GitHub CI, but no browser pass, visual inspection, screenshot, or accessibility-conformance claim is made.

| Scenario | Result |
| --- | --- |
| B01 Desktop dashboard and six map markers | Not run |
| B02 Search and empty state | Not run |
| B03 Report creation and escaped user text | Not run |
| B04 Team assignment, resolution and reopening | Not run |
| B05 JSON export includes created report | Not run |
| B06 Phone layout at 390px has no horizontal overflow | Not run |
| B07 Tablet layout at 820px has no horizontal overflow | Not run |
| B08 Failed saves preserve form input; reconnect succeeds without page errors | Not run |

## Reproduce

Run `npm test` and `npm run check`. For browser checks, follow the optional Playwright setup in the README and run `npm run test:browser`. The runner creates an isolated temporary workspace, removes it after execution, and writes desktop/mobile screenshots under `docs/` when those scenarios complete. Review those images before presenting. GitHub CI has not been run yet, and Node 22 compatibility is configured but was not executed locally.

## Evidence limits

The core tests exercise real HTTP requests and filesystem persistence. The disk-failure test deliberately prevents a temporary write, verifies that memory stays unchanged, removes the obstruction, and verifies the next save succeeds. Concurrency checks cover one Node process only. Security-header and escaping checks are not a penetration test. No real users, field trial, benchmarks, awards, or open-source adoption are claimed.
