import { jsonError, jsonOk } from "../../shared/response";
import type { ApiContext } from "../context";
import { getFlightSummaryByAirport } from "./flight-store";
import {
	computeStats,
	loadTravelMapFromDb,
	TRAVEL_MAP_SETTING_KEY,
	type TravelMapData,
} from "./travel-map-store";

const SETTING_KEY = TRAVEL_MAP_SETTING_KEY;
const LEGACY_SETTING_KEY = "landing.travelMap";

const FALLBACK = {
	version: 1,
	title: "Explorer Atlas",
	subtitle: "Countries and cities from the flight deck and beyond",
	homeHub: { code: "IST", city: "Istanbul", lat: 41.0082, lng: 28.9784 },
	stats: { countries: 2, cities: 4, continents: 1 },
	countries: [
		{ iso2: "TR", name: "Turkey", visited: true, color: "#C25B3F" },
		{ iso2: "QA", name: "Qatar", visited: true, color: "#D4A017" },
	],
	cities: [
		{
			id: "istanbul",
			name: "Istanbul",
			country: "TR",
			countryName: "Turkey",
			lat: 41.0082,
			lng: 28.9784,
			role: "home",
			note: "Where continents meet",
		},
		{
			id: "antalya",
			name: "Antalya",
			country: "TR",
			countryName: "Turkey",
			lat: 36.8969,
			lng: 30.7133,
			role: "visited",
			note: "Mediterranean coast",
		},
		{
			id: "ankara",
			name: "Ankara",
			country: "TR",
			countryName: "Turkey",
			lat: 39.9334,
			lng: 32.8597,
			role: "visited",
			note: "Capital horizons",
		},
		{
			id: "doha",
			name: "Doha",
			country: "QA",
			countryName: "Qatar",
			lat: 25.2854,
			lng: 51.531,
			role: "visited",
			note: "Gulf connections",
		},
	],
	routes: [
		{ from: "istanbul", to: "doha", type: "flight", label: "IST → DOH" },
		{ from: "istanbul", to: "antalya", type: "flight", label: "IST → AYT" },
		{ from: "istanbul", to: "ankara", type: "flight", label: "IST → ESB" },
	],
	globe: {
		atmosphereColor: "#C25B3F",
		pointColor: "#F5EDE4",
		arcColor: "#D4A017",
		autoRotateSpeed: 0.35,
	},
};

export async function loadTravelMap(db: D1Database): Promise<TravelMapData> {
	try {
		const loaded = await loadTravelMapFromDb(db);
		if (loaded && loaded.cities.length > 0) return loaded;
	} catch {
		/* migration / empty */
	}
	return {
		...(FALLBACK as TravelMapData),
		stats: computeStats(FALLBACK as TravelMapData),
	};
}

/** GET /api/v1/travel/map — 3D explorer JSON (countries, cities, routes) */
export async function handleTravelMap(ctx: ApiContext): Promise<Response> {
	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	const map = await loadTravelMap(ctx.env.DB);
	const flightSummary = await getFlightSummaryByAirport(ctx.env.DB);

	return jsonOk(
		{
			...map,
			flightSummary: Object.fromEntries(flightSummary),
			schema: {
				version: 1,
				docs: "POST JSON to landing.travelMap via admin settings or replace via CMS",
				fields: ["countries[]", "cities[]", "routes[]", "globe", "stats"],
			},
		},
		ctx.meta,
		{ headers: { "cache-control": "public, max-age=60, s-maxage=300" } },
	);
}

export { SETTING_KEY as TRAVEL_MAP_SETTING_KEY, FALLBACK as TRAVEL_MAP_FALLBACK };
