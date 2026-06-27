#!/usr/bin/env node
/**
 * Bulk-import flight log into D1 via Admin Travel Map API.
 *
 * Usage:
 *   source ../../all.env && node scripts/import-flights-d1.mjs
 *   node scripts/import-flights-d1.mjs --dry-run
 *
 * Reads /tmp/flight-stats-parsed.json, or scripts/flight-stats-parsed.json as fallback.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";
const KEY = process.env.ADMIN_API_KEY?.trim();
const dryRun = process.argv.includes("--dry-run");

const INPUT_CANDIDATES = [
	"/tmp/flight-stats-parsed.json",
	join(__dir, "flight-stats-parsed.json"),
];

if (!KEY && !dryRun) {
	console.error("ADMIN_API_KEY required (source ../../all.env or set in environment)");
	process.exit(1);
}

const inputPath = INPUT_CANDIDATES.find((p) => existsSync(p));
if (!inputPath) {
	console.error("Flight stats file not found. Tried:\n ", INPUT_CANDIDATES.join("\n  "));
	process.exit(1);
}

const headers = {
	Authorization: `Bearer ${KEY}`,
	"Content-Type": "application/json",
};

async function api(method, path, body) {
	const res = await fetch(`${SITE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	const json = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, json };
}

const flightData = JSON.parse(readFileSync(inputPath, "utf8"));
const routes = flightData.routes ?? flightData.flights ?? [];

const flights = routes.map((r) => ({
	flightNumber: r.flightNumber ?? r.flight,
	fromIata: r.fromIata ?? r.from,
	toIata: r.toIata ?? r.to,
	blockHrs: r.blockHrs ?? null,
	acReg: r.acReg ?? r.ac_reg ?? null,
}));

console.log(`Importing ${flights.length} flights from ${inputPath}${dryRun ? " (dry run)" : ""}`);

if (dryRun) {
	console.log("Sample:", flights.slice(0, 3));
	process.exit(0);
}

const result = await api("POST", "/api/v1/admin/travel-map/flights/import", { flights });
if (!result.ok) {
	console.error("Import failed", result.status, result.json);
	process.exit(1);
}

console.log("Import complete:", result.json?.data ?? result.json);
