/** Travel Map JSON schema — v1 (CMS + direct JSON import) */

export type CityStorySection = {
	type: "about" | "experience" | "journey" | "note";
	title: string;
	body?: string;
	imageUrl?: string;
};

export type CityStory = {
	tag: string;
	headline: string;
	lead?: string;
	portraitUrl?: string;
	sections?: CityStorySection[];
	showContact?: boolean;
};

export type TravelMapCity = {
	id: string;
	name: string;
	country: string;
	countryName?: string;
	lat: number;
	lng: number;
	role?: "home" | "hub" | "visited" | "layover";
	visitedWith?: "spouse" | "solo";
	visits?: number;
	note?: string;
	airportCode?: string;
	story?: CityStory;
};

export type CountryNarrative = {
	tag: string;
	headline: string;
	body: string;
};

export type TravelMapCountry = {
	iso2: string;
	name: string;
	visited: boolean;
	favorite?: boolean;
	color?: string;
	narrative?: CountryNarrative;
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

export type TravelMapOpening = {
	boot?: string;
	systems?: string;
	reveal?: string;
	hint?: string;
};

export type AirportFlightSummary = {
	sectors: number;
	blockHrs: number;
	flights: string[];
};

export type TravelFlightRecord = {
	id: number;
	flightNumber: string;
	fromIata: string;
	toIata: string;
	blockHrs?: number;
	acReg?: string;
};

export type TravelMapData = {
	version: 1;
	title: string;
	subtitle: string;
	homeHub?: TravelMapHub;
	opening?: TravelMapOpening;
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
	/** IATA → pilot log summary (sectors, block hrs, flight numbers) */
	flightSummary?: Record<string, AirportFlightSummary>;
};
