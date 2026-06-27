/** Geocoding + IATA airport + ISO country lookup for admin travel map editor. */

import { CONTINENT_LABELS, continentForIso2, type ContinentCode } from "../content/continents";

export type LookupResult = {
	id: string;
	name: string;
	lat: number;
	lng: number;
	country?: string;
	countryCode?: string;
	airportCode?: string;
	admin1?: string;
	source: "open-meteo" | "airports-db" | "iata-exact";
};

export type CountryLookupResult = {
	id: string;
	iso2: string;
	name: string;
	lat: number;
	lng: number;
	region?: string;
	subregion?: string;
	continent?: ContinentCode;
	continentName?: string;
	source: "iso-3166";
};

type IsoCountry = {
	name: string;
	"alpha-2": string;
	"alpha-3": string;
	region?: string;
	"sub-region"?: string;
};

let countriesIndex: IsoCountry[] | null = null;

const ISO_COUNTRIES_URL =
	"https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json";

async function loadCountries(): Promise<IsoCountry[]> {
	if (countriesIndex) return countriesIndex;
	const res = await fetch(ISO_COUNTRIES_URL, {
		headers: { "User-Agent": "elifnurcicekdagi-admin/1.0" },
	});
	if (!res.ok) throw new Error("Country database fetch failed");
	countriesIndex = (await res.json()) as IsoCountry[];
	return countriesIndex;
}

function countryToResult(c: IsoCountry): CountryLookupResult | null {
	const iso2 = c["alpha-2"]?.toUpperCase();
	const name = c.name?.trim();
	if (!iso2 || iso2.length !== 2 || !name) return null;
	const continent = continentForIso2(iso2) ?? undefined;
	return {
		id: iso2,
		iso2,
		name,
		lat: 0,
		lng: 0,
		region: c.region,
		subregion: c["sub-region"],
		continent,
		continentName: continent ? CONTINENT_LABELS[continent] : undefined,
		source: "iso-3166",
	};
}

export async function lookupCountries(query: string, limit = 15): Promise<CountryLookupResult[]> {
	const q = query.trim();
	if (q.length < 2) return [];

	const all = await loadCountries();
	const upper = q.toUpperCase();
	const lower = q.toLowerCase();

	// Exact ISO2 / ISO3
	if (upper.length === 2) {
		const exact = all.find((c) => c["alpha-2"]?.toUpperCase() === upper);
		if (exact) {
			const row = countryToResult(exact);
			return row ? [row] : [];
		}
	}
	if (upper.length === 3) {
		const exact = all.find((c) => c["alpha-3"]?.toUpperCase() === upper);
		if (exact) {
			const row = countryToResult(exact);
			return row ? [row] : [];
		}
	}

	const scored: { score: number; row: CountryLookupResult }[] = [];

	for (const c of all) {
		const row = countryToResult(c);
		if (!row) continue;

		const common = row.name.toLowerCase();
		const iso3 = c["alpha-3"]?.toLowerCase() ?? "";

		let score = 0;
		if (row.iso2 === upper) score = 100;
		else if (common === lower) score = 90;
		else if (common.startsWith(lower)) score = 80;
		else if (row.iso2.startsWith(upper) && upper.length === 2) score = 70;
		else if (iso3.startsWith(lower)) score = 65;
		else if (common.includes(lower)) score = 50;
		else if (row.subregion?.toLowerCase().includes(lower)) score = 30;
		else continue;

		scored.push({ score, row });
	}

	scored.sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name));
	const seen = new Set<string>();
	const out: CountryLookupResult[] = [];
	for (const { row } of scored) {
		if (seen.has(row.iso2)) continue;
		seen.add(row.iso2);
		out.push(row);
		if (out.length >= limit) break;
	}
	return out;
}

type MwggAirport = {
	name: string;
	city: string;
	country: string;
	iata: string;
	icao: string;
	lat: string;
	lon: string;
};

let airportsIndex: Map<string, MwggAirport> | null = null;
let airportsList: MwggAirport[] | null = null;

async function loadAirports(): Promise<void> {
	if (airportsIndex) return;
	const res = await fetch("https://raw.githubusercontent.com/mwgg/Airports/master/airports.json");
	if (!res.ok) throw new Error("Airport database fetch failed");
	const data = (await res.json()) as Record<string, MwggAirport>;
	airportsIndex = new Map();
	airportsList = [];
	for (const [key, ap] of Object.entries(data)) {
		if (!ap || typeof ap !== "object") continue;
		const entry = { ...ap, iata: ap.iata || key };
		if (entry.iata && entry.iata.length === 3) {
			airportsIndex.set(entry.iata.toUpperCase(), entry);
		}
		airportsList.push(entry);
	}
}

async function searchOpenMeteo(query: string): Promise<LookupResult[]> {
	const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
	url.searchParams.set("name", query);
	url.searchParams.set("count", "12");
	url.searchParams.set("language", "en");
	url.searchParams.set("format", "json");

	const res = await fetch(url.toString(), {
		headers: { "User-Agent": "elifnurcicekdagi-admin/1.0" },
	});
	if (!res.ok) return [];

	const json = (await res.json()) as {
		results?: {
			id: number;
			name: string;
			latitude: number;
			longitude: number;
			country?: string;
			country_code?: string;
			admin1?: string;
		}[];
	};

	return (json.results ?? []).map((r) => ({
		id: `geo-${r.id}`,
		name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
		lat: r.latitude,
		lng: r.longitude,
		country: r.country,
		countryCode: r.country_code?.toUpperCase(),
		source: "open-meteo" as const,
	}));
}

function searchAirports(query: string, limit: number): LookupResult[] {
	if (!airportsList || !airportsIndex) return [];

	const q = query.trim().toUpperCase();
	const results: LookupResult[] = [];
	const seen = new Set<string>();

	if (q.length === 3 && airportsIndex.has(q)) {
		const ap = airportsIndex.get(q)!;
		results.push(airportToResult(ap, "iata-exact"));
		seen.add(ap.iata);
	}

	const lower = query.toLowerCase();
	for (const ap of airportsList) {
		if (results.length >= limit) break;
		if (!ap.iata || ap.iata.length !== 3) continue;
		if (seen.has(ap.iata)) continue;

		const hay = `${ap.name} ${ap.city} ${ap.country} ${ap.iata}`.toLowerCase();
		if (hay.includes(lower) || ap.iata.toUpperCase().startsWith(q)) {
			results.push(airportToResult(ap, "airports-db"));
			seen.add(ap.iata);
		}
	}

	return results;
}

function airportToResult(ap: MwggAirport, source: LookupResult["source"]): LookupResult {
	const lat = parseFloat(ap.lat);
	const lng = parseFloat(ap.lon);
	return {
		id: `apt-${ap.iata}`,
		name: ap.name || ap.city,
		lat: Number.isFinite(lat) ? lat : 0,
		lng: Number.isFinite(lng) ? lng : 0,
		country: ap.country,
		airportCode: ap.iata.toUpperCase(),
		source,
	};
}

export async function lookupPlaces(
	query: string,
	type: "auto" | "city" | "airport" | "country" = "auto",
): Promise<LookupResult[] | CountryLookupResult[]> {
	const q = query.trim();
	if (q.length < 2) return [];

	if (type === "country") {
		return lookupCountries(q);
	}

	const results: LookupResult[] = [];
	const seen = new Set<string>();

	const add = (items: LookupResult[]) => {
		for (const item of items) {
			const key = `${item.airportCode ?? item.name}-${item.lat.toFixed(2)}`;
			if (seen.has(key)) continue;
			seen.add(key);
			results.push(item);
		}
	};

	if (type === "airport" || type === "auto") {
		await loadAirports();
		add(searchAirports(q, 15));
	}

	if (type === "city" || type === "auto") {
		add(await searchOpenMeteo(q));
	}

	return results.slice(0, 20);
}
