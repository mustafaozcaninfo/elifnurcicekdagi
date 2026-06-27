/** Country-level narratives — merged into travel map and city story generator. */

export type CountryNarrative = {
	tag: string;
	headline: string;
	body: string;
};

export const COUNTRY_NARRATIVES: Record<string, CountryNarrative> = {
	US: {
		tag: "North America",
		headline: "United States — coast to coast",
		body: "From Pacific Northwest rain to Atlantic skylines and Gulf warmth — ten American cities mapped with my husband, where aviation culture and urban discovery meet.",
	},
	CA: {
		tag: "North America",
		headline: "Canada — bilingual horizons",
		body: "Vancouver's mountains, Montreal's rhythm, and the fairy-tale streets of Quebec City — North America with a European soul.",
	},
	IL: {
		tag: "Middle East",
		headline: "Israel — Mediterranean edge",
		body: "Tel Aviv where the sea meets startup energy — a sharp, sunlit chapter on the eastern Mediterranean.",
	},
	GB: {
		tag: "Europe",
		headline: "United Kingdom — four kingdoms, one map",
		body: "Edinburgh's drama, Liverpool's harbour, Birmingham's heart, and London's endless final approach — Britain explored together.",
	},
	NL: {
		tag: "Europe",
		headline: "Netherlands — below sea level, above ordinary",
		body: "Amsterdam's canals and golden-hour bridges — a city best discovered on foot after the wheels touch down.",
	},
	DE: {
		tag: "Europe",
		headline: "Germany — precision and poetry",
		body: "Frankfurt's global crossroads with my husband, Kehl on the Rhine border, and Munich's Bavarian elegance on solo approaches.",
	},
	FR: {
		tag: "Europe",
		headline: "France — light, wine, and Alsace",
		body: "Paris at golden hour, Colmar's half-timbered lanes, and Strasbourg's cathedral spires — la vie in three registers.",
	},
	IT: {
		tag: "Europe",
		headline: "Italy — art, appetite, and islands",
		body: "Venice at dawn, Milan's fashion pulse, Rome's eternal weight, Florence's Renaissance heart, and Sardinia's turquoise escape.",
	},
	CH: {
		tag: "Europe",
		headline: "Switzerland — alpine precision",
		body: "Zurich's lake-and-alpine symmetry and Basel's Rhine tripoint — neutral ground, maximum beauty.",
	},
	MY: {
		tag: "Southeast Asia",
		headline: "Malaysia — towers and tropics",
		body: "Kuala Lumpur where Petronas steel rises above humid green — Southeast Asia's confident skyline.",
	},
	AU: {
		tag: "Oceania",
		headline: "Australia — sun, surf, and solo miles",
		body: "Sydney's harbour, Queensland's coast, and wine country with my husband — plus Melbourne and Perth, written as solo chapters.",
	},
	QA: {
		tag: "Gulf · Qatar",
		headline: "Qatar — where my routes begin",
		body: "Doha is home base — the city from which I reach every continent on this map.",
	},
	TR: {
		tag: "Origin",
		headline: "Turkey — where I began",
		body: "Istanbul where continents meet, Ankara's wide skies, Antalya's coast, and Izmir's Aegean breeze — the origin I always return to.",
	},
	CN: {
		tag: "East Asia",
		headline: "China — scale and contrast",
		body: "Shanghai's Pudong futurism, Guangzhou's Pearl River delta, and Beijing's imperial axis — three faces of a civilization in motion.",
	},
	HK: {
		tag: "East Asia",
		headline: "Hong Kong — vertical harbour",
		body: "Victoria Harbour compressed between forested peaks and neon — density as an art form, explored together.",
	},
	UG: {
		tag: "East Africa",
		headline: "Uganda — green highlands",
		body: "Kampala's rolling hills — East Africa's understated capital and a reminder of how vast the continent feels from altitude.",
	},
	TH: {
		tag: "Southeast Asia",
		headline: "Thailand — temples and turquoise",
		body: "Bangkok's Chao Phraya rhythm and Phuket's Andaman shores — warmth, spice, and golden light.",
	},
	EC: {
		tag: "South America",
		headline: "Ecuador — altitude and equator",
		body: "Quito perched high in the Andes — thin air, colonial geometry, and the middle of the world.",
	},
	CO: {
		tag: "South America",
		headline: "Colombia — Andean plateau",
		body: "Bogotá's mountain capital — cool air, bold coffee culture, and South American momentum.",
	},
	AR: {
		tag: "South America",
		headline: "Argentina — tango and distance",
		body: "Buenos Aires where European elegance meets Latin fire — a city that rewards slow evenings.",
	},
	BE: {
		tag: "Europe",
		headline: "Belgium — EU heartland",
		body: "Brussels' diplomatic gravity and Liège's Meuse valley — compact countries, layered history.",
	},
	BR: {
		tag: "South America",
		headline: "Brazil — megacity pulse",
		body: "São Paulo's endless urban fabric and Campinas nearby — the engine room of South America.",
	},
	JP: {
		tag: "East Asia",
		headline: "Japan — discipline and wonder",
		body: "Tokyo's neon, Kyoto's temples, Osaka and Kobe's Kansai soul — mostly with my husband, Nagoya as a solo chapter.",
	},
	SE: {
		tag: "Scandinavia",
		headline: "Sweden — Baltic light",
		body: "Stockholm's archipelago shimmer — Nordic clarity, design, and long summer evenings.",
	},
	KE: {
		tag: "East Africa",
		headline: "Kenya — savannah gateway",
		body: "Nairobi where urban Africa meets the wild — a city that smells of rain and adventure.",
	},
	MX: {
		tag: "North America",
		headline: "Mexico — highland capital",
		body: "Mexico City's altitude, murals, and endless neighbourhoods — one of the world's great urban tapestries.",
	},
	PH: {
		tag: "Southeast Asia",
		headline: "Philippines — archipelago hub",
		body: "Manila's humid energy — gateway to seven thousand islands and Pacific warmth.",
	},
	MV: {
		tag: "Indian Ocean",
		headline: "Maldives — atoll capital",
		body: "Malé where turquoise infinity begins — the Indian Ocean at its most distilled.",
	},
	NZ: {
		tag: "Oceania",
		headline: "New Zealand — Middle-earth mapped",
		body: "Twelve cities across both islands with my husband — from Auckland sails to Queenstown peaks. Dunedin remains the one pin still waiting.",
	},
	PT: {
		tag: "Europe",
		headline: "Portugal — Atlantic soul",
		body: "Lisbon's seven hills, Cascais and Sintra's coast, Belém's monuments, and Porto's Douro — Iberia's quieter masterpiece.",
	},
	MO: {
		tag: "East Asia",
		headline: "Macau — where cultures collide",
		body: "A compact peninsula of Portuguese heritage and Chinese scale — East meets West in a single afternoon.",
	},
	KR: {
		tag: "East Asia",
		headline: "South Korea — Han River pulse",
		body: "Seoul's relentless creativity — K-culture, street food, and neon valleys explored together.",
	},
	SG: {
		tag: "Southeast Asia",
		headline: "Singapore — garden city state",
		body: "A nation distilled to perfection — hawker stalls, orchids, and one of aviation's great hubs.",
	},
	IN: {
		tag: "South Asia",
		headline: "India — gateway intensity",
		body: "Mumbai's monsoon energy and colonial harbour — India compressed into a single overwhelming arrival.",
	},
	HU: {
		tag: "Europe",
		headline: "Hungary — Danube romance",
		body: "Budapest's thermal baths and illuminated bridges — the Paris of the East, explored together.",
	},
	GR: {
		tag: "Europe",
		headline: "Greece — myth and light",
		body: "Athens' Acropolis, Santorini's caldera sunsets, and Milos' moonscape — the Aegean in three moods.",
	},
	CZ: {
		tag: "Europe",
		headline: "Czech Republic — golden spires",
		body: "Prague's medieval dreamscape — bridges, beer halls, and Gothic towers at every turn.",
	},
	TW: {
		tag: "East Asia",
		headline: "Taiwan — night markets and peaks",
		body: "Taipei's 101 skyline and mountain-backed city — island China with its own rhythm.",
	},
	SC: {
		tag: "Indian Ocean",
		headline: "Seychelles — granite and turquoise",
		body: "Victoria on Mahé — palm shadows, granite boulders, and the Indian Ocean at its most exclusive.",
	},
	NG: {
		tag: "West Africa",
		headline: "Nigeria — West African megacity",
		body: "Lagos' unstoppable momentum — Africa's most populous city and an education in energy.",
	},
	SA: {
		tag: "Middle East",
		headline: "Saudi Arabia — Red Sea gateway",
		body: "Jeddah's corniche and Red Sea horizon — ancient trade routes meeting modern aviation.",
	},
	ES: {
		tag: "Europe",
		headline: "Spain — Andalusia and beyond",
		body: "Seville, Córdoba, and Granada's Moorish soul with my husband — Zaragoza as a quiet solo interlude.",
	},
	VA: {
		tag: "Europe · Sacred",
		headline: "Vatican City — smallest nation",
		body: "A sovereign square kilometre of sacred art and silence — walked together beneath Michelangelo's dome.",
	},
	AT: {
		tag: "Europe",
		headline: "Austria — imperial grace",
		body: "Vienna's coffee houses, waltz history, and Habsburg avenues — Central Europe at its most refined.",
	},
};
