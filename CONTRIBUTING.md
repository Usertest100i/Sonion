# Contributing

Relay's current scope is a local, explainable coordination demo. Keep contributions small enough for a reviewer to understand the trigger, changed behavior, and evidence.

1. Use Node.js 22 or newer. Run `npm start` and reproduce the behavior with fictional reports.
2. Make one focused change. Keep the runtime dependency-free unless a dependency resolves a documented requirement.
3. Add or adjust meaningful tests for changes to validation, persistence, API behavior, or failure recovery.
4. Run `npm test` and `npm run check`. For UI changes, run `npm run test:browser` after the optional Playwright setup in the README, then inspect the screenshots and keyboard flow.
5. Describe the concrete before/after behavior, validation performed, and known limitations in the pull request. Include viewport dimensions for layout changes.

Do not commit `data/`, real incident reports, credentials, browser profiles, or private exports. Do not claim adoption, users, benchmarks, accessibility conformance, or program eligibility without evidence.

Useful contributions include idempotent writes, optimistic concurrency, persistent backups and restore, accessible live updates, and validation of the scoring model with community coordinators. Authentication and shared deployment require a separate security design.

By submitting code, you agree that your contribution may be distributed under the repository's MIT license. Security reports follow [SECURITY.md](SECURITY.md).
