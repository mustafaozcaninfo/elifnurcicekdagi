import type { TravelMapCity } from "../data/travel-map";
import { isWithSpouse } from "./companion-filter";

export type GlobePoint = TravelMapCity & {
	size: number;
	color: string;
};

/** three-globe pointRadius is angular — keep values small (0.06–0.22). */
export function globePointColor(city: TravelMapCity, selected: boolean): string {
	if (selected) return "#D4A017";
	if (city.role === "home") return "#C25B3F";
	if (isWithSpouse(city)) return "#F5EDE4";
	if (city.role === "hub") return "#F0C14B";
	return "#85B8CB";
}

export function globePointSize(
	city: TravelMapCity,
	selected: boolean,
	mobile: boolean,
): number {
	const base = mobile ? 0.11 : 0.09;
	if (selected) return mobile ? 0.2 : 0.18;
	if (city.role === "home") return mobile ? 0.15 : 0.13;
	if (isWithSpouse(city)) return base + 0.015;
	return base;
}

export function buildGlobePoints(
	cities: TravelMapCity[],
	selectedId: string | null,
	mobile: boolean,
): GlobePoint[] {
	return cities.map((c) => ({
		...c,
		size: globePointSize(c, c.id === selectedId, mobile),
		color: globePointColor(c, c.id === selectedId),
	}));
}
