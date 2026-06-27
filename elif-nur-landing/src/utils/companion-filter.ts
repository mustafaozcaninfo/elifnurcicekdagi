import type { TravelMapCity, TravelMapData } from "../data/travel-map";

export type CompanionFilter = "all" | "solo" | "spouse";

export function hashToCompanion(hash: string): CompanionFilter {
	const h = hash.replace(/^#/, "").toLowerCase();
	if (h === "solo") return "solo";
	if (h === "husband" || h === "spouse") return "spouse";
	return "all";
}

export function companionToHash(filter: CompanionFilter): string {
	if (filter === "solo") return "#solo";
	if (filter === "spouse") return "#husband";
	return "";
}

export function isAnchorCity(city: TravelMapCity): boolean {
	return city.role === "home" || city.role === "hub";
}

/** Visited with husband — explicit spouse tag only. */
export function isWithSpouse(city: TravelMapCity): boolean {
	return city.visitedWith === "spouse";
}

/** Solo journey — everything not tagged as with husband (incl. unmarked pilot stops). */
export function isSoloCompanion(city: TravelMapCity): boolean {
	return !isWithSpouse(city);
}

function cityMatchesCompanion(city: TravelMapCity, filter: CompanionFilter): boolean {
	if (filter === "all") return true;
	if (isAnchorCity(city)) return true;
	if (filter === "spouse") return isWithSpouse(city);
	return isSoloCompanion(city);
}

export function filterTravelMapByCompanion(
	data: TravelMapData,
	filter: CompanionFilter,
): TravelMapData {
	if (filter === "all") return data;

	const cityIds = new Set(
		data.cities.filter((c) => cityMatchesCompanion(c, filter)).map((c) => c.id),
	);
	const cities = data.cities.filter((c) => cityIds.has(c.id));
	const countryIsos = new Set(cities.map((c) => c.country));
	const countries = data.countries.filter((c) => countryIsos.has(c.iso2));
	const routes = (data.routes ?? []).filter(
		(r) => cityIds.has(r.from) && cityIds.has(r.to),
	);

	return { ...data, cities, countries, routes };
}

/** Count journey cities for ledger (excludes origin / hub anchors). */
export function countCompanionCities(cities: TravelMapCity[]) {
	const journey = cities.filter((c) => !isAnchorCity(c));
	return {
		withSpouse: journey.filter(isWithSpouse).length,
		solo: journey.filter(isSoloCompanion).length,
	};
}
