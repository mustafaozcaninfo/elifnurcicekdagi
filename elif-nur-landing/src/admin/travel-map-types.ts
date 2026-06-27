import type {
	TravelMapCity,
	TravelMapCountry,
	TravelMapData,
	TravelMapRoute,
} from "../data/travel-map-types";

export type CountryLookupResult = {
	id: string;
	iso2: string;
	name: string;
	officialName?: string;
	lat: number;
	lng: number;
	region?: string;
	subregion?: string;
	continent?: string;
	continentName?: string;
	source: string;
};

export type LookupResult = {
	id: string;
	name: string;
	lat: number;
	lng: number;
	country?: string;
	countryCode?: string;
	airportCode?: string;
	admin1?: string;
	source: string;
};

export type AdminTravelMapResponse = {
	map: TravelMapData;
	errors: string[];
};

export type { TravelMapCity, TravelMapCountry, TravelMapData, TravelMapRoute };
