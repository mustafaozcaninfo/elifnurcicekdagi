/** Travel Map JSON schema — v1 (CMS + direct JSON import) */

export type TravelMapCity = {
	id: string;
	name: string;
	country: string;
	countryName?: string;
	lat: number;
	lng: number;
	role?: "home" | "hub" | "visited" | "layover";
	visits?: number;
	note?: string;
};

export type TravelMapCountry = {
	iso2: string;
	name: string;
	visited: boolean;
	color?: string;
};

export type TravelMapRoute = {
	from: string;
	to: string;
	type?: "flight" | "road" | "sea";
	label?: string;
};

export type TravelMapHub = {
	code: string;
	city: string;
	lat: number;
	lng: number;
};

export type TravelMapData = {
	version: 1;
	title: string;
	subtitle: string;
	homeHub?: TravelMapHub;
	stats?: {
		countries?: number;
		cities?: number;
		continents?: number;
	};
	countries: TravelMapCountry[];
	cities: TravelMapCity[];
	routes?: TravelMapRoute[];
	globe?: {
		atmosphereColor?: string;
		pointColor?: string;
		arcColor?: string;
		autoRotateSpeed?: number;
	};
};

export const DEFAULT_TRAVEL_MAP: TravelMapData = {
	version: 1,
	title: "Explorer Atlas",
	subtitle: "Countries and cities from the flight deck and beyond",
	homeHub: { code: "IST", city: "Istanbul", lat: 41.0082, lng: 28.9784 },
	stats: { countries: 2, cities: 4, continents: 2 },
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
			visits: 1,
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
			visits: 1,
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
			visits: 1,
			note: "Capital horizons",
		},
		{
			id: "doha",
			name: "Doha",
			country: "QA",
			countryName: "Qatar",
			lat: 25.2854,
			lng: 51.531,
			role: "hub",
			visits: 1,
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
	return {
		version: 1,
		title: typeof o.title === "string" ? o.title : DEFAULT_TRAVEL_MAP.title,
		subtitle: typeof o.subtitle === "string" ? o.subtitle : DEFAULT_TRAVEL_MAP.subtitle,
		homeHub: o.homeHub as TravelMapHub | undefined,
		stats: o.stats as TravelMapData["stats"],
		countries: o.countries as TravelMapCountry[],
		cities,
		routes: Array.isArray(o.routes) ? (o.routes as TravelMapRoute[]) : [],
		globe: o.globe as TravelMapData["globe"],
	};
}
