# API and persistence

Base URL: `http://localhost:3000`. The app and API share one origin. JSON errors use `{ "error": "message" }`. There is no authentication; this API is for a local fictional demo.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/reports` | Ranked `reports`, available `teams`, and `categories` |
| POST | `/api/reports` | Create a report; `201` with `{ report }` |
| PATCH | `/api/reports/:id` | Update assignment/status; `200` with `{ report }` |

Create example:

```sh
curl http://localhost:3000/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"title":"Blocked library ramp","description":"A fictional branch blocks the ramp.","location":"West library","category":"Access","impact":25,"urgency":3,"x":25,"y":40}'
```

Use the returned ID in a PATCH request with `{"status":"Assigned","team":"Access team"}`. Use `{"status":"Resolved"}` to resolve or `{"status":"Open"}` to reopen; both clear the team. Assigned reports require a recognized team. Repeated accepted updates add repeated history entries.

| Field | Accepted value |
| --- | --- |
| `title` | Trimmed, nonblank text; at most 100 characters |
| `description` | Trimmed, nonblank text; at most 1,000 characters |
| `location` | Trimmed, nonblank text; at most 100 characters |
| `category` | Infrastructure, Supplies, Access, or Community |
| `impact` | Integer from 1 to 1,000 |
| `urgency` | Integer 1, 2, or 3 |
| `x`, `y` | Finite numbers from 0 to 100 on the illustrative map |

IDs, initial status, team, creation time, and history are server-owned on create. A score is derived on reads and responses. Invalid JSON or fields return 400; a disallowed origin/host returns 403; an unknown report returns 404; unsupported methods return 405; capacity returns 409; oversized bodies return 413; filesystem failures return 500.

## Storage contract

Successful mutations serialize the whole report array to `data/reports.json.tmp`, rename it to `data/reports.json`, and then replace in-memory state. A promise queue serializes mutations in one server process. Reads during a write see the prior committed in-memory state.

The stored file contains the report array, whereas the browser export contains an object with `exportedAt` and `reports`. An export is not a drop-in database restore. Keep copies of the actual data file for manual backup, with the server stopped to avoid copying during replacement.

Only one server process may own a data directory. There are no cross-process locks, fsync guarantees, migrations, version checks, idempotency keys, or automatic backup rotation. The last accepted status update wins. A network failure after a write may hide a successful result from the client; inspect the queue before retrying a create.
