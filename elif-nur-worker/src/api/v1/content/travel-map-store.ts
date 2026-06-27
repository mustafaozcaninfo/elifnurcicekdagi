import { parseMetaJson } from "./types";
import { countContinentsFromIso2 } from "./continents";

export const TRAVEL_MAP_SETTING_KEY = "landing.travelmap";
export const TRAVEL_MAP_LEGACY_KEY = "landing.travelMap";

export type TravelMapCity = {
	id: string;
	name: string;
	country: string;
	countryName?: string;
	lat: number;
	lng: number;
	role?: string;
	visitedWith?: string;
	visits?: number;
	note?: string;
	airportCode?: string;
	story?: Record<string, unknown>;
};

export type TravelMapCountry = {
	iso2: string;
	name: string;
	visited: boolean;
	favorite?: boolean;
	color?: string;
	narrative?: Record<string, unknown>;
};

export type TravelMapRoute = {
	from: string;
	to: string;
	type?: string;
	label?: string;
};

export type TravelMapData = {
	version: number;
	title: string;
	subtitle: string;
	homeHub?: Record<string, unknown>;
	opening?: Record<string, unknown>;
	stats?: Record<string, unknown>;
	countries: TravelMapCountry[];
	cities: TravelMapCity[];
	routes?: TravelMapRoute[];
	globe?: Record<string, unknown>;
};

export type TravelMapMeta = Pick<
	TravelMapData,
	"version" | "title" | "subtitle" | "homeHub" | "opening" | "globe"
>;

type CountryRow = {
	iso2: string;
	name: string;
	visited: number;
	favorite: number;
	color: string | null;
	narrative_json: string;
	sort_order: number;
};

type CityRow = {
	id: string;
	name: string;
	country_iso2: string;
	country_name: string | null;
	lat: number;
	lng: number;
	role: string | null;
	visited_with: string | null;
	visits: number | null;
	note: string | null;
	airport_code: string | null;
	story_json: string;
	sort_order: number;
};

type RouteRow = {
	id: number;
	from_city_id: string;
	to_city_id: string;
	route_type: string;
	label: string | null;
};

type MetaRow = {
	version: number;
	title: string;
	subtitle: string;
	home_hub_json: string;
	opening_json: string;
	globe_json: string;
};

const PALETTE = [
	"#C25B3F",
	"#D4A017",
	"#4A7C59",
	"#5B7C99",
	"#8B6B4A",
	"#7A5C8A",
	"#3D6B6B",
];

function jsonOrEmpty(raw: string | null | undefined): Record<string, unknown> {
	if (!raw || raw === "{}") return {};
	const parsed = parseMetaJson(raw);
	return Object.keys(parsed).length ? parsed : {};
}

function jsonStringify(value: Record<string, unknown> | null | undefined): string {
	if (!value || !Object.keys(value).length) return "{}";
	return JSON.stringify(value);
}

/** DB stores only explicit husband trips; solo = NULL. */
function normalizeVisitedWith(value: string | null | undefined): string | null {
	return value === "spouse" ? "spouse" : null;
}

function rowToCountry(row: CountryRow): TravelMapCountry {
	const country: TravelMapCountry = {
		iso2: row.iso2,
		name: row.name,
		visited: row.visited === 1,
	};
	if (row.favorite === 1) country.favorite = true;
	if (row.color) country.color = row.color;
	const narrative = jsonOrEmpty(row.narrative_json);
	if (Object.keys(narrative).length) country.narrative = narrative;
	return country;
}

function rowToCity(row: CityRow): TravelMapCity {
	const city: TravelMapCity = {
		id: row.id,
		name: row.name,
		country: row.country_iso2,
		lat: row.lat,
		lng: row.lng,
	};
	if (row.country_name) city.countryName = row.country_name;
	if (row.role) city.role = row.role;
	if (row.visited_with) city.visitedWith = row.visited_with;
	if (row.visits != null) city.visits = row.visits;
	if (row.note) city.note = row.note;
	if (row.airport_code) city.airportCode = row.airport_code;
	const story = jsonOrEmpty(row.story_json);
	if (Object.keys(story).length) city.story = story;
	return city;
}

function rowToRoute(row: RouteRow): TravelMapRoute {
	const route: TravelMapRoute = {
		from: row.from_city_id,
		to: row.to_city_id,
	};
	if (row.route_type) route.type = row.route_type;
	if (row.label) route.label = row.label;
	return route;
}

async function loadBlobFromSettings(db: D1Database): Promise<TravelMapData | null> {
	for (const key of [TRAVEL_MAP_SETTING_KEY, TRAVEL_MAP_LEGACY_KEY]) {
		const row = await db
			.prepare("SELECT value_json FROM site_settings WHERE key = ?")
			.bind(key)
			.first<{ value_json: string }>();
		if (row) {
			const parsed = validateTravelMap(parseMetaJson(row.value_json));
			if (parsed) return parsed;
		}
	}
	return null;
}

export function slugifyId(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function validateTravelMap(data: unknown): TravelMapData | null {
	if (!data || typeof data !== "object") return null;
	const o = data as Record<string, unknown>;
	if (!Array.isArray(o.countries) || !Array.isArray(o.cities)) return null;

	const cities = (o.cities as unknown[]).filter((c) => {
		if (!c || typeof c !== "object") return false;
		const x = c as TravelMapCity;
		return (
			typeof x.id === "string" &&
			typeof x.name === "string" &&
			typeof x.country === "string" &&
			typeof x.lat === "number" &&
			typeof x.lng === "number"
		);
	}) as TravelMapCity[];

	if (!cities.length) return null;

	const countries = (o.countries as unknown[]).filter((c) => {
		if (!c || typeof c !== "object") return false;
		const x = c as TravelMapCountry;
		return typeof x.iso2 === "string" && typeof x.name === "string";
	}) as TravelMapCountry[];

	return {
		version: 1,
		title: typeof o.title === "string" ? o.title : "Explorer",
		subtitle: typeof o.subtitle === "string" ? o.subtitle : "",
		homeHub: o.homeHub as TravelMapData["homeHub"],
		opening: o.opening as TravelMapData["opening"],
		stats: o.stats as TravelMapData["stats"],
		countries,
		cities,
		routes: Array.isArray(o.routes) ? (o.routes as TravelMapRoute[]) : [],
		globe: o.globe as TravelMapData["globe"],
	};
}

export function computeStats(map: TravelMapData): TravelMapData["stats"] {
	const countryIsos = map.cities.map((c) => c.country.toUpperCase());
	return {
		countries: map.countries.filter((c) => c.visited).length,
		cities: map.cities.length,
		continents: countContinentsFromIso2(countryIsos),
	};
}

export function buildHubRoutes(homeId: string, cities: TravelMapCity[]): TravelMapRoute[] {
	const home = cities.find((c) => c.id === homeId);
	if (!home) return [];
	const routes: TravelMapRoute[] = [];
	const seenCountries = new Set<string>();
	const homeCode = home.airportCode ?? home.name.slice(0, 3).toUpperCase();

	for (const dest of cities) {
		if (dest.id === homeId) continue;
		if (seenCountries.has(dest.country)) continue;
		seenCountries.add(dest.country);
		const code = dest.airportCode ?? dest.name.slice(0, 3).toUpperCase();
		routes.push({
			from: homeId,
			to: dest.id,
			type: "flight",
			label: `${homeCode} → ${code}`,
		});
	}

	return routes;
}

export function validateIntegrity(map: TravelMapData): string[] {
	const errors: string[] = [];
	const cityIds = new Set(map.cities.map((c) => c.id));
	const countryIsos = new Set(map.countries.map((c) => c.iso2.toUpperCase()));

	for (const c of map.cities) {
		if (!countryIsos.has(c.country.toUpperCase())) {
			errors.push(`City "${c.name}" references unknown country ${c.country}`);
		}
		if (c.lat < -90 || c.lat > 90) errors.push(`City "${c.name}" invalid latitude`);
		if (c.lng < -180 || c.lng > 180) errors.push(`City "${c.name}" invalid longitude`);
	}

	const ids = map.cities.map((c) => c.id);
	if (ids.length !== new Set(ids).size) errors.push("Duplicate city ids");

	for (const r of map.routes ?? []) {
		if (!cityIds.has(r.from)) errors.push(`Route from unknown city: ${r.from}`);
		if (!cityIds.has(r.to)) errors.push(`Route to unknown city: ${r.to}`);
	}

	return errors;
}

export function nextCountryColor(map: TravelMapData): string {
	const used = new Set(map.countries.map((c) => c.color));
	for (const c of PALETTE) {
		if (!used.has(c)) return c;
	}
	return PALETTE[map.countries.length % PALETTE.length];
}

export async function importBlobToRelational(db: D1Database, map: TravelMapData): Promise<void> {
	const withStats = { ...map, stats: computeStats(map) };
	const stmts: D1PreparedStatement[] = [
		db.prepare("DELETE FROM travel_routes"),
		db.prepare("DELETE FROM travel_cities"),
		db.prepare("DELETE FROM travel_countries"),
		db.prepare("DELETE FROM travel_map_meta"),
		db.prepare(
			`INSERT INTO travel_map_meta (id, version, title, subtitle, home_hub_json, opening_json, globe_json, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		).bind(
			withStats.version,
			withStats.title,
			withStats.subtitle,
			jsonStringify(withStats.homeHub),
			jsonStringify(withStats.opening),
			jsonStringify(withStats.globe),
		),
	];

	withStats.countries.forEach((country, i) => {
		stmts.push(
			db
				.prepare(
					`INSERT INTO travel_countries (iso2, name, visited, favorite, color, narrative_json, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
				)
				.bind(
					country.iso2.toUpperCase(),
					country.name,
					country.visited ? 1 : 0,
					country.favorite ? 1 : 0,
					country.color ?? null,
					jsonStringify(country.narrative),
					i,
				),
		);
	});

	withStats.cities.forEach((city, i) => {
		stmts.push(
			db
				.prepare(
					`INSERT INTO travel_cities (id, name, country_iso2, country_name, lat, lng, role, visited_with, visits, note, airport_code, story_json, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
				)
				.bind(
					city.id,
					city.name,
					city.country.toUpperCase(),
					city.countryName ?? null,
					city.lat,
					city.lng,
					city.role ?? null,
					normalizeVisitedWith(city.visitedWith),
					city.visits ?? null,
					city.note ?? null,
					city.airportCode ?? null,
					jsonStringify(city.story),
					i,
				),
		);
	});

	for (const route of withStats.routes ?? []) {
		stmts.push(
			db
				.prepare(
					`INSERT INTO travel_routes (from_city_id, to_city_id, route_type, label)
         VALUES (?, ?, ?, ?)`,
				)
				.bind(route.from, route.to, route.type ?? "flight", route.label ?? null),
		);
	}

	await db.batch(stmts);
}

export async function migrateBlobIfNeeded(db: D1Database): Promise<boolean> {
	const countRow = await db
		.prepare("SELECT COUNT(*) AS n FROM travel_cities")
		.first<{ n: number }>();
	if ((countRow?.n ?? 0) > 0) return false;

	const blob = await loadBlobFromSettings(db);
	if (!blob) return false;

	await importBlobToRelational(db, blob);
	return true;
}

async function assembleTravelMap(
	meta: MetaRow | null,
	countries: CountryRow[],
	cities: CityRow[],
	routes: RouteRow[],
): Promise<TravelMapData | null> {
	if (!meta && !cities.length) return null;
	if (!cities.length) return null;

	const map: TravelMapData = {
		version: meta?.version ?? 1,
		title: meta?.title ?? "Explorer",
		subtitle: meta?.subtitle ?? "",
		countries: countries.map(rowToCountry),
		cities: cities.map(rowToCity),
		routes: routes.map(rowToRoute),
	};

	if (meta) {
		const homeHub = jsonOrEmpty(meta.home_hub_json);
		if (Object.keys(homeHub).length) map.homeHub = homeHub;
		const opening = jsonOrEmpty(meta.opening_json);
		if (Object.keys(opening).length) map.opening = opening;
		const globe = jsonOrEmpty(meta.globe_json);
		if (Object.keys(globe).length) map.globe = globe;
	}

	map.stats = computeStats(map);
	return map;
}

export async function loadTravelMapFromDb(db: D1Database): Promise<TravelMapData | null> {
	await migrateBlobIfNeeded(db);

	const meta = await db
		.prepare(
			"SELECT version, title, subtitle, home_hub_json, opening_json, globe_json FROM travel_map_meta WHERE id = 1",
		)
		.first<MetaRow>();

	const countries = (
		await db
			.prepare("SELECT * FROM travel_countries ORDER BY sort_order, name")
			.all<CountryRow>()
	).results;

	const cities = (
		await db.prepare("SELECT * FROM travel_cities ORDER BY sort_order, name").all<CityRow>()
	).results;

	const routes = (
		await db
			.prepare("SELECT * FROM travel_routes ORDER BY id")
			.all<RouteRow>()
	).results;

	return assembleTravelMap(meta, countries, cities, routes);
}

export async function getTravelMapMeta(db: D1Database): Promise<TravelMapMeta | null> {
	const row = await db
		.prepare(
			"SELECT version, title, subtitle, home_hub_json, opening_json, globe_json FROM travel_map_meta WHERE id = 1",
		)
		.first<MetaRow>();
	if (!row) return null;

	const meta: TravelMapMeta = {
		version: row.version,
		title: row.title,
		subtitle: row.subtitle,
	};
	const homeHub = jsonOrEmpty(row.home_hub_json);
	if (Object.keys(homeHub).length) meta.homeHub = homeHub;
	const opening = jsonOrEmpty(row.opening_json);
	if (Object.keys(opening).length) meta.opening = opening;
	const globe = jsonOrEmpty(row.globe_json);
	if (Object.keys(globe).length) meta.globe = globe;
	return meta;
}

export async function updateTravelMapMeta(
	db: D1Database,
	partial: Partial<TravelMapMeta>,
): Promise<void> {
	const existing = (await getTravelMapMeta(db)) ?? {
		version: 1,
		title: "Explorer",
		subtitle: "",
	};
	const merged: TravelMapMeta = {
		version: partial.version ?? existing.version ?? 1,
		title: partial.title ?? existing.title,
		subtitle: partial.subtitle ?? existing.subtitle,
		homeHub: partial.homeHub ?? existing.homeHub,
		opening: partial.opening ?? existing.opening,
		globe: partial.globe ?? existing.globe,
	};

	await db
		.prepare(
			`INSERT INTO travel_map_meta (id, version, title, subtitle, home_hub_json, opening_json, globe_json, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       version = excluded.version,
       title = excluded.title,
       subtitle = excluded.subtitle,
       home_hub_json = excluded.home_hub_json,
       opening_json = excluded.opening_json,
       globe_json = excluded.globe_json,
       updated_at = datetime('now')`,
		)
		.bind(
			merged.version,
			merged.title,
			merged.subtitle,
			jsonStringify(merged.homeHub),
			jsonStringify(merged.opening),
			jsonStringify(merged.globe),
		)
		.run();
}

export async function listCountries(db: D1Database): Promise<TravelMapCountry[]> {
	const rows = (
		await db
			.prepare("SELECT * FROM travel_countries ORDER BY sort_order, name")
			.all<CountryRow>()
	).results;
	return rows.map(rowToCountry);
}

export async function getCountry(db: D1Database, iso2: string): Promise<TravelMapCountry | null> {
	const row = await db
		.prepare("SELECT * FROM travel_countries WHERE iso2 = ?")
		.bind(iso2.toUpperCase())
		.first<CountryRow>();
	return row ? rowToCountry(row) : null;
}

export async function upsertCountry(db: D1Database, country: TravelMapCountry): Promise<void> {
	const iso2 = country.iso2.toUpperCase();
	const existing = await db
		.prepare("SELECT sort_order FROM travel_countries WHERE iso2 = ?")
		.bind(iso2)
		.first<{ sort_order: number }>();
	const sortOrder =
		existing?.sort_order ??
		((
			await db
				.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM travel_countries")
				.first<{ next: number }>()
		)?.next ?? 0);

	await db
		.prepare(
			`INSERT INTO travel_countries (iso2, name, visited, favorite, color, narrative_json, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(iso2) DO UPDATE SET
       name = excluded.name,
       visited = excluded.visited,
       favorite = excluded.favorite,
       color = excluded.color,
       narrative_json = excluded.narrative_json,
       updated_at = datetime('now')`,
		)
		.bind(
			iso2,
			country.name,
			country.visited ? 1 : 0,
			country.favorite ? 1 : 0,
			country.color ?? null,
			jsonStringify(country.narrative),
			sortOrder,
		)
		.run();
}

export async function deleteCountry(db: D1Database, iso2: string): Promise<void> {
	await db
		.prepare("DELETE FROM travel_countries WHERE iso2 = ?")
		.bind(iso2.toUpperCase())
		.run();
}

export async function listCities(db: D1Database, countryIso?: string): Promise<TravelMapCity[]> {
	const rows = countryIso
		? (
				await db
					.prepare(
						"SELECT * FROM travel_cities WHERE country_iso2 = ? ORDER BY sort_order, name",
					)
					.bind(countryIso.toUpperCase())
					.all<CityRow>()
			).results
		: (await db.prepare("SELECT * FROM travel_cities ORDER BY sort_order, name").all<CityRow>())
				.results;
	return rows.map(rowToCity);
}

export async function getCity(db: D1Database, id: string): Promise<TravelMapCity | null> {
	const row = await db
		.prepare("SELECT * FROM travel_cities WHERE id = ?")
		.bind(id)
		.first<CityRow>();
	return row ? rowToCity(row) : null;
}

export async function insertCity(db: D1Database, city: TravelMapCity): Promise<void> {
	const sortOrder =
		((
			await db
				.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM travel_cities")
				.first<{ next: number }>()
		)?.next ?? 0);

	await db
		.prepare(
			`INSERT INTO travel_cities (id, name, country_iso2, country_name, lat, lng, role, visited_with, visits, note, airport_code, story_json, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			city.id,
			city.name,
			city.country.toUpperCase(),
			city.countryName ?? null,
			city.lat,
			city.lng,
			city.role ?? null,
			normalizeVisitedWith(city.visitedWith),
			city.visits ?? null,
			city.note ?? null,
			city.airportCode ?? null,
			jsonStringify(city.story),
			sortOrder,
		)
		.run();
}

export async function updateCity(
	db: D1Database,
	id: string,
	partial: Partial<TravelMapCity>,
): Promise<void> {
	const existing = await db
		.prepare("SELECT * FROM travel_cities WHERE id = ?")
		.bind(id)
		.first<CityRow>();
	if (!existing) return;

	await db
		.prepare(
			`UPDATE travel_cities SET
       name = ?,
       country_iso2 = ?,
       country_name = ?,
       lat = ?,
       lng = ?,
       role = ?,
       visited_with = ?,
       visits = ?,
       note = ?,
       airport_code = ?,
       story_json = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
		)
		.bind(
			partial.name ?? existing.name,
			(partial.country ?? existing.country_iso2).toUpperCase(),
			partial.countryName ?? existing.country_name,
			partial.lat ?? existing.lat,
			partial.lng ?? existing.lng,
			partial.role ?? existing.role,
			"visitedWith" in partial
				? normalizeVisitedWith(partial.visitedWith ?? null)
				: existing.visited_with,
			partial.visits ?? existing.visits,
			partial.note ?? existing.note,
			partial.airportCode ?? existing.airport_code,
			partial.story !== undefined
				? jsonStringify(partial.story ?? undefined)
				: existing.story_json,
			id,
		)
		.run();
}

export async function deleteCity(db: D1Database, id: string): Promise<void> {
	await db.batch([
		db
			.prepare("DELETE FROM travel_routes WHERE from_city_id = ? OR to_city_id = ?")
			.bind(id, id),
		db.prepare("DELETE FROM travel_cities WHERE id = ?").bind(id),
	]);
}

export async function listRoutes(db: D1Database): Promise<TravelMapRoute[]> {
	const rows = (
		await db.prepare("SELECT * FROM travel_routes ORDER BY id").all<RouteRow>()
	).results;
	return rows.map(rowToRoute);
}

export async function insertRoute(db: D1Database, route: TravelMapRoute): Promise<void> {
	await db
		.prepare(
			`INSERT INTO travel_routes (from_city_id, to_city_id, route_type, label)
     VALUES (?, ?, ?, ?)`,
		)
		.bind(route.from, route.to, route.type ?? "flight", route.label ?? null)
		.run();
}

export async function deleteRoute(db: D1Database, index: number): Promise<boolean> {
	const rows = (
		await db.prepare("SELECT id FROM travel_routes ORDER BY id").all<{ id: number }>()
	).results;
	if (index < 0 || index >= rows.length) return false;
	await db
		.prepare("DELETE FROM travel_routes WHERE id = ?")
		.bind(rows[index].id)
		.run();
	return true;
}

export async function replaceRoutes(db: D1Database, routes: TravelMapRoute[]): Promise<void> {
	const stmts: D1PreparedStatement[] = [db.prepare("DELETE FROM travel_routes")];
	for (const route of routes) {
		stmts.push(
			db
				.prepare(
					`INSERT INTO travel_routes (from_city_id, to_city_id, route_type, label)
         VALUES (?, ?, ?, ?)`,
				)
				.bind(route.from, route.to, route.type ?? "flight", route.label ?? null),
		);
	}
	await db.batch(stmts);
}

export async function saveTravelMapToDb(db: D1Database, map: TravelMapData): Promise<void> {
	await importBlobToRelational(db, map);
}
