#!/usr/bin/env node
/**
 * Set ADMIN_API_KEY on the Worker for content API admin routes.
 * Usage: source ../../all.env && node scripts/apply-admin-secret.mjs
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.ADMIN_API_KEY?.trim();

if (!key) {
	console.error("ADMIN_API_KEY required (add to all.env or: openssl rand -hex 32)");
	process.exit(1);
}

execSync("npx wrangler secret put ADMIN_API_KEY", {
	cwd: root,
	stdio: ["pipe", "inherit", "inherit"],
	input: key,
});
console.log("set ADMIN_API_KEY secret on Worker");
