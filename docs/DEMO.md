# Presenter notes

## Before presenting

Start the app with `npm start`, open http://localhost:3000, and confirm six active seed signals in a fresh workspace. Verify the browser workflow on the presentation machine. Use fictional information throughout.

Existing saved reports are loaded from `data/reports.json`. For a fresh demo, stop the server and move the entire `data` directory to a backup location, then restart. Do not delete a workspace you need to retain. A fresh seed remains in memory until the first successful mutation saves the workspace.

## Talk track

“A report only helps if someone can see it, understand it, and take responsibility. Relay puts those three steps together. Its ranking exposes its reasoning, the coordinator chooses the team, and each action updates the shared picture.”

Create a blocked library ramp with urgency 3 and impact 25. Show its 80-point score, assign Access team, resolve it, refresh, find it under Resolved, and reopen it. Export JSON to demonstrate that the data is portable. The export represents the last loaded browser state, not a guaranteed simultaneous server snapshot.

Do not describe the schematic map as geocoding or navigation. The map shows all active reports; queue search and category filters apply to the queue. Do not present the score as AI, a prediction, a safety assessment, or an automatic allocation decision.

## Recovery during a demo

| Symptom | Action |
| --- | --- |
| Port 3000 already in use | Stop the other process or choose `PORT=3001 npm start` on macOS/Linux. |
| Connection indicator says offline | Ensure the terminal server is running, wait for the 15-second refresh or refresh the page. |
| Save failed | The form remains filled. Restore connectivity or disk access, inspect the queue for a completed request, and retry if absent. |
| Startup rejects stored data | Keep the original file. Stop the server and restore a verified backup, or move the data directory aside for a new fictional workspace. |
| Browser setup fails | Core tests still run without browser dependencies. Do not claim browser checks passed. |

The retry mechanism reloads data; it does not repair source code, resolve infrastructure outages, or autonomously change operational priorities. Polling pauses while the report dialog is open or a focus-panel control has focus.
