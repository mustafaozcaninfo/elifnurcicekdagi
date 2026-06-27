#!/usr/bin/env node
/**
 * Travel map blob → relational D1 migration helper.
 *
 * Auto-migration: `migrateBlobIfNeeded()` runs on the first GET to
 * `/api/v1/travel/map` or `/api/v1/admin/travel-map` when `travel_cities`
 * is empty and a blob exists in site_settings (`landing.travelmap` /
 * `landing.travelMap`).
 *
 * Prerequisites:
 *   npx wrangler d1 migrations apply DB --remote   # applies 0005_travel_map_relational.sql
 *
 * Manual trigger (production — no auth required for public map):
 *   source ../../all.env
 *   node scripts/migrate-travel-blob.mjs
 *
 * Or with curl:
 *   curl -s "$SITE_URL/api/v1/travel/map" | jq '.data.cities | length'
 */

const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";

const res = await fetch(`${SITE}/api/v1/travel/map`);
const json = await res.json().catch(() => ({}));

if (!res.ok) {
	console.error("Migration trigger failed:", res.status, json);
	process.exit(1);
}

const cities = json?.data?.cities?.length ?? 0;
const countries = json?.data?.countries?.length ?? 0;
console.log(`Travel map loaded: ${countries} countries, ${cities} cities`);
console.log("If relational tables were empty, blob data was imported on this request.");
