/** Curated travel/aviation imagery — replace with personal assets when available. */
const u = (id: string, w = 840, h = 540) =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Elif in the B777 flight deck — served from /media on deploy. */
export const PILOT_COCKPIT_PORTRAIT = "/media/elif-pilot-cockpit.jpg";

export const HERO_PORTRAIT = PILOT_COCKPIT_PORTRAIT;

/** 21 marquee frames — cockpit, coast, cities, islands, tropics */
export const MARQUEE_ROW_1 = [
	u("photo-1436491865332-7a61a109cc05", 420, 270),
	u("photo-1507525428034-b723cf961d3e", 420, 270),
	u("photo-1516026672322-bc52d61a55d5", 420, 270),
	u("photo-1523906834658-6e24ef2386f9", 420, 270),
	u("photo-1533105079786-9f4f9c59cf48", 420, 270),
	u("photo-1544551763-46ef016b47e8", 420, 270),
	u("photo-1551632811-4e377af86321", 420, 270),
	u("photo-1469854523086-cc02fe5d8800", 420, 270),
	u("photo-1476514525535-07fb3b4ae5f1", 420, 270),
	u("photo-1488646953014-85cb44e25828", 420, 270),
	u("photo-1506905925346-21bda4d32df4", 420, 270),
];

export const MARQUEE_ROW_2 = [
	u("photo-1512453979798-5ea266f8880c", 420, 270),
	u("photo-1518548419970-58e3b4079ab2", 420, 270),
	u("photo-1520250497591-112f2f40a3f4", 420, 270),
	u("photo-1526483360382-724336edba3d", 420, 270),
	u("photo-1539037116277-4ff2082aa0d7", 420, 270),
	u("photo-1548013146-72479768bada", 420, 270),
	u("photo-1555881403-673ad3802a1f", 420, 270),
	u("photo-1566073771259-6a8506099945", 420, 270),
	u("photo-1570077188670-e3a8d69ac5ff", 420, 270),
	u("photo-1582719508461-905c673771fd", 420, 270),
];

export type JourneyCard = {
	number: string;
	category: string;
	title: string;
	location: string;
	images: {
		topLeft: string;
		bottomLeft: string;
		tallRight: string;
	};
};

export const JOURNEYS: JourneyCard[] = [
	{
		number: "01",
		category: "Mediterranean",
		title: "Sardegna Escape",
		location: "Italy",
		images: {
			topLeft: u("photo-1533105079786-9f4f9c59cf48", 600, 400),
			bottomLeft: u("photo-1516026672322-bc52d61a55d5", 600, 400),
			tallRight: u("photo-1507525428034-b723cf961d3e", 600, 820),
		},
	},
	{
		number: "02",
		category: "Aegean",
		title: "Hellas & Aegean",
		location: "Greece",
		images: {
			topLeft: u("photo-1613395877344-13d4a8e0d49e", 600, 400),
			bottomLeft: u("photo-1570077188670-e3a8d69ac5ff", 600, 400),
			tallRight: u("photo-1523906834658-6e24ef2386f9", 600, 820),
		},
	},
	{
		number: "03",
		category: "Central Europe",
		title: "Vienna & Beyond",
		location: "Austria",
		images: {
			topLeft: u("photo-1516559828903-d9d683b0a761", 600, 400),
			bottomLeft: u("photo-1555881403-673ad3802a1f", 600, 400),
			tallRight: u("photo-1548013146-72479768bada", 600, 820),
		},
	},
];

export const EXPERIENCES = [
	{
		num: "01",
		title: "Airline Pilot",
		desc: "Five years in the flight deck — precision, discipline, and the poetry of altitude.",
	},
	{
		num: "02",
		title: "Travel Content Creation & Photography",
		desc: "Cinematic frames from 35,000 feet and intimate street-level moments.",
	},
	{
		num: "03",
		title: "Destination Guides & City Walks",
		desc: "Curated routes through Europe’s palaces, coastlines, and hidden alleys.",
	},
	{
		num: "04",
		title: "Lifestyle & Luxury Travel Consulting",
		desc: "Thoughtful itineraries where comfort meets authentic discovery.",
	},
	{
		num: "05",
		title: "Aviation & Adventure Storytelling",
		desc: "Narratives that bridge cockpit discipline with wanderlust freedom.",
	},
] as const;

export const ABOUT_TEXT =
	"With more than five years as an Airline Pilot and a lifelong passion for exploration, I capture the world from 35,000 feet and on the ground. I believe in the beauty of contrast — discipline in the cockpit and freedom in discovery. Let’s create meaningful memories together.";
