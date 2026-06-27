import { ABOUT_TEXT, EXPERIENCES, HERO_PORTRAIT } from "./images";
import type { CityStory } from "./travel-map-types";

/** Hand-crafted narrative panels for origin and base city. */
export const CITY_STORIES: Record<string, CityStory> = {
	istanbul: {
		tag: "Origin · Turkey",
		headline: "Hi, I'm Elif",
		lead: "Airline Pilot · Born between continents · This is where the story starts before every climb.",
		portraitUrl: HERO_PORTRAIT,
		showContact: true,
		sections: [
			{
				type: "about",
				title: "About me",
				body: ABOUT_TEXT,
			},
			...EXPERIENCES.map((e) => ({
				type: "experience" as const,
				title: e.title,
				body: e.desc,
			})),
			{
				type: "journey",
				title: "Turkey on the map",
				body: "Istanbul where Europe and Asia touch, Ankara's capital skies, Antalya's Mediterranean glow, and Izmir's Aegean breeze — the homeland I carry into every cockpit.",
			},
		],
	},
	doha: {
		tag: "Qatar · Gulf",
		headline: "Where many routes begin",
		lead: "Doha is my operational home — the Gulf city from which I fly six continents and pin a hundred cities on this atlas.",
		sections: [
			{
				type: "note",
				title: "Life in the Gulf",
				body: "Night departures over the Arabian Gulf, amber cockpit glow, and runways that never sleep. Aviation taught me that distance is not geography — it is rhythm.",
			},
			{
				type: "journey",
				title: "44 countries, one flight deck",
				body: "From Doha I have reached America, Europe, Asia, Africa, Oceania, and South America. Each sector adds a waypoint; each layover adds a chapter.",
			},
			{
				type: "note",
				title: "Together in Qatar",
				body: "Explored with my husband — the Gulf as both workplace and wonder.",
			},
		],
	},
};
