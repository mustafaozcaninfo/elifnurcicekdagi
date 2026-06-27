import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSite } from "../api/client";
import type { NavItem, SiteBundle, SiteProject } from "../api/types";
import {
	ABOUT_TEXT,
	EXPERIENCES,
	HERO_PORTRAIT,
	JOURNEYS,
	type JourneyCard,
} from "../data/images";
import { DEFAULT_TRAVEL_MAP, normalizeTravelMap, type TravelMapData } from "../data/travel-map";

export type HeroContent = {
	heading: string;
	tagline: string;
	intro: string;
	portraitUrl: string;
};

export type AboutContent = {
	heading: string;
	body: string;
};

export type Branding = {
	siteName: string;
	tagline: string;
};

export type SiteContextValue = {
	loading: boolean;
	live: boolean;
	hero: HeroContent;
	about: AboutContent;
	branding: Branding;
	experiences: typeof EXPERIENCES;
	journeys: JourneyCard[];
	travelMap: TravelMapData;
	navigation: NavItem[];
	pages: SiteBundle["pages"];
	projects: SiteProject[];
};

const DEFAULTS: Omit<SiteContextValue, "loading" | "live" | "navigation" | "pages" | "projects"> = {
	hero: {
		heading: "Hi, I'm Elif",
		tagline: "From cockpit views to city walks or the other way around.",
		intro:
			"Airline Pilot · Travel storyteller · Between sky and the world's most beautiful places.",
		portraitUrl: HERO_PORTRAIT,
	},
	about: { heading: "About Me", body: ABOUT_TEXT },
	branding: { siteName: "Elif Nur", tagline: "elifnurcicekdagi.com" },
	experiences: EXPERIENCES,
	journeys: JOURNEYS,
	travelMap: DEFAULT_TRAVEL_MAP,
};

const JOURNEY_IMAGES: Record<string, JourneyCard["images"]> = {
	"sardegna-escape": JOURNEYS[0].images,
	"hellas-aegean": JOURNEYS[1].images,
	"vienna-beyond": JOURNEYS[2].images,
};

function projectToJourney(p: SiteProject, i: number): JourneyCard {
	const meta = p.meta ?? {};
	const fallback = JOURNEYS[i] ?? JOURNEYS[0];
	const images = (meta.images as JourneyCard["images"] | undefined) ??
		JOURNEY_IMAGES[p.slug] ?? fallback.images;
	return {
		number: String(i + 1).padStart(2, "0"),
		category: String(meta.category ?? fallback.category),
		title: p.title,
		location: String(meta.location ?? fallback.location),
		images,
	};
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
	const [bundle, setBundle] = useState<SiteBundle | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSite().then((data) => {
			setBundle(data);
			setLoading(false);
		});
	}, []);

	const value = useMemo<SiteContextValue>(() => {
		const s = bundle?.settings ?? {};
		const heroS = s["landing.hero"] as Record<string, string> | undefined;
		const aboutS = s["landing.about"] as Record<string, string> | undefined;
		const brandS = s["site.branding"] as Record<string, string> | undefined;
		const expS = s["landing.experiences"] as { items?: typeof EXPERIENCES } | undefined;

		const projects = bundle?.projects ?? [];
		const journeys =
			projects.length > 0 ? projects.map(projectToJourney) : DEFAULTS.journeys;

		const travelRaw =
			bundle?.travelMap ??
			s["landing.travelmap"] ??
			s["landing.travelMap"];
		const fromApi =
			normalizeTravelMap(travelRaw) ??
			normalizeTravelMap(s["landing.travelmap"]) ??
			normalizeTravelMap(s["landing.travelMap"]);
		const travelMap =
			fromApi && fromApi.cities.length > 0 ? fromApi : DEFAULT_TRAVEL_MAP;

		return {
			loading,
			live: Boolean(bundle),
			hero: {
				heading: heroS?.heading ?? DEFAULTS.hero.heading,
				tagline: heroS?.tagline ?? DEFAULTS.hero.tagline,
				intro: heroS?.intro ?? DEFAULTS.hero.intro,
				portraitUrl: heroS?.portraitUrl ?? DEFAULTS.hero.portraitUrl,
			},
			about: {
				heading: aboutS?.heading ?? DEFAULTS.about.heading,
				body: aboutS?.body ?? DEFAULTS.about.body,
			},
			branding: {
				siteName: brandS?.siteName ?? DEFAULTS.branding.siteName,
				tagline: brandS?.tagline ?? DEFAULTS.branding.tagline,
			},
			experiences: expS?.items?.length ? expS.items : DEFAULTS.experiences,
			journeys,
			travelMap,
			navigation: bundle?.navigation ?? [],
			pages: bundle?.pages ?? [],
			projects,
		};
	}, [bundle, loading]);

	return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
	const ctx = useContext(SiteContext);
	if (!ctx) throw new Error("useSite outside SiteProvider");
	return ctx;
}
