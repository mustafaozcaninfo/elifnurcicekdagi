#!/usr/bin/env node
/**
 * Set Web Analytics beacon token on the Worker (required for Workers — auto-inject does not apply).
 *
 * 1. Cloudflare Dashboard → Web Analytics → Manage site → copy token from JS snippet
 * 2. Add to all.env: CF_WEB_ANALYTICS_TOKEN=your_token
 * 3. node scripts/apply-analytics-token.mjs
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.CF_WEB_ANALYTICS_TOKEN?.trim();

if (!token) {
	console.error("CF_WEB_ANALYTICS_TOKEN required (add to all.env or export)");
	process.exit(1);
}

execSync(`npx wrangler secret put CF_WEB_ANALYTICS_TOKEN`, {
	cwd: root,
	stdio: ["pipe", "inherit", "inherit"],
	input: token,
});
console.log("set CF_WEB_ANALYTICS_TOKEN secret");

execSync("npx wrangler deploy", { cwd: root, stdio: "inherit" });
console.log("deployed with Web Analytics beacon");
