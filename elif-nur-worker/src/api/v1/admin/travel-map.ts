import { logApiAudit } from "../../shared/audit";
import { readJson } from "../../shared/request";
import { jsonError, jsonOk } from "../../shared/response";
import type { ApiContext } from "../context";
import { requireAdmin } from "./middleware";
import { lookupCountries, lookupPlaces } from "./lookup";
import {
	buildHubRoutes,
	deleteCity,
	deleteCountry,
	deleteRoute,
	getCity,
	getCountry,
	insertCity,
	insertRoute,
	listCities,
	listCountries,
	listRoutes,
	loadTravelMapFromDb,
	nextCountryColor,
	replaceRoutes,
	saveTravelMapToDb,
	slugifyId,
	updateCity,
	updateTravelMapMeta,
	upsertCountry,
	validateIntegrity,
	validateTravelMap,
	type TravelMapCity,
	type TravelMapCountry,
	type TravelMapData,
} from "../content/travel-map-store";
import {
	countFlights,
	deleteFlight,
	getFlightSummaryByAirport,
	insertFlight,
	listFlights,
	replaceAllFlights,
	type FlightInput,
} from "../content/flight-store";
import { TRAVEL_MAP_FALLBACK } from "../content/travel-map";

async function getMapOrFallback(db: D1Database): Promise<TravelMapData> {
	const loaded = await loadTravelMapFromDb(db);
	if (loaded && loaded.cities.length > 0) return loaded;
	const fb = validateTravelMap(TRAVEL_MAP_FALLBACK);
	return fb ?? (TRAVEL_MAP_FALLBACK as TravelMapData);
}

async function freshMap(db: D1Database): Promise<TravelMapData> {
	const loaded = await loadTravelMapFromDb(db);
	if (loaded && loaded.cities.length > 0) return loaded;
	return getMapOrFallback(db);
}

async function auditRespond(
	ctx: ApiContext,
	map: TravelMapData,
	action: string,
): Promise<Response> {
	await logApiAudit(ctx.env.DB, {
		actor: "admin",
		action,
		resource: "travel-map",
		resourceId: "landing.travelmap",
		ip: ctx.ip,
	});
	return jsonOk({ map, errors: validateIntegrity(map) }, ctx.meta);
}

async function persist(ctx: ApiContext, map: TravelMapData, action: string): Promise<Response> {
	const errors = validateIntegrity(map);
	if (errors.length) {
		return jsonError("VALIDATION_ERROR", errors.join("; "), ctx.meta, 400);
	}
	await saveTravelMapToDb(ctx.env.DB, map);
	return auditRespond(ctx, map, action);
}

export async function handleAdminTravelMap(ctx: ApiContext): Promise<Response> {
	const denied = await requireAdmin(ctx);
	if (denied) return denied;

	const method = ctx.request.method;
	const sub = ctx.segments[2] ?? "";
	const id = ctx.segments[3];
	const action = ctx.segments[4];
	const db = ctx.env.DB;

	// GET /admin/travel-map/lookup?q=...
	if (method === "GET" && sub === "lookup") {
		const url = new URL(ctx.request.url);
		const q = url.searchParams.get("q") ?? "";
		const type = (url.searchParams.get("type") ?? "auto") as
			| "auto"
			| "city"
			| "airport"
			| "country";
		if (q.length < 2) return jsonOk({ results: [] }, ctx.meta);
		try {
			if (type === "country") {
				const results = await lookupCountries(q);
				return jsonOk({ results }, ctx.meta);
			}
			const results = await lookupPlaces(q, type);
			return jsonOk({ results }, ctx.meta);
		} catch (e) {
			return jsonError(
				"LOOKUP_FAILED",
				e instanceof Error ? e.message : "Lookup failed",
				ctx.meta,
				502,
			);
		}
	}

	// GET /admin/travel-map
	if (method === "GET" && !sub) {
		const map = await getMapOrFallback(db);
		return jsonOk({ map, errors: validateIntegrity(map) }, ctx.meta);
	}

	// PUT /admin/travel-map — full replace
	if (method === "PUT" && !sub) {
		const body = await readJson<{ map?: unknown }>(ctx.request);
		const parsed = validateTravelMap(body?.map);
		if (!parsed) return jsonError("BAD_REQUEST", "Geçersiz harita JSON.", ctx.meta, 400);
		return persist(ctx, parsed, "travel-map.replace");
	}

	// POST /admin/travel-map/validate
	if (method === "POST" && sub === "validate") {
		const body = await readJson<{ map?: unknown }>(ctx.request);
		const parsed = validateTravelMap(body?.map ?? (await getMapOrFallback(db)));
		if (!parsed) return jsonError("BAD_REQUEST", "Geçersiz harita.", ctx.meta, 400);
		return jsonOk({ valid: true, errors: validateIntegrity(parsed), map: parsed }, ctx.meta);
	}

	// PATCH /admin/travel-map/meta
	if (method === "PATCH" && sub === "meta") {
		const body = await readJson<Partial<TravelMapData>>(ctx.request);
		await updateTravelMapMeta(db, {
			title: body.title != null ? String(body.title) : undefined,
			subtitle: body.subtitle != null ? String(body.subtitle) : undefined,
			homeHub: body.homeHub as TravelMapData["homeHub"],
			opening: body.opening as TravelMapData["opening"],
			globe: body.globe as TravelMapData["globe"],
		});
		return auditRespond(ctx, await freshMap(db), "travel-map.meta");
	}

	// POST /admin/travel-map/routes/rebuild
	if (method === "POST" && sub === "routes" && id === "rebuild") {
		const body = await readJson<{ hubId?: string }>(ctx.request);
		const map = await getMapOrFallback(db);
		const hubId = body?.hubId ?? map.cities.find((c) => c.role === "home")?.id ?? "doha";
		await replaceRoutes(db, buildHubRoutes(hubId, map.cities));
		return auditRespond(ctx, await freshMap(db), "travel-map.routes.rebuild");
	}

	// --- Countries ---
	if (sub === "countries") {
		if (method === "GET" && !id) {
			return jsonOk({ countries: await listCountries(db) }, ctx.meta);
		}

		if (method === "POST" && !id) {
			const body = await readJson<TravelMapCountry>(ctx.request);
			if (!body?.iso2 || !body?.name) {
				return jsonError("BAD_REQUEST", "iso2 ve name zorunlu.", ctx.meta, 400);
			}
			const iso2 = body.iso2.toUpperCase();
			if (await getCountry(db, iso2)) {
				return jsonError("CONFLICT", "Ülke zaten var.", ctx.meta, 409);
			}
			const paletteMap = await getMapOrFallback(db);
			await upsertCountry(db, {
				iso2,
				name: body.name,
				visited: body.visited ?? true,
				favorite: body.favorite,
				color: body.color ?? nextCountryColor(paletteMap),
				narrative: body.narrative,
			});
			return auditRespond(ctx, await freshMap(db), "travel-map.country.create");
		}

		if (id) {
			const iso = id.toUpperCase();

			if (method === "GET") {
				const country = await getCountry(db, iso);
				if (!country) return jsonError("NOT_FOUND", "Ülke yok.", ctx.meta, 404);
				return jsonOk({ country }, ctx.meta);
			}

			if (method === "PATCH") {
				const existing = await getCountry(db, iso);
				if (!existing) return jsonError("NOT_FOUND", "Ülke yok.", ctx.meta, 404);
				const body = await readJson<Partial<TravelMapCountry>>(ctx.request);
				await upsertCountry(db, { ...existing, ...body, iso2: iso });
				return auditRespond(ctx, await freshMap(db), "travel-map.country.update");
			}

			if (method === "DELETE") {
				if (!(await getCountry(db, iso))) {
					return jsonError("NOT_FOUND", "Ülke yok.", ctx.meta, 404);
				}
				const cities = await listCities(db, iso);
				if (cities.length) {
					return jsonError("CONFLICT", "Önce bu ülkedeki şehirleri silin.", ctx.meta, 409);
				}
				await deleteCountry(db, iso);
				return auditRespond(ctx, await freshMap(db), "travel-map.country.delete");
			}
		}
	}

	// --- Cities ---
	if (sub === "cities") {
		if (method === "GET" && !id) {
			const url = new URL(ctx.request.url);
			const country = url.searchParams.get("country");
			const cities = country
				? await listCities(db, country)
				: await listCities(db);
			return jsonOk({ cities }, ctx.meta);
		}

		if (method === "POST" && !id) {
			const body = await readJson<Partial<TravelMapCity>>(ctx.request);
			if (!body?.name || !body?.country || body.lat == null || body.lng == null) {
				return jsonError("BAD_REQUEST", "name, country, lat, lng zorunlu.", ctx.meta, 400);
			}
			const cityId = body.id?.trim() || slugifyId(body.name);
			if (await getCity(db, cityId)) {
				return jsonError("CONFLICT", `Şehir id "${cityId}" zaten var.`, ctx.meta, 409);
			}
			const countryIso = body.country.toUpperCase();
			const countryRow = await getCountry(db, countryIso);
			if (!countryRow) {
				const paletteMap = await getMapOrFallback(db);
				await upsertCountry(db, {
					iso2: countryIso,
					name: body.countryName ?? countryIso,
					visited: true,
					color: nextCountryColor(paletteMap),
				});
			}
			await insertCity(db, {
				id: cityId,
				name: body.name,
				country: countryIso,
				countryName: body.countryName ?? countryRow?.name,
				lat: Number(body.lat),
				lng: Number(body.lng),
				role: body.role ?? "visited",
				visitedWith: body.visitedWith,
				visits: body.visits,
				note: body.note,
				airportCode: body.airportCode?.toUpperCase(),
				story: body.story,
			});
			return auditRespond(ctx, await freshMap(db), "travel-map.city.create");
		}

		if (id) {
			// PATCH /admin/travel-map/cities/:id/story
			if (action === "story") {
				const city = await getCity(db, id);
				if (!city) return jsonError("NOT_FOUND", "Şehir yok.", ctx.meta, 404);
				if (method === "GET") return jsonOk({ story: city.story ?? null }, ctx.meta);
				if (method === "PATCH") {
					const body = await readJson<{ story?: Record<string, unknown> | null }>(ctx.request);
					await updateCity(db, id, { story: body?.story ?? undefined });
					return auditRespond(ctx, await freshMap(db), "travel-map.city.story");
				}
			}

			if (method === "GET") {
				const city = await getCity(db, id);
				if (!city) return jsonError("NOT_FOUND", "Şehir yok.", ctx.meta, 404);
				return jsonOk({ city }, ctx.meta);
			}

			if (method === "PATCH") {
				const existing = await getCity(db, id);
				if (!existing) return jsonError("NOT_FOUND", "Şehir yok.", ctx.meta, 404);
				const body = await readJson<Partial<TravelMapCity>>(ctx.request);
				await updateCity(db, id, {
					...body,
					lat: body.lat != null ? Number(body.lat) : undefined,
					lng: body.lng != null ? Number(body.lng) : undefined,
					airportCode: body.airportCode?.toUpperCase(),
				});
				return auditRespond(ctx, await freshMap(db), "travel-map.city.update");
			}

			if (method === "DELETE") {
				if (!(await getCity(db, id))) {
					return jsonError("NOT_FOUND", "Şehir yok.", ctx.meta, 404);
				}
				await deleteCity(db, id);
				return auditRespond(ctx, await freshMap(db), "travel-map.city.delete");
			}
		}
	}

	// --- Flights ---
	if (sub === "flights") {
		if (method === "POST" && id === "import") {
			const body = await readJson<{ flights?: unknown }>(ctx.request);
			if (!Array.isArray(body?.flights)) {
				return jsonError("BAD_REQUEST", "flights dizisi zorunlu.", ctx.meta, 400);
			}
			const parsed: FlightInput[] = [];
			for (const raw of body.flights) {
				if (!raw || typeof raw !== "object") continue;
				const row = raw as Record<string, unknown>;
				const flightNumber = String(row.flightNumber ?? row.flight ?? "").trim();
				const fromIata = String(row.fromIata ?? row.from ?? "").trim();
				const toIata = String(row.toIata ?? row.to ?? "").trim();
				if (!flightNumber || fromIata.length !== 3 || toIata.length !== 3) continue;
				const entry: FlightInput = { flightNumber, fromIata, toIata };
				if (row.blockHrs != null) entry.blockHrs = Number(row.blockHrs);
				if (row.acReg != null) entry.acReg = String(row.acReg);
				parsed.push(entry);
			}
			if (!parsed.length) {
				return jsonError("BAD_REQUEST", "Geçerli uçuş kaydı yok.", ctx.meta, 400);
			}
			const imported = await replaceAllFlights(db, parsed);
			await logApiAudit(ctx.env.DB, {
				actor: "admin",
				action: "travel-map.flights.import",
				resource: "travel-flights",
				resourceId: String(imported),
				ip: ctx.ip,
			});
			const summary = await getFlightSummaryByAirport(db);
			return jsonOk(
				{
					imported,
					count: await countFlights(db),
					summaryByAirport: Object.fromEntries(summary),
				},
				ctx.meta,
			);
		}

		if (method === "GET" && !id) {
			const url = new URL(ctx.request.url);
			const airport = url.searchParams.get("airport") ?? undefined;
			const flights = await listFlights(db, airport ? { airport } : undefined);
			const summary = await getFlightSummaryByAirport(db);
			return jsonOk(
				{
					flights,
					count: flights.length,
					summaryByAirport: Object.fromEntries(summary),
				},
				ctx.meta,
			);
		}

		if (method === "POST" && !id) {
			const body = await readJson<{
				flightNumber?: string;
				fromIata?: string;
				toIata?: string;
				blockHrs?: number;
				acReg?: string;
			}>(ctx.request);
			if (!body?.flightNumber || !body?.fromIata || !body?.toIata) {
				return jsonError(
					"BAD_REQUEST",
					"flightNumber, fromIata ve toIata zorunlu.",
					ctx.meta,
					400,
				);
			}
			const newId = await insertFlight(db, {
				flightNumber: body.flightNumber,
				fromIata: body.fromIata,
				toIata: body.toIata,
				blockHrs: body.blockHrs,
				acReg: body.acReg,
			});
			await logApiAudit(ctx.env.DB, {
				actor: "admin",
				action: "travel-map.flight.create",
				resource: "travel-flights",
				resourceId: String(newId),
				ip: ctx.ip,
			});
			const flights = await listFlights(db);
			const summary = await getFlightSummaryByAirport(db);
			return jsonOk(
				{
					id: newId,
					flights,
					count: flights.length,
					summaryByAirport: Object.fromEntries(summary),
				},
				ctx.meta,
			);
		}

		if (method === "DELETE" && id) {
			const flightId = parseInt(id, 10);
			if (Number.isNaN(flightId) || !(await deleteFlight(db, flightId))) {
				return jsonError("NOT_FOUND", "Uçuş kaydı yok.", ctx.meta, 404);
			}
			await logApiAudit(ctx.env.DB, {
				actor: "admin",
				action: "travel-map.flight.delete",
				resource: "travel-flights",
				resourceId: id,
				ip: ctx.ip,
			});
			const flights = await listFlights(db);
			const summary = await getFlightSummaryByAirport(db);
			return jsonOk(
				{
					deleted: flightId,
					flights,
					count: flights.length,
					summaryByAirport: Object.fromEntries(summary),
				},
				ctx.meta,
			);
		}
	}

	// --- Routes ---
	if (sub === "routes") {
		if (method === "GET" && !id) {
			return jsonOk({ routes: await listRoutes(db) }, ctx.meta);
		}

		if (method === "POST" && !id) {
			const body = await readJson<{ from: string; to: string; type?: string; label?: string }>(
				ctx.request,
			);
			if (!body?.from || !body?.to) {
				return jsonError("BAD_REQUEST", "from ve to zorunlu.", ctx.meta, 400);
			}
			await insertRoute(db, {
				from: body.from,
				to: body.to,
				type: body.type ?? "flight",
				label: body.label,
			});
			return auditRespond(ctx, await freshMap(db), "travel-map.route.create");
		}

		if (method === "DELETE" && id) {
			const idx = parseInt(id, 10);
			if (Number.isNaN(idx) || !(await deleteRoute(db, idx))) {
				return jsonError("NOT_FOUND", "Rota yok.", ctx.meta, 404);
			}
			return auditRespond(ctx, await freshMap(db), "travel-map.route.delete");
		}
	}

	return jsonError("METHOD_NOT_ALLOWED", "Desteklenmeyen yöntem.", ctx.meta, 405);
}
