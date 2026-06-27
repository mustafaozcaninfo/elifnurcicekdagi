#!/usr/bin/env node
/**
 * Import flight-stats cities/countries via Admin Travel Map API.
 *
 * Usage:
 *   source ../../all.env && node scripts/import-flight-stats.mjs
 *   node scripts/import-flight-stats.mjs --dry-run
 *
 * Regenerate data first:
 *   python3 scripts/build-flight-stats-import.py
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";
const KEY = process.env.ADMIN_API_KEY?.trim();
const dryRun = process.argv.includes("--dry-run");

if (!KEY && !dryRun) {
	console.error("ADMIN_API_KEY required (source ../../all.env or set in environment)");
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

function assertOk(result, label) {
	if (!result.ok && result.status !== 409) {
		console.error(label, result.status, result.json);
		throw new Error(`API ${result.status}`);
	}
}

const payload = JSON.parse(
	readFileSync(join(__dir, "flight-stats-import.json"), "utf8"),
);

console.log(
	`Importing ${payload.countries.length} countries, ${payload.cities.length} cities` +
		(dryRun ? " (dry run)" : ""),
);

for (const country of payload.countries) {
	const body = {
		iso2: country.iso2,
		name: country.name,
		visited: country.visited ?? true,
		color: country.color,
	};
	if (dryRun) {
		console.log("country", body.iso2, body.name);
		continue;
	}
	const result = await api("POST", "/api/v1/admin/travel-map/countries", body);
	if (result.status === 409) {
		console.log("country exists", country.iso2);
	} else {
		assertOk(result, `country ${country.iso2}`);
		console.log("country create", country.iso2, country.name);
	}
}

for (const city of payload.cities) {
	const body = {
		id: city.id,
		name: city.name,
		country: city.country,
		countryName: city.countryName,
		lat: city.lat,
		lng: city.lng,
		role: city.role ?? "visited",
		airportCode: city.airportCode,
		note: city.note,
	};
	if (city.visitedWith) body.visitedWith = city.visitedWith;

	if (dryRun) {
		console.log("city", body.airportCode, "→", body.id, body.name);
		continue;
	}
	const result = await api("POST", "/api/v1/admin/travel-map/cities", body);
	if (result.status === 409) {
		console.log("city exists", city.id);
	} else {
		assertOk(result, `city ${city.id}`);
		console.log("city create", city.airportCode, city.name);
	}
}

console.log("import complete");
