import type { TravelMapCity } from "../data/travel-map";
import { cityLabel } from "../data/travel-map";

export function globeLabelText(city: TravelMapCity): string {
	return cityLabel(city).toUpperCase();
}

/** All waypoints with codes — always visible in explore mode. */
export function buildGlobeLabelCities(cities: TravelMapCity[]): TravelMapCity[] {
	return cities.filter((c) => Boolean(c.airportCode) || c.role === "home" || c.role === "hub");
}

export function globeLabelSize(
	city: TravelMapCity,
	selectedId: string | null,
	hoverId: string | null,
	mobile: boolean,
): number {
	const base = mobile ? 1.22 : 1.38;
	if (city.id === selectedId) return base + 0.55;
	if (city.id === hoverId) return base + 0.28;
	if (city.role === "home" || city.role === "hub") return base + 0.22;
	return base;
}

export function globeLabelColor(
	city: TravelMapCity,
	selectedId: string | null,
	hoverId: string | null,
): string {
	if (city.id === selectedId) return "rgba(240, 193, 75, 1)";
	if (city.id === hoverId) return "rgba(245, 237, 228, 0.98)";
	if (city.role === "home") return "rgba(194, 91, 63, 0.98)";
	if (city.role === "hub") return "rgba(212, 160, 23, 0.96)";
	return "rgba(245, 237, 228, 0.9)";
}

export function globeLabelAltitude(
	city: TravelMapCity,
	selectedId: string | null,
	mobile: boolean,
): number {
	const base = mobile ? 0.034 : 0.042;
	if (city.id === selectedId) return base + 0.018;
	if (city.role === "home" || city.role === "hub") return base + 0.01;
	return base;
}
