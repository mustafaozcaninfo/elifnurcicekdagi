#!/usr/bin/env node
/**
 * Set Web Analytics beacon token on the Worker (required for Workers — auto-inject does not apply).
 *
 * 1. Cloudflare Dashboard → Web Analytics → Manage site → copy token from JS snippet
 * 2. Add to all.env: CF_WEB_ANALYTICS_TOKEN=your_token
 * 3. node scripts/apply-analytics-token.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.CF_WEB_ANALYTICS_TOKEN;

if (!token?.trim()) {
	console.error("CF_WEB_ANALYTICS_TOKEN required (add to all.env or export)");
	process.exit(1);
}

const wranglerPath = join(root, "wrangler.jsonc");
let config = readFileSync(wranglerPath, "utf8");

const varLine = `\t\t"CF_WEB_ANALYTICS_TOKEN": "${token.trim()}"`;
if (config.includes("CF_WEB_ANALYTICS_TOKEN")) {
	config = config.replace(
		/"CF_WEB_ANALYTICS_TOKEN":\s*"[^"]*"/,
		`"CF_WEB_ANALYTICS_TOKEN": "${token.trim()}"`,
	);
} else {
	config = config.replace(
		/"CONTACT_NOTIFY_EMAIL":\s*"[^"]*"/,
		(match) => `${match},\n${varLine}`,
	);
}

writeFileSync(wranglerPath, config);
console.log("updated wrangler.jsonc CF_WEB_ANALYTICS_TOKEN");

execSync("npx wrangler deploy", { cwd: root, stdio: "inherit" });
console.log("deployed with Web Analytics beacon");
