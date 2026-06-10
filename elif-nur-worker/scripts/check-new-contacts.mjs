#!/usr/bin/env node
/**
 * List contact form submissions from the last N hours (default 1).
 * Exits 0 with no output when empty; prints JSON array to stdout when found.
 *
 * Usage: node scripts/check-new-contacts.mjs [hours]
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hours = Number(process.argv[2] ?? "1");
const sql = `SELECT id, name, email, substr(message, 1, 120) AS message_preview, created_at FROM contact_submissions WHERE created_at > datetime('now', '-${hours} hour') ORDER BY id DESC`;

const out = execSync(
	`npx wrangler d1 execute elif-nur-db --remote --json --command ${JSON.stringify(sql)}`,
	{ cwd: root, encoding: "utf8", env: process.env },
);

const payload = JSON.parse(out);
const rows = payload[0]?.results ?? [];

if (!rows.length) {
	process.exit(1);
}

process.stdout.write(JSON.stringify(rows, null, 2));
