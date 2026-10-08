# Relay

**Small signals. Collective action.**

Relay is a local community-operations prototype that turns scattered reports into a visible queue, an explainable priority score, and a team assignment. A coordinator can move an issue from report to resolution in one screen.

Built for a live hackathon demo: no API keys, no account setup, no database service, and no runtime dependencies. Six fictional reports make the first launch useful immediately.

## Run it

Install Node.js 22 or newer, unzip this repository, then run:

```sh
cd relay
npm start
```

Open **http://localhost:3000**. No `npm install` is needed to run the app or its core tests. To choose another port on macOS/Linux, use `PORT=3001 npm start`; on PowerShell, use `$env:PORT=3001; npm start`.

## What works

- Report an issue with location, category, urgency, and reported reach.
- Inspect active signals on a schematic neighbourhood map.
- Search the queue and filter by status or category.
- See both contributions to every priority score.
- Assign one of four teams, resolve an issue, or reopen it.
- Follow team workloads, activity, and derived dashboard totals.
- Refresh or restart after a successful save: reports persist in a local JSON file.
- Export the current browser snapshot as JSON.
- Retain form text after a failed save, with periodic connection retries.

The layout includes desktop, tablet, and phone breakpoints, keyboard focus styles, labelled controls, native dialogs, reduced-motion support, and text descriptions of priority. Browser execution and accessibility auditing are still required; see [verification](docs/VERIFICATION.md).

## The 90-second demo

1. **0–15s — Problem:** “Useful community reports disappear into chats. Relay gives a coordinator one shared picture.”
2. **15–35s — Signal:** Create “Blocked library ramp,” choose Access, urgency 3, and 25 people. The score is **80**: 60 urgency points and 20 reach points.
3. **35–55s — Explanation:** Select the signal, show the score breakdown, and explain that a human makes the decision.
4. **55–75s — Action:** Assign Access team, show its workload, then mark the signal resolved. The queue and counters update.
5. **75–90s — Evidence:** Refresh, switch to Resolved, reopen the signal, and export the workspace.

[Presenter notes and recovery steps](docs/DEMO.md) include a fallback if the browser cannot connect.

## Transparent ranking

```text
urgency points = urgency × 20                     (20–60)
reach points   = min(40, round(sqrt(impact) × 4))   (4–40)
priority       = urgency points + reach points    (24–100)
```

High starts at 80, Medium at 50, and Low is below 50. Equal scores rank oldest first. The square root makes reported reach contribute less aggressively as its value increases. These are illustrative product choices, not a validated measure of need. Reported people may overlap across issues. The score does not assess truth, vulnerability, safety, or resource availability.

This version uses deterministic rules. It does not call an AI model, dispatch emergency responders, or make autonomous operational decisions.

## Verify it

```sh
npm test
npm run check
```

**Recorded result: 30/30 core tests passed on Node 24.19.0.** The checks cover validation, scoring, API behavior, concurrent writes, restart persistence, disk failure and recovery, corrupted stores, capacity, and local-request restrictions.

Eight additional browser scenarios are supplied separately:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:browser
```

They create isolated temporary data and generate `docs/preview.png` and `docs/mobile.png`. **They were not run successfully in the preparation environment because Chromium was unavailable and the browser download failed.** No screenshot or visual-pass claim is included. CI is configured for Node 22/24 core checks plus Chromium browser checks; that workflow has not yet run on GitHub.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/domain.js` | Input validation, scoring, ranking, fictional seed data |
| `src/server.js` | Local HTTP API, static-file allowlist, queued atomic file replacement |
| `public/app.js` | Dashboard state, rendering, actions, retries, JSON export |
| `public/style.css` | Responsive visual system and focus states |
| `test/app.test.js` | 30 executable core checks |
| `scripts/browser-check.cjs` | Eight optional browser scenarios |

The server binds to loopback. Writes are serialized within one process and saved to a temporary file before rename. In-memory state changes only after the rename succeeds. A failed write leaves the existing state intact, and the next request can retry. An invalid existing store causes startup to fail without replacing the file. [API and persistence details](docs/API.md).

## Scope and next steps

This is a local demonstration with fictional data. There is no authentication, authorization, synchronization between server processes, durable job queue, audit attribution, database migration system, or automatic backup. The activity log records actions but is not tamper-proof. Atomic replacement is not a guarantee against power-loss data loss. A timed-out create might have reached the server, so inspect the queue before retrying.

Before real community use, validate the workflow with coordinators, add identity and permissions, move to a transactional database, add idempotency and conflict detection, verify accessibility, define retention, and test backup restoration. [Security boundaries](SECURITY.md).

## Contribute and publish

See [CONTRIBUTING.md](CONTRIBUTING.md). This source is MIT licensed. It has not been published to GitHub or deployed by this delivery. After creating your repository, run the configured CI, inspect both generated screenshots, enable private vulnerability reporting, and add your project URL and contact details.

For the separate Claude subscription question, see [Claude for Open Source](docs/OPEN_SOURCE_PROGRAM.md). A new repository alone does not establish eligibility or guarantee acceptance.
