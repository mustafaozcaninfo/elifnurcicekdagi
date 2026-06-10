#!/usr/bin/env node
/**
 * Set BREVO_API_KEY on the Worker for contact form notifications.
 * Usage: source ../../all.env && node scripts/apply-brevo-secret.mjs
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.BREVO_API_KEY?.trim();

if (!key) {
	console.error("BREVO_API_KEY required (add to all.env)");
	process.exit(1);
}

execSync("npx wrangler secret put BREVO_API_KEY", {
	cwd: root,
	stdio: ["pipe", "inherit", "inherit"],
	input: key,
});
console.log("set BREVO_API_KEY secret on Worker");
