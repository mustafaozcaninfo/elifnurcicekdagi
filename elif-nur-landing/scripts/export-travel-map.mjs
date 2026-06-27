#!/usr/bin/env node
/**
 * Export world travel map JSON for CMS seed / admin import.
 * Usage: npx tsx scripts/export-travel-map.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWorldTravelMap } from "../src/data/world-travel-map.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "../../elif-nur-worker/data");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "travel-map-world.json");
const map = buildWorldTravelMap();
/** Stories are generated client-side — keep CMS payload lean. */
const lean = {
	...map,
	cities: map.cities.map(({ story: _s, ...city }) => city),
};
writeFileSync(outPath, `${JSON.stringify(lean, null, 2)}\n`);
console.log(`Wrote ${lean.cities.length} cities, ${lean.countries.length} countries → ${outPath}`);
