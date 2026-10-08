import {
	validateReport,
	validateUpdate,
	ranked,
	seed,
	teams,
	categories,
} from "./domain.js";

interface Env {
	REPORTS_KV: KVNamespace;
}

const STORE_KEY = "reports";
const MAX_BODY_BYTES = 16384;
const MAX_REPORTS = 1000;

const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy":
		"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer",
	"Cache-Control": "no-store",
};

function send(status: number, data: unknown): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" },
	});
}

async function loadReports(env: Env): Promise<any[]> {
	const raw = await env.REPORTS_KV.get(STORE_KEY);
	if (raw == null) {
		const fresh = seed();
		await env.REPORTS_KV.put(STORE_KEY, JSON.stringify(fresh));
		return fresh;
	}
	const reports = JSON.parse(raw);
	if (!Array.isArray(reports) || reports.length > MAX_REPORTS) {
		throw new Error("Invalid database.");
	}
	return reports;
}

async function saveReports(env: Env, reports: any[]): Promise<void> {
	await env.REPORTS_KV.put(STORE_KEY, JSON.stringify(reports));
}

async function readBody(request: Request): Promise<any> {
	const text = await request.text();
	if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
		const error = new Error("Report is too large.") as Error & { status?: number };
		error.status = 413;
		throw error;
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new Error("Invalid JSON.");
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		try {
			// Same-origin check for writes (the public https origin passes).
			if (request.method !== "GET") {
				const origin = request.headers.get("origin");
				const host = url.host;
				if (
					origin &&
					origin !== `https://${host}` &&
					origin !== `http://${host}`
				) {
					return send(403, { error: "Cross-origin writes are blocked." });
				}
			}

			if (request.method === "GET" && url.pathname === "/api/reports") {
				const reports = await loadReports(env);
				return send(200, { reports: ranked(reports), teams, categories });
			}

			if (request.method === "POST" && url.pathname === "/api/reports") {
				const value = validateReport(await readBody(request));
				const reports = await loadReports(env);
				if (reports.length >= MAX_REPORTS) {
					return send(409, { error: "Demo capacity reached." });
				}
				const now = new Date().toISOString();
				const report = {
					...value,
					id: crypto.randomUUID(),
					createdAt: now,
					status: "Open",
					team: null,
					history: [{ at: now, action: "Report created" }],
				};
				await saveReports(env, [...reports, report]);
				return send(201, { report: ranked([report])[0] });
			}

			if (
				request.method === "PATCH" &&
				url.pathname.startsWith("/api/reports/")
			) {
				const value = validateUpdate(await readBody(request));
				const id = url.pathname.split("/").at(-1);
				const reports = await loadReports(env);
				const current = reports.find((r) => r.id === id);
				if (!current) return send(404, { error: "Report not found." });
				const now = new Date().toISOString();
				const updated = {
					...current,
					...value,
					history: [
						...current.history,
						{
							at: now,
							action: `${value.status}${value.team ? " · " + value.team : ""}`,
						},
					],
				};
				await saveReports(
					env,
					reports.map((r) => (r.id === id ? updated : r)),
				);
				return send(200, { report: ranked([updated])[0] });
			}

			// Not an API route: static assets handle the page itself.
			return new Response("Not found.", {
				status: 404,
				headers: SECURITY_HEADERS,
			});
		} catch (e: any) {
			return send(e.status || 400, {
				error: e.message || "Could not save or read data.",
			});
		}
	},
} satisfies ExportedHandler<Env>;
