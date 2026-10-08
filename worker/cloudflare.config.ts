import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	accountId: "ddf64a1c420a1502883e2f9887e183a4",
	worker: {
		name: "relay",
		compatibilityDate: "2026-10-07",
		entrypoint,
		env: {
			REPORTS_KV: bindings.kv({ id: "7faf00a3d84d4e18b939b155693e535a" }),
		},
	},
});
