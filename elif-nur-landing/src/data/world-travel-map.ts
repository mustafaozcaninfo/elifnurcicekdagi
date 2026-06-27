import { attachAllCityStories } from "./city-story-generator";
import { COUNTRY_NARRATIVES } from "./country-narratives";
import { countContinentsFromIso2 } from "../utils/continents";
import type {
	TravelMapCity,
	TravelMapCountry,
	TravelMapData,
	TravelMapRoute,
} from "./travel-map-types";

type CityDef = Omit<TravelMapCity, "countryName"> & { countryName: string };

const PALETTE = [
	"#C25B3F",
	"#D4A017",
	"#A8B5A2",
	"#1E2A44",
	"#8C7A6B",
	"#E8A87C",
	"#85B8CB",
	"#C38D9E",
	"#41B3A3",
	"#E27D60",
];

function city(
	iso2: string,
	countryName: string,
	def: Omit<CityDef, "country" | "countryName">,
): CityDef {
	return { ...def, country: iso2, countryName };
}

const COUNTRY_DEFS: { iso2: string; name: string; favorite?: boolean }[] = [
	{ iso2: "US", name: "United States", favorite: true },
	{ iso2: "CA", name: "Canada" },
	{ iso2: "IL", name: "Israel" },
	{ iso2: "GB", name: "United Kingdom", favorite: true },
	{ iso2: "NL", name: "Netherlands" },
	{ iso2: "DE", name: "Germany" },
	{ iso2: "FR", name: "France", favorite: true },
	{ iso2: "IT", name: "Italy", favorite: true },
	{ iso2: "CH", name: "Switzerland", favorite: true },
	{ iso2: "MY", name: "Malaysia" },
	{ iso2: "AU", name: "Australia", favorite: true },
	{ iso2: "QA", name: "Qatar", favorite: true },
	{ iso2: "TR", name: "Turkey", favorite: true },
	{ iso2: "CN", name: "China" },
	{ iso2: "HK", name: "Hong Kong", favorite: true },
	{ iso2: "UG", name: "Uganda" },
	{ iso2: "TH", name: "Thailand" },
	{ iso2: "EC", name: "Ecuador" },
	{ iso2: "CO", name: "Colombia" },
	{ iso2: "AR", name: "Argentina" },
	{ iso2: "BE", name: "Belgium" },
	{ iso2: "BR", name: "Brazil" },
	{ iso2: "JP", name: "Japan", favorite: true },
	{ iso2: "SE", name: "Sweden" },
	{ iso2: "KE", name: "Kenya" },
	{ iso2: "MX", name: "Mexico" },
	{ iso2: "PH", name: "Philippines" },
	{ iso2: "MV", name: "Maldives" },
	{ iso2: "NZ", name: "New Zealand", favorite: true },
	{ iso2: "PT", name: "Portugal", favorite: true },
	{ iso2: "MO", name: "Macau" },
	{ iso2: "KR", name: "South Korea", favorite: true },
	{ iso2: "SG", name: "Singapore", favorite: true },
	{ iso2: "IN", name: "India" },
	{ iso2: "HU", name: "Hungary" },
	{ iso2: "GR", name: "Greece", favorite: true },
	{ iso2: "CZ", name: "Czech Republic" },
	{ iso2: "TW", name: "Taiwan", favorite: true },
	{ iso2: "SC", name: "Seychelles" },
	{ iso2: "NG", name: "Nigeria" },
	{ iso2: "SA", name: "Saudi Arabia" },
	{ iso2: "ES", name: "Spain" },
	{ iso2: "VA", name: "Vatican City", favorite: true },
	{ iso2: "AT", name: "Austria" },
];

const RAW_CITIES: CityDef[] = [
	// 1 — United States (with spouse)
	city("US", "United States", {
		id: "portland",
		name: "Portland",
		lat: 45.5152,
		lng: -122.6784,
		airportCode: "PDX",
		visitedWith: "spouse",
		note: "Pacific Northwest",
	}),
	city("US", "United States", {
		id: "seattle",
		name: "Seattle",
		lat: 47.6062,
		lng: -122.3321,
		airportCode: "SEA",
		visitedWith: "spouse",
		note: "Emerald city approaches",
	}),
	city("US", "United States", {
		id: "new-york",
		name: "New York",
		lat: 40.7128,
		lng: -74.006,
		airportCode: "JFK",
		visitedWith: "spouse",
		note: "The city that never sleeps",
	}),
	city("US", "United States", {
		id: "washington-dc",
		name: "Washington, D.C.",
		lat: 38.9072,
		lng: -77.0369,
		airportCode: "DCA",
		visitedWith: "spouse",
		note: "Monuments from above",
	}),
	city("US", "United States", {
		id: "miami",
		name: "Miami",
		lat: 25.7617,
		lng: -80.1918,
		airportCode: "MIA",
		visitedWith: "spouse",
		note: "Atlantic coast light",
	}),
	city("US", "United States", {
		id: "chicago",
		name: "Chicago",
		lat: 41.8781,
		lng: -87.6298,
		airportCode: "ORD",
		visitedWith: "spouse",
		note: "Windy city grid",
	}),
	city("US", "United States", {
		id: "boise",
		name: "Boise",
		lat: 43.615,
		lng: -116.2023,
		airportCode: "BOI",
		visitedWith: "spouse",
		note: "Idaho horizons",
	}),
	city("US", "United States", {
		id: "philadelphia",
		name: "Philadelphia",
		lat: 39.9526,
		lng: -75.1652,
		airportCode: "PHL",
		visitedWith: "spouse",
		note: "Historic corridors",
	}),
	city("US", "United States", {
		id: "atlanta",
		name: "Atlanta",
		lat: 33.749,
		lng: -84.388,
		airportCode: "ATL",
		visitedWith: "spouse",
		note: "Southern hub",
	}),
	city("US", "United States", {
		id: "honolulu",
		name: "Honolulu",
		lat: 21.3069,
		lng: -157.8583,
		airportCode: "HNL",
		visitedWith: "spouse",
		note: "Hawaii · Pacific arrival",
	}),

	// 2 — Canada
	city("CA", "Canada", {
		id: "vancouver",
		name: "Vancouver",
		lat: 49.2827,
		lng: -123.1207,
		airportCode: "YVR",
		note: "Mountains meet the Pacific",
	}),
	city("CA", "Canada", {
		id: "montreal",
		name: "Montreal",
		lat: 45.5017,
		lng: -73.5673,
		airportCode: "YUL",
		note: "French-Canadian rhythm",
	}),
	city("CA", "Canada", {
		id: "quebec-city",
		name: "Quebec City",
		lat: 46.8139,
		lng: -71.208,
		airportCode: "YQB",
		visitedWith: "spouse",
		note: "Old world charm",
	}),

	// 3 — Israel
	city("IL", "Israel", {
		id: "tel-aviv",
		name: "Tel Aviv",
		lat: 32.0853,
		lng: 34.7818,
		airportCode: "TLV",
		note: "Mediterranean shore",
	}),

	// 4 — United Kingdom (with spouse)
	city("GB", "United Kingdom", {
		id: "edinburgh",
		name: "Edinburgh",
		lat: 55.9533,
		lng: -3.1883,
		airportCode: "EDI",
		visitedWith: "spouse",
		note: "Castle skyline",
	}),
	city("GB", "United Kingdom", {
		id: "liverpool",
		name: "Liverpool",
		lat: 53.4084,
		lng: -2.9916,
		airportCode: "LPL",
		visitedWith: "spouse",
		note: "Mersey docks",
	}),
	city("GB", "United Kingdom", {
		id: "birmingham",
		name: "Birmingham",
		lat: 52.4862,
		lng: -1.8904,
		airportCode: "BHX",
		visitedWith: "spouse",
		note: "Heart of England",
	}),
	city("GB", "United Kingdom", {
		id: "london",
		name: "London",
		lat: 51.5074,
		lng: -0.1278,
		airportCode: "LHR",
		visitedWith: "spouse",
		note: "Thames from final",
	}),

	// 5 — Netherlands
	city("NL", "Netherlands", {
		id: "amsterdam",
		name: "Amsterdam",
		lat: 52.3676,
		lng: 4.9041,
		airportCode: "AMS",
		visitedWith: "spouse",
		note: "Canals and approaches",
	}),

	// 6 — Germany
	city("DE", "Germany", {
		id: "frankfurt",
		name: "Frankfurt",
		lat: 50.1109,
		lng: 8.6821,
		airportCode: "FRA",
		visitedWith: "spouse",
		note: "European crossroads",
	}),
	city("DE", "Germany", {
		id: "kehl",
		name: "Kehl",
		lat: 48.5741,
		lng: 7.815,
		note: "Rhine border town",
	}),
	city("DE", "Germany", {
		id: "munich",
		name: "Munich",
		lat: 48.1351,
		lng: 11.582,
		airportCode: "MUC",
		note: "Bavarian elegance",
	}),

	// 7 — France (with spouse)
	city("FR", "France", {
		id: "colmar",
		name: "Colmar",
		lat: 48.0794,
		lng: 7.3585,
		visitedWith: "spouse",
		note: "Alsace fairytale",
	}),
	city("FR", "France", {
		id: "strasbourg",
		name: "Strasbourg",
		lat: 48.5734,
		lng: 7.7521,
		airportCode: "SXB",
		visitedWith: "spouse",
		note: "Cathedral spires",
	}),
	city("FR", "France", {
		id: "paris",
		name: "Paris",
		lat: 48.8566,
		lng: 2.3522,
		airportCode: "CDG",
		visitedWith: "spouse",
		note: "City of light",
	}),

	// 8 — Italy (with spouse)
	city("IT", "Italy", {
		id: "venice",
		name: "Venice",
		lat: 45.4408,
		lng: 12.3155,
		airportCode: "VCE",
		visitedWith: "spouse",
		note: "Lagoon approaches",
	}),
	city("IT", "Italy", {
		id: "milan",
		name: "Milan",
		lat: 45.4642,
		lng: 9.19,
		airportCode: "MXP",
		visitedWith: "spouse",
		note: "Fashion capital",
	}),
	city("IT", "Italy", {
		id: "rome",
		name: "Rome",
		lat: 41.9028,
		lng: 12.4964,
		airportCode: "FCO",
		visitedWith: "spouse",
		note: "Eternal city",
	}),
	city("IT", "Italy", {
		id: "florence",
		name: "Florence",
		lat: 43.7696,
		lng: 11.2558,
		airportCode: "FLR",
		visitedWith: "spouse",
		note: "Renaissance heart",
	}),
	city("IT", "Italy", {
		id: "cagliari",
		name: "Cagliari",
		lat: 39.2238,
		lng: 9.1217,
		airportCode: "CAG",
		visitedWith: "spouse",
		note: "Sardinia",
	}),

	// 9 — Switzerland (with spouse)
	city("CH", "Switzerland", {
		id: "zurich",
		name: "Zurich",
		lat: 47.3769,
		lng: 8.5417,
		airportCode: "ZRH",
		visitedWith: "spouse",
		note: "Alpine precision",
	}),
	city("CH", "Switzerland", {
		id: "basel",
		name: "Basel",
		lat: 47.5596,
		lng: 7.5886,
		airportCode: "BSL",
		visitedWith: "spouse",
		note: "Rhine tripoint",
	}),

	// 10 — Malaysia
	city("MY", "Malaysia", {
		id: "kuala-lumpur",
		name: "Kuala Lumpur",
		lat: 3.139,
		lng: 101.6869,
		airportCode: "KUL",
		note: "Petronas towers",
	}),

	// 11 — Australia
	city("AU", "Australia", {
		id: "brisbane",
		name: "Brisbane",
		lat: -27.4698,
		lng: 153.0251,
		airportCode: "BNE",
		visitedWith: "spouse",
		note: "Queensland sun",
	}),
	city("AU", "Australia", {
		id: "noosa",
		name: "Noosa",
		lat: -26.3943,
		lng: 153.0883,
		visitedWith: "spouse",
		note: "Sunshine Coast",
	}),
	city("AU", "Australia", {
		id: "hunter-valley",
		name: "Hunter Valley",
		lat: -32.837,
		lng: 151.299,
		visitedWith: "spouse",
		note: "Wine country",
	}),
	city("AU", "Australia", {
		id: "sydney",
		name: "Sydney",
		lat: -33.8688,
		lng: 151.2093,
		airportCode: "SYD",
		visitedWith: "spouse",
		note: "Harbour bridge",
	}),
	city("AU", "Australia", {
		id: "melbourne",
		name: "Melbourne",
		lat: -37.8136,
		lng: 144.9631,
		airportCode: "MEL",
		visitedWith: "solo",
		note: "Solo chapter",
	}),
	city("AU", "Australia", {
		id: "perth",
		name: "Perth",
		lat: -31.9505,
		lng: 115.8605,
		airportCode: "PER",
		visitedWith: "solo",
		note: "Indian Ocean edge",
	}),

	// 12 — Qatar
	city("QA", "Qatar", {
		id: "doha",
		name: "Doha",
		lat: 25.2854,
		lng: 51.531,
		role: "visited",
		airportCode: "DOH",
		visitedWith: "spouse",
		note: "Gulf home base",
	}),

	// 13 — Turkey (home origin)
	city("TR", "Turkey", {
		id: "istanbul",
		name: "Istanbul",
		lat: 41.0082,
		lng: 28.9784,
		role: "home",
		airportCode: "IST",
		visitedWith: "spouse",
		note: "Where continents meet",
	}),
	city("TR", "Turkey", {
		id: "ankara",
		name: "Ankara",
		lat: 39.9334,
		lng: 32.8597,
		airportCode: "ESB",
		visitedWith: "spouse",
		note: "Capital horizons",
	}),
	city("TR", "Turkey", {
		id: "antalya",
		name: "Antalya",
		lat: 36.8969,
		lng: 30.7133,
		airportCode: "AYT",
		visitedWith: "spouse",
		note: "Mediterranean coast",
	}),
	city("TR", "Turkey", {
		id: "izmir",
		name: "Izmir",
		lat: 38.4192,
		lng: 27.1287,
		airportCode: "ADB",
		visitedWith: "spouse",
		note: "Aegean breeze",
	}),

	// 14 — China
	city("CN", "China", {
		id: "shanghai",
		name: "Shanghai",
		lat: 31.2304,
		lng: 121.4737,
		airportCode: "PVG",
		note: "Pudong skyline",
	}),
	city("CN", "China", {
		id: "guangzhou",
		name: "Guangzhou",
		lat: 23.1291,
		lng: 113.2644,
		airportCode: "CAN",
		note: "Pearl River delta",
	}),
	city("CN", "China", {
		id: "beijing",
		name: "Beijing",
		lat: 39.9042,
		lng: 116.4074,
		airportCode: "PEK",
		note: "Imperial axis",
	}),

	// 15 — Hong Kong
	city("HK", "Hong Kong", {
		id: "hong-kong",
		name: "Hong Kong",
		lat: 22.3193,
		lng: 114.1694,
		airportCode: "HKG",
		visitedWith: "spouse",
		note: "Victoria Harbour",
	}),

	// 16 — Uganda
	city("UG", "Uganda", {
		id: "kampala",
		name: "Kampala",
		lat: 0.3476,
		lng: 32.5825,
		airportCode: "EBB",
		note: "East African hills",
	}),

	// 17 — Thailand
	city("TH", "Thailand", {
		id: "phuket",
		name: "Phuket",
		lat: 7.8804,
		lng: 98.3923,
		airportCode: "HKT",
		note: "Andaman shores",
	}),
	city("TH", "Thailand", {
		id: "bangkok",
		name: "Bangkok",
		lat: 13.7563,
		lng: 100.5018,
		airportCode: "BKK",
		note: "Chao Phraya rhythm",
	}),

	// 18 — Ecuador
	city("EC", "Ecuador", {
		id: "quito",
		name: "Quito",
		lat: -0.1807,
		lng: -78.4678,
		airportCode: "UIO",
		note: "High altitude capital",
	}),

	// 19 — Colombia
	city("CO", "Colombia", {
		id: "bogota",
		name: "Bogotá",
		lat: 4.711,
		lng: -74.0721,
		airportCode: "BOG",
		note: "Andean plateau",
	}),

	// 20 — Argentina
	city("AR", "Argentina", {
		id: "buenos-aires",
		name: "Buenos Aires",
		lat: -34.6037,
		lng: -58.3816,
		airportCode: "EZE",
		note: "Tango capital",
	}),

	// 21 — Belgium
	city("BE", "Belgium", {
		id: "brussels",
		name: "Brussels",
		lat: 50.8503,
		lng: 4.3517,
		airportCode: "BRU",
		note: "EU heart",
	}),
	city("BE", "Belgium", {
		id: "liege",
		name: "Liège",
		lat: 50.6326,
		lng: 5.5797,
		airportCode: "LGG",
		note: "Meuse valley",
	}),

	// 22 — Brazil
	city("BR", "Brazil", {
		id: "sao-paulo",
		name: "São Paulo",
		lat: -23.5505,
		lng: -46.6333,
		airportCode: "GRU",
		note: "South American megacity",
	}),
	city("BR", "Brazil", {
		id: "campinas",
		name: "Campinas",
		lat: -22.9099,
		lng: -47.0626,
		airportCode: "VCP",
		note: "São Paulo state",
	}),

	// 23 — Japan
	city("JP", "Japan", {
		id: "tokyo",
		name: "Tokyo",
		lat: 35.6762,
		lng: 139.6503,
		airportCode: "HND",
		visitedWith: "spouse",
		note: "Neon horizons",
	}),
	city("JP", "Japan", {
		id: "osaka",
		name: "Osaka",
		lat: 34.6937,
		lng: 135.5023,
		airportCode: "KIX",
		visitedWith: "spouse",
		note: "Kansai energy",
	}),
	city("JP", "Japan", {
		id: "kyoto",
		name: "Kyoto",
		lat: 35.0116,
		lng: 135.7681,
		airportCode: "ITM",
		visitedWith: "spouse",
		note: "Temple gardens",
	}),
	city("JP", "Japan", {
		id: "kobe",
		name: "Kobe",
		lat: 34.6901,
		lng: 135.1955,
		airportCode: "UKB",
		visitedWith: "spouse",
		note: "Harbour lights",
	}),
	city("JP", "Japan", {
		id: "nagoya",
		name: "Nagoya",
		lat: 35.1815,
		lng: 136.9066,
		airportCode: "NGO",
		visitedWith: "solo",
		note: "Solo chapter",
	}),

	// 24 — Sweden
	city("SE", "Sweden", {
		id: "stockholm",
		name: "Stockholm",
		lat: 59.3293,
		lng: 18.0686,
		airportCode: "ARN",
		note: "Baltic archipelago",
	}),

	// 25 — Kenya
	city("KE", "Kenya", {
		id: "nairobi",
		name: "Nairobi",
		lat: -1.2921,
		lng: 36.8219,
		airportCode: "NBO",
		note: "Savannah gateway",
	}),

	// 26 — Mexico
	city("MX", "Mexico", {
		id: "mexico-city",
		name: "Mexico City",
		lat: 19.4326,
		lng: -99.1332,
		airportCode: "MEX",
		note: "Highland capital",
	}),

	// 27 — Philippines
	city("PH", "Philippines", {
		id: "manila",
		name: "Manila",
		lat: 14.5995,
		lng: 120.9842,
		airportCode: "MNL",
		note: "Island nation hub",
	}),

	// 28 — Maldives
	city("MV", "Maldives", {
		id: "male",
		name: "Malé",
		lat: 4.1755,
		lng: 73.5093,
		airportCode: "MLE",
		note: "Atoll capital",
	}),

	// 29 — New Zealand (Dunedin excluded)
	city("NZ", "New Zealand", {
		id: "auckland",
		name: "Auckland",
		lat: -36.8485,
		lng: 174.7633,
		airportCode: "AKL",
		visitedWith: "spouse",
		note: "City of sails",
	}),
	city("NZ", "New Zealand", {
		id: "wellington",
		name: "Wellington",
		lat: -41.2865,
		lng: 174.7762,
		airportCode: "WLG",
		visitedWith: "spouse",
		note: "Windy capital",
	}),
	city("NZ", "New Zealand", {
		id: "christchurch",
		name: "Christchurch",
		lat: -43.5321,
		lng: 172.6362,
		airportCode: "CHC",
		visitedWith: "spouse",
		note: "Garden city",
	}),
	city("NZ", "New Zealand", {
		id: "queenstown",
		name: "Queenstown",
		lat: -45.0312,
		lng: 168.6626,
		airportCode: "ZQN",
		visitedWith: "spouse",
		note: "Alpine adventure",
	}),
	city("NZ", "New Zealand", {
		id: "rotorua",
		name: "Rotorua",
		lat: -38.1368,
		lng: 176.2497,
		airportCode: "ROT",
		visitedWith: "spouse",
		note: "Geothermal wonder",
	}),
	city("NZ", "New Zealand", {
		id: "taupo",
		name: "Taupo",
		lat: -38.6857,
		lng: 176.0702,
		visitedWith: "spouse",
		note: "Lake country",
	}),
	city("NZ", "New Zealand", {
		id: "hamilton",
		name: "Hamilton",
		lat: -37.787,
		lng: 175.2793,
		airportCode: "HLZ",
		visitedWith: "spouse",
		note: "Waikato region",
	}),
	city("NZ", "New Zealand", {
		id: "napier",
		name: "Napier",
		lat: -39.4928,
		lng: 176.912,
		airportCode: "NPE",
		visitedWith: "spouse",
		note: "Art deco coast",
	}),
	city("NZ", "New Zealand", {
		id: "tauranga",
		name: "Tauranga",
		lat: -37.6878,
		lng: 176.1651,
		airportCode: "TRG",
		visitedWith: "spouse",
		note: "Bay of Plenty",
	}),
	city("NZ", "New Zealand", {
		id: "palmerston-north",
		name: "Palmerston North",
		lat: -40.3523,
		lng: 175.6082,
		airportCode: "PMR",
		visitedWith: "spouse",
		note: "Manawatu plains",
	}),
	city("NZ", "New Zealand", {
		id: "wanaka",
		name: "Wanaka",
		lat: -44.7015,
		lng: 169.1322,
		airportCode: "WKA",
		visitedWith: "spouse",
		note: "Southern lakes",
	}),
	city("NZ", "New Zealand", {
		id: "nelson",
		name: "Nelson",
		lat: -41.2706,
		lng: 173.284,
		airportCode: "NSN",
		visitedWith: "spouse",
		note: "Sunshine capital",
	}),

	// 30 — Portugal
	city("PT", "Portugal", {
		id: "lisbon",
		name: "Lisbon",
		lat: 38.7223,
		lng: -9.1393,
		airportCode: "LIS",
		visitedWith: "spouse",
		note: "Seven hills",
	}),
	city("PT", "Portugal", {
		id: "cascais",
		name: "Cascais",
		lat: 38.6979,
		lng: -9.4215,
		visitedWith: "spouse",
		note: "Atlantic riviera",
	}),
	city("PT", "Portugal", {
		id: "sintra",
		name: "Sintra",
		lat: 38.8029,
		lng: -9.3817,
		visitedWith: "spouse",
		note: "Palace forests",
	}),
	city("PT", "Portugal", {
		id: "belem",
		name: "Belém",
		lat: 38.6979,
		lng: -9.2063,
		visitedWith: "spouse",
		note: "Lisbon · Monument coast",
	}),
	city("PT", "Portugal", {
		id: "porto",
		name: "Porto",
		lat: 41.1579,
		lng: -8.6291,
		airportCode: "OPO",
		visitedWith: "spouse",
		note: "Douro terraces",
	}),

	// 31 — Macau
	city("MO", "Macau", {
		id: "macau",
		name: "Macau",
		lat: 22.1987,
		lng: 113.5439,
		airportCode: "MFM",
		note: "Pearl River gateway",
	}),

	// 32 — South Korea
	city("KR", "South Korea", {
		id: "seoul",
		name: "Seoul",
		lat: 37.5665,
		lng: 126.978,
		airportCode: "ICN",
		visitedWith: "spouse",
		note: "Han River pulse",
	}),

	// 33 — Singapore
	city("SG", "Singapore", {
		id: "singapore",
		name: "Singapore",
		lat: 1.3521,
		lng: 103.8198,
		airportCode: "SIN",
		visitedWith: "spouse",
		note: "Garden city state",
	}),

	// 34 — India
	city("IN", "India", {
		id: "mumbai",
		name: "Mumbai",
		lat: 19.076,
		lng: 72.8777,
		airportCode: "BOM",
		note: "Gateway of India",
	}),

	// 35 — Hungary
	city("HU", "Hungary", {
		id: "budapest",
		name: "Budapest",
		lat: 47.4979,
		lng: 19.0402,
		airportCode: "BUD",
		visitedWith: "spouse",
		note: "Danube bridges",
	}),

	// 36 — Greece
	city("GR", "Greece", {
		id: "athens",
		name: "Athens",
		lat: 37.9838,
		lng: 23.7275,
		airportCode: "ATH",
		visitedWith: "spouse",
		note: "Acropolis views",
	}),
	city("GR", "Greece", {
		id: "santorini",
		name: "Santorini",
		lat: 36.3932,
		lng: 25.4615,
		airportCode: "JTR",
		visitedWith: "spouse",
		note: "Caldera light",
	}),
	city("GR", "Greece", {
		id: "milos",
		name: "Milos",
		lat: 36.7226,
		lng: 24.4267,
		airportCode: "MLO",
		visitedWith: "spouse",
		note: "Cycladic moonscape",
	}),

	// 37 — Czech Republic
	city("CZ", "Czech Republic", {
		id: "prague",
		name: "Prague",
		lat: 50.0755,
		lng: 14.4378,
		airportCode: "PRG",
		visitedWith: "spouse",
		note: "Golden city spires",
	}),

	// 38 — Taiwan
	city("TW", "Taiwan", {
		id: "taipei",
		name: "Taipei",
		lat: 25.033,
		lng: 121.5654,
		airportCode: "TPE",
		visitedWith: "spouse",
		note: "Taipei 101 skyline",
	}),

	// 39 — Seychelles
	city("SC", "Seychelles", {
		id: "victoria",
		name: "Victoria",
		lat: -4.6236,
		lng: 55.454,
		airportCode: "SEZ",
		note: "Mahé island",
	}),

	// 40 — Nigeria
	city("NG", "Nigeria", {
		id: "lagos",
		name: "Lagos",
		lat: 6.5244,
		lng: 3.3792,
		airportCode: "LOS",
		note: "West African megacity",
	}),

	// 41 — Saudi Arabia
	city("SA", "Saudi Arabia", {
		id: "jeddah",
		name: "Jeddah",
		lat: 21.4858,
		lng: 39.1925,
		airportCode: "JED",
		note: "Red Sea gateway",
	}),

	// 42 — Spain
	city("ES", "Spain", {
		id: "zaragoza",
		name: "Zaragoza",
		lat: 41.6488,
		lng: -0.8891,
		airportCode: "ZAZ",
		visitedWith: "solo",
		note: "Solo chapter",
	}),
	city("ES", "Spain", {
		id: "seville",
		name: "Seville",
		lat: 37.3891,
		lng: -5.9845,
		airportCode: "SVQ",
		visitedWith: "spouse",
		note: "Andalusian soul",
	}),
	city("ES", "Spain", {
		id: "cordoba",
		name: "Córdoba",
		lat: 37.8882,
		lng: -4.7794,
		airportCode: "ODB",
		visitedWith: "spouse",
		note: "Mezquita quarter",
	}),
	city("ES", "Spain", {
		id: "granada",
		name: "Granada",
		lat: 37.1773,
		lng: -3.5986,
		airportCode: "GRX",
		visitedWith: "spouse",
		note: "Alhambra silhouettes",
	}),

	// 43 — Vatican City
	city("VA", "Vatican City", {
		id: "vatican-city",
		name: "Vatican City",
		lat: 41.9029,
		lng: 12.4534,
		visitedWith: "spouse",
		note: "Sacred ground",
	}),

	// 44 — Austria
	city("AT", "Austria", {
		id: "vienna",
		name: "Vienna",
		lat: 48.2082,
		lng: 16.3738,
		airportCode: "VIE",
		visitedWith: "spouse",
		note: "Imperial avenues",
	}),
];

function buildCountries(): TravelMapCountry[] {
	return COUNTRY_DEFS.map((c, i) => ({
		iso2: c.iso2,
		name: c.name,
		visited: true,
		favorite: c.favorite,
		color: PALETTE[i % PALETTE.length],
		narrative: COUNTRY_NARRATIVES[c.iso2],
	}));
}

function applyCountrySpouseDefaults(cities: TravelMapCity[]): TravelMapCity[] {
	const favoriteCountries = new Set(
		COUNTRY_DEFS.filter((c) => c.favorite).map((c) => c.iso2),
	);
	return cities.map((c) => {
		if (c.visitedWith) return c;
		if (favoriteCountries.has(c.country)) {
			return { ...c, visitedWith: "spouse" as const };
		}
		return { ...c, role: c.role ?? "visited" };
	});
}

function buildHubRoutes(hubId: string, cities: TravelMapCity[]): TravelMapRoute[] {
	const hub = cities.find((c) => c.id === hubId);
	if (!hub) return [];
	const routes: TravelMapRoute[] = [];
	const seenCountries = new Set<string>();

	for (const dest of cities) {
		if (dest.id === hubId) continue;
		if (seenCountries.has(dest.country)) continue;
		seenCountries.add(dest.country);
		const code = dest.airportCode ?? dest.name.slice(0, 3).toUpperCase();
		routes.push({
			from: hubId,
			to: dest.id,
			type: "flight",
			label: `${hub.airportCode ?? "DOH"} → ${code}`,
		});
	}

	// Origin link Istanbul ↔ Doha
	if (hubId === "doha") {
		const ist = cities.find((c) => c.id === "istanbul");
		if (ist) {
			routes.push({
				from: "istanbul",
				to: "doha",
				type: "flight",
				label: "IST → DOH",
			});
		}
	}

	return routes;
}

export function buildWorldTravelMap(): TravelMapData {
	const countries = buildCountries();
	const cities = applyCountrySpouseDefaults(
		attachAllCityStories(
			RAW_CITIES.map((c) => ({
				...c,
				role: c.role ?? "visited",
			})),
		),
	);

	return {
		version: 1,
		title: "Explorer",
		subtitle:
			"Every waypoint is a chapter — from Doha to cities across six continents",
		homeHub: {
			code: "DOH",
			city: "Doha",
			lat: 25.2854,
			lng: 51.531,
		},
		opening: {
			boot: "Preflight · Boeing 777",
			systems: "Atlas linked · 44 nations on chart",
			reveal:
				"I fly the world from this cockpit — every pin is a place I have lived, not just landed",
			hint: "Gold arcs connect the cities · ♥ with my husband · Solo chapters marked",
		},
		stats: {
			countries: countries.length,
			cities: cities.length,
			continents: countContinentsFromIso2(cities.map((c) => c.country)),
		},
		countries,
		cities,
		routes: buildHubRoutes("doha", cities),
		globe: {
			atmosphereColor: "#C25B3F",
			pointColor: "#F5EDE4",
			arcColor: "#D4A017",
			autoRotateSpeed: 0.18,
		},
	};
}

export const WORLD_TRAVEL_MAP = buildWorldTravelMap();
