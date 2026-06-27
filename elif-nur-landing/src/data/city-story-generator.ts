import { COUNTRY_NARRATIVES } from "./country-narratives";
import { CITY_STORIES } from "./city-stories";
import type { CityStory, TravelMapCity } from "./travel-map-types";

const FLAGSHIP_OVERRIDES: Partial<Record<string, Partial<CityStory>>> = {
	"new-york": {
		headline: "The skyline from final",
		lead: "Manhattan's grid from the flight deck, then street-level chaos with my husband — America's defining city.",
	},
	paris: {
		headline: "City of light, twice seen",
		lead: "Eiffel glimpses on approach, café terraces on foot — Paris never loses its romance.",
	},
	london: {
		headline: "Thames and timelessness",
		lead: "Heathrow vectors over green patchwork, then the city that invented aviation history.",
	},
	tokyo: {
		headline: "Neon precision",
		lead: "Haneda approaches over Tokyo Bay — a city that rewards both discipline and wonder.",
	},
	sydney: {
		headline: "Harbour bridge chapter",
		lead: "The coathanger from the air, then ferry light on the water — Australia’s icon with my husband.",
	},
	singapore: {
		headline: "Garden in the tropics",
		lead: "Changi to Marina Bay — efficiency, hawker heat, and orchids explored together.",
	},
	rome: {
		headline: "Eternal approach",
		lead: "Fiumicino vectors over Lazio — history stacked layer upon layer, walked hand in hand.",
	},
	santorini: {
		headline: "Caldera light",
		lead: "White villages on volcanic rim — the Aegean at its most photographed, lived not just seen.",
	},
	queenstown: {
		headline: "Alpine adrenaline",
		lead: "Southern Alps from the flight deck, adventure on the ground — New Zealand's thrill capital.",
	},
	lisbon: {
		headline: "Seven hills, one love",
		lead: "Tram bells, fado echoes, and Atlantic light — Portugal's capital explored together.",
	},
	seoul: {
		headline: "Han River nights",
		lead: "Incheon approaches over reclaimed land — K-culture, street food, and neon valleys.",
	},
	"hong-kong": {
		headline: "Density as beauty",
		lead: "Victoria Peak views and harbour ferries — vertical life explored together.",
	},
	prague: {
		headline: "Golden hour spires",
		lead: "Charles Bridge at dawn — Bohemia's fairy tale walked together.",
	},
	vienna: {
		headline: "Waltz city",
		lead: "Imperial ring roads and coffee-house hours — Central Europe's most elegant chapter.",
	},
	cagliari: {
		headline: "Sardinia escape",
		lead: "Emerald water, granite coast, slow island time — the Mediterranean at its most private.",
	},
	melbourne: {
		headline: "Solo southern chapter",
		lead: "Laneways, coffee culture, and bay light — Melbourne written as my own solo story.",
	},
	perth: {
		headline: "Indian Ocean edge",
		lead: "The most isolated major city — a solo chapter on Australia's western frontier.",
	},
	nagoya: {
		headline: "Solo in Chūbu",
		lead: "Between Tokyo and Osaka — a quieter Japan discovered on my own.",
	},
	zaragoza: {
		headline: "Solo Aragón",
		lead: "Spain away from the crowds — basilica light and tapas for one.",
	},
};

function roleTag(city: TravelMapCity): string {
	switch (city.role) {
		case "home":
			return "Origin";
		case "hub":
			return "Visited";
		case "layover":
			return "Layover";
		default:
			return "Visited";
	}
}

function visitNarrative(city: TravelMapCity): { title: string; body: string } {
	if (city.visitedWith === "spouse") {
		return {
			title: "Together",
			body: "Explored with my husband — a shared pin on the map, a memory we return to in conversation.",
		};
	}
	if (city.visitedWith === "solo") {
		return {
			title: "Solo chapter",
			body: "Travelled alone — just me, the city, and the story I brought back to the flight deck.",
		};
	}
	if (city.role === "hub" || city.role === "home") {
		return {
			title: "Flight deck",
			body: "More than a destination — a base camp for routes, rhythms, and the life I built in aviation.",
		};
	}
	return {
		title: "From the cockpit",
		body: "Reached through long-haul routes and layover curiosity — the world as an Airline Pilot sees it.",
	};
}

export function generateCityStory(city: TravelMapCity): CityStory {
	if (CITY_STORIES[city.id]) return CITY_STORIES[city.id];

	const country = COUNTRY_NARRATIVES[city.country];
	const override = FLAGSHIP_OVERRIDES[city.id];
	const visit = visitNarrative(city);
	const code = city.airportCode ?? city.name.slice(0, 3).toUpperCase();

	return {
		tag: `${country?.tag ?? city.countryName ?? city.country} · ${roleTag(city.role)}`,
		headline: override?.headline ?? city.name,
		lead:
			override?.lead ??
			city.note ??
			`${code} — a waypoint in ${city.countryName ?? city.country}.`,
		sections: [
			{
				type: "journey",
				title: country?.headline ?? city.countryName ?? "Journey",
				body: country?.body ?? `Part of my travels across ${city.countryName ?? "the world"}.`,
			},
			{
				type: "note",
				title: visit.title,
				body: visit.body,
			},
			...(city.note && !override?.lead
				? [
						{
							type: "note" as const,
							title: "On the ground",
							body: city.note,
						},
					]
				: []),
		],
		...override,
	};
}

export function attachAllCityStories(cities: TravelMapCity[]): TravelMapCity[] {
	return cities.map((city) => ({
		...city,
		story: city.story ?? generateCityStory(city),
	}));
}
