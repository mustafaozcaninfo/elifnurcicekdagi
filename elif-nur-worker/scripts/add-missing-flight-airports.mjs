#!/usr/bin/env node
/**
 * Add every Excel airport missing from the map (no metro skips).
 * Usage: source ../../all.env && node scripts/add-missing-flight-airports.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";
const KEY = process.env.ADMIN_API_KEY?.trim();

/** Alternate airports — unique id/name even when metro exists elsewhere */
const ALT_CITIES = {
	STN: {
		id: "london-stansted",
		name: "London Stansted",
		country: "GB",
		countryName: "United Kingdom",
		note: "Stansted approaches",
	},
	IAD: {
		id: "washington-dulles",
		name: "Washington Dulles",
		country: "US",
		countryName: "United States",
		note: "Dulles corridor",
	},
	NLU: {
		id: "mexico-aifa",
		name: "Mexico City (AIFA)",
		country: "MX",
		countryName: "Mexico",
		note: "Felipe Ángeles highland",
	},
	NRT: {
		id: "tokyo-narita",
		name: "Tokyo Narita",
		country: "JP",
		countryName: "Japan",
		note: "Narita long final",
	},
	PKX: {
		id: "beijing-daxing",
		name: "Beijing Daxing",
		country: "CN",
		countryName: "China",
		note: "Daxing axis",
	},
};

const INPUT = ["/tmp/flight-stats-parsed.json", join(__dir, "flight-stats-parsed.json")].find((p) =>
	existsSync(p),
);

if (!KEY) {
	console.error("ADMIN_API_KEY required");
	process.exit(1);
}
if (!INPUT) {
	console.error("flight-stats-parsed.json not found");
	process.exit(1);
}

const headers = {
	Authorization: `Bearer ${KEY}`,
	"Content-Type": "application/json",
};

async function api(method, path, body) {
	const res = await fetch(`${SITE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
	const json = await res.json().catch(() => ({}));
	return { ok: res.ok, status: res.status, json };
}

const flightData = JSON.parse(readFileSync(INPUT, "utf8"));
const stats = new Map();
for (const r of flightData.routes ?? []) {
	const block = Number(r.blockHrs) || 0;
	for (const ap of [r.from, r.to]) {
		const cur = stats.get(ap) ?? { sectors: 0, block: 0 };
		cur.sectors += 1;
		cur.block += block;
		stats.set(ap, cur);
	}
}

const mwggRes = await fetch("https://raw.githubusercontent.com/mwgg/Airports/master/airports.json");
const mwgg = await mwggRes.json();

const mapRes = await api("GET", "/api/v1/admin/travel-map");
const map = mapRes.json?.data?.map;
const existing = new Set(
	(map?.cities ?? []).map((c) => (c.airportCode ?? "").toUpperCase()).filter(Boolean),
);

const missing = flightData.uniqueAirports.filter((c) => !existing.has(c.toUpperCase()));
console.log("Missing from map:", missing.join(", ") || "(none)");

for (const code of missing) {
	const upper = code.toUpperCase();
	const ap = Object.values(mwgg).find((x) => (x.iata || "").toUpperCase() === upper) ?? mwgg[upper];
	if (!ap) {
		console.error("No mwgg data for", upper);
		continue;
	}
	const alt = ALT_CITIES[upper];
	const st = stats.get(upper) ?? { sectors: 0, block: 0 };
	const noteBase = alt?.note ?? `${upper} network`;
	const note = `${noteBase} · ${st.sectors} sectors · ${st.block.toFixed(1)} block hrs`;

	const body = {
		id: alt?.id ?? upper.toLowerCase(),
		name: alt?.name ?? ap.city ?? ap.name,
		country: alt?.country ?? ap.country?.length === 2 ? ap.country : "XX",
		countryName: alt?.countryName,
		lat: parseFloat(ap.lat),
		lng: parseFloat(ap.lon),
		role: "visited",
		airportCode: upper,
		note,
	};

	if (body.country === "XX") {
		console.error("Could not resolve country for", upper);
		continue;
	}

	const res = await api("POST", "/api/v1/admin/travel-map/cities", body);
	if (res.ok) console.log("✓", upper, body.name);
	else if (res.status === 409) console.log("exists", upper);
	else console.error("✗", upper, res.status, res.json);
}

// Verify
const verify = await api("GET", "/api/v1/admin/travel-map");
const codes = new Set(
	(verify.json?.data?.map?.cities ?? []).map((c) => c.airportCode?.toUpperCase()),
);
const stillMissing = flightData.uniqueAirports.filter((c) => !codes.has(c.toUpperCase()));
console.log("\nStill missing:", stillMissing.length ? stillMissing.join(", ") : "NONE — all 74 airports on map");
