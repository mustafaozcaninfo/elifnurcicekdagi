#!/usr/bin/env node
/**
 * Audit + fix travel map: country names, ISO2, flight log notes on existing cities.
 *
 *   source ../../all.env && node scripts/audit-and-fix-travel-map.mjs
 *   node scripts/audit-and-fix-travel-map.mjs --dry-run
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";
const KEY = process.env.ADMIN_API_KEY?.trim();
const dryRun = process.argv.includes("--dry-run");

const ISO_NAMES = {
	AD: "Andorra",
	AE: "United Arab Emirates",
	AR: "Argentina",
	AT: "Austria",
	AU: "Australia",
	BD: "Bangladesh",
	BE: "Belgium",
	BR: "Brazil",
	CA: "Canada",
	CH: "Switzerland",
	CL: "Chile",
	CN: "China",
	CO: "Colombia",
	CZ: "Czech Republic",
	DE: "Germany",
	EC: "Ecuador",
	EG: "Egypt",
	ES: "Spain",
	FR: "France",
	GB: "United Kingdom",
	GR: "Greece",
	HK: "Hong Kong",
	HU: "Hungary",
	IL: "Israel",
	IN: "India",
	IQ: "Iraq",
	IT: "Italy",
	JO: "Jordan",
	JP: "Japan",
	KE: "Kenya",
	KR: "South Korea",
	KW: "Kuwait",
	MO: "Macau",
	MV: "Maldives",
	MX: "Mexico",
	MY: "Malaysia",
	NG: "Nigeria",
	NL: "Netherlands",
	NO: "Norway",
	NZ: "New Zealand",
	PA: "Panama",
	PH: "Philippines",
	PK: "Pakistan",
	PL: "Poland",
	PT: "Portugal",
	QA: "Qatar",
	SA: "Saudi Arabia",
	SC: "Seychelles",
	SE: "Sweden",
	SG: "Singapore",
	TH: "Thailand",
	TR: "Turkey",
	TW: "Taiwan",
	UG: "Uganda",
	US: "United States",
	VA: "Vatican City",
	ZA: "South Africa",
};

/** mwgg IATA → expected ISO2 (overrides for tri-border / metro) */
const IATA_ISO = {
	BSL: "CH",
};

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

function stripFlightStats(note) {
	if (!note) return "";
	return note
		.replace(/\s*·\s*\d+\s+sectors?\s*·\s*[\d.]+\s+block\s+hrs?/gi, "")
		.replace(/\s*·\s*QR network\s*·\s*\d+\s+sectors?.*$/i, "")
		.trim();
}

function appendFlightStats(base, sectors, blockHrs) {
	const clean = stripFlightStats(base);
	const stats = `${sectors} sectors · ${blockHrs.toFixed(1)} block hrs`;
	return clean ? `${clean} · ${stats}` : stats;
}

function computeAirportStats(routes) {
	const stats = new Map();
	for (const r of routes) {
		const block = Number(r.blockHrs) || 0;
		for (const ap of [r.from, r.to]) {
			const cur = stats.get(ap) ?? { sectors: 0, block: 0 };
			cur.sectors += 1;
			cur.block += block;
			stats.set(ap, cur);
		}
	}
	return stats;
}

if (!KEY && !dryRun) {
	console.error("ADMIN_API_KEY required");
	process.exit(1);
}

const flightPath = process.env.FLIGHT_STATS ?? "/tmp/flight-stats-parsed.json";
const flightData = JSON.parse(readFileSync(flightPath, "utf8"));
const airportStats = computeAirportStats(flightData.routes);

const mapRes = await fetch(`${SITE}/api/v1/travel/map`);
const map = (await mapRes.json()).data;

console.log(`Map: ${map.cities.length} cities, ${map.countries.length} countries`);
console.log(`Flight log: ${flightData.routes.length} flights, ${airportStats.size} airports\n`);

const issues = [];
const countryFixes = [];
const cityFixes = [];

for (const country of map.countries) {
	const expected = ISO_NAMES[country.iso2];
	if (expected && country.name !== expected) {
		issues.push(`Country ${country.iso2}: "${country.name}" → "${expected}"`);
		countryFixes.push({ iso2: country.iso2, name: expected });
	}
}

for (const city of map.cities) {
	const ac = (city.airportCode ?? "").toUpperCase();
	const st = airportStats.get(ac);

	if (ac && st) {
		const expectedNote = appendFlightStats(city.note, st.sectors, st.block);
		if (city.note !== expectedNote) {
			issues.push(`Note ${ac} ${city.name}: update flight stats`);
			cityFixes.push({ id: city.id, note: expectedNote, airportCode: ac });
		}
	}

	const expectedCountryName = ISO_NAMES[city.country];
	if (expectedCountryName && city.countryName && city.countryName !== expectedCountryName) {
		if (city.countryName.toUpperCase() === expectedCountryName.toUpperCase()) {
			issues.push(`City ${city.id} countryName: "${city.countryName}" → "${expectedCountryName}"`);
			cityFixes.push({
				id: city.id,
				countryName: expectedCountryName,
				_patchCountryNameOnly: true,
			});
		}
	}
}

console.log("=== ISSUES FOUND ===");
for (const i of issues) console.log(" ", i);
console.log(`\nCountry fixes: ${countryFixes.length}`);
console.log(`City fixes: ${cityFixes.length}`);

if (dryRun) {
	console.log("\n(dry run — no changes written)");
	process.exit(0);
}

for (const fix of countryFixes) {
	const r = await api("PATCH", `/api/v1/admin/travel-map/countries/${fix.iso2}`, {
		name: fix.name,
	});
	console.log(r.ok ? `✓ country ${fix.iso2} → ${fix.name}` : `✗ country ${fix.iso2}`, r.status);
}

const cityNoteById = new Map();
const cityCountryNameById = new Map();
for (const fix of cityFixes) {
	if (fix.note) cityNoteById.set(fix.id, fix.note);
	if (fix._patchCountryNameOnly) cityCountryNameById.set(fix.id, fix.countryName);
}

const mergedIds = new Set([...cityNoteById.keys(), ...cityCountryNameById.keys()]);
for (const id of mergedIds) {
	const city = map.cities.find((c) => c.id === id);
	if (!city) continue;
	const body = {};
	if (cityNoteById.has(id)) body.note = cityNoteById.get(id);
	if (cityCountryNameById.has(id)) body.countryName = cityCountryNameById.get(id);
	const r = await api("PATCH", `/api/v1/admin/travel-map/cities/${id}`, body);
	console.log(
		r.ok ? `✓ city ${id}` : `✗ city ${id}`,
		r.status,
		body.note ? body.note.slice(0, 50) + "…" : body.countryName,
	);
}

console.log("\nDone.");
