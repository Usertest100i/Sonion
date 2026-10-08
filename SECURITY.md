# Security

Relay is designed for a local demonstration with fictional information. Keep the server bound to loopback and do not expose it through a tunnel, proxy, or public network.

## Existing controls

- Explicit validation and bounds for report fields and status changes.
- A 16 KiB request-body limit and 1,000-report capacity limit.
- A static-file allowlist that does not serve the data directory.
- Escaped user text in HTML rendering and a restrictive Content Security Policy.
- Rejection of unexpected HTTP Host names and cross-origin writes with an Origin header.
- Serialized writes within a single process; memory updates only after file replacement succeeds.
- Startup refusal for malformed or structurally invalid saved reports.

These measures do not provide authentication. Any local process can call the API. A client without an Origin header is accepted. Do not run multiple server processes against the same data directory. There is no rate limiter, per-user attribution, encryption at rest, signed audit trail, or verified backup process. No penetration test or complete accessibility audit has been performed.

## Reporting a vulnerability

After the repository is published, use its GitHub **Security → Report a vulnerability** control if the owner has enabled it. If that control is unavailable, contact the repository owner privately through a contact they provide. No security email address or response-time commitment has been established for this unpublished project.

Include reproduction steps, affected behavior, and a minimal fictional example. Do not place secrets or sensitive incident data in a public issue. For ordinary bugs with no sensitive details, open a normal issue after publication.
