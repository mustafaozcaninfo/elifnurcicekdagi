export type {
	AirportFlightSummary,
	CityStory,
	CityStorySection,
	CountryNarrative,
	TravelMapCity,
	TravelMapCountry,
	TravelMapData,
	TravelMapHub,
	TravelMapOpening,
	TravelMapRoute,
} from "./travel-map-types";

import { attachAllCityStories } from "./city-story-generator";
import { CITY_STORIES } from "./city-stories";
import type {
	TravelMapCity,
	TravelMapCountry,
	TravelMapData,
	TravelMapHub,
	TravelMapOpening,
	TravelMapRoute,
} from "./travel-map-types";
import { WORLD_TRAVEL_MAP } from "./world-travel-map";

export { WORLD_TRAVEL_MAP as DEFAULT_TRAVEL_MAP } from "./world-travel-map";

export function mergeTravelMapStories(map: TravelMapData): TravelMapData {
	return {
		...map,
		opening: map.opening ?? WORLD_TRAVEL_MAP.opening,
		homeHub: map.homeHub ?? WORLD_TRAVEL_MAP.homeHub,
		countries: map.countries.map((c) => {
			const fallback = WORLD_TRAVEL_MAP.countries.find((x) => x.iso2 === c.iso2);
			return {
				...c,
				narrative: c.narrative ?? fallback?.narrative,
				favorite: c.favorite ?? fallback?.favorite,
				color: c.color ?? fallback?.color,
			};
		}),
		cities: attachAllCityStories(
			map.cities.map((city) => ({
				...city,
				story: city.story ?? CITY_STORIES[city.id],
			})),
		),
	};
}

export function normalizeTravelMap(raw: unknown): TravelMapData | null {
	if (!raw || typeof raw !== "object") return null;
	const o = raw as Record<string, unknown>;
	if (!Array.isArray(o.countries) || !Array.isArray(o.cities)) return null;
	const cities = o.cities.filter(
		(c): c is TravelMapCity =>
			typeof c === "object" &&
			c !== null &&
			typeof (c as TravelMapCity).id === "string" &&
			typeof (c as TravelMapCity).lat === "number" &&
			typeof (c as TravelMapCity).lng === "number",
	);
	if (!cities.length) return null;
	return mergeTravelMapStories({
		version: 1,
		title: typeof o.title === "string" ? o.title : WORLD_TRAVEL_MAP.title,
		subtitle: typeof o.subtitle === "string" ? o.subtitle : WORLD_TRAVEL_MAP.subtitle,
		homeHub: o.homeHub as TravelMapHub | undefined,
		opening: o.opening as TravelMapOpening | undefined,
		stats: o.stats as TravelMapData["stats"],
		countries: o.countries as TravelMapCountry[],
		cities,
		routes: Array.isArray(o.routes) ? (o.routes as TravelMapRoute[]) : WORLD_TRAVEL_MAP.routes,
		globe: (o.globe as TravelMapData["globe"]) ?? WORLD_TRAVEL_MAP.globe,
		flightSummary: o.flightSummary as TravelMapData["flightSummary"],
	});
}

export function cityLabel(city: TravelMapCity): string {
	return city.airportCode ?? city.name.slice(0, 3).toUpperCase();
}

export function roleBadge(role?: TravelMapCity["role"]): string {
	switch (role) {
		case "home":
			return "ORIGIN";
		case "hub":
			return "VISITED";
		case "layover":
			return "LAYOVER";
		default:
			return "VISITED";
	}
}

export function visitBadge(city: TravelMapCity): string | null {
	if (city.role === "home" || city.role === "hub") return null;
	if (city.visitedWith === "spouse") return "♥";
	return "Solo";
}
