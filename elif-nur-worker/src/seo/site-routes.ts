export const SITE_ORIGIN = "https://elifnurcicekdagi.com";

export type SiteRoute = {
	path: string;
	changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	priority: number;
	/** Shown in llms.txt */
	title: string;
	description?: string;
};

/** Public HTML pages — extend here or from D1/API later */
export const PUBLIC_ROUTES: SiteRoute[] = [
	{
		path: "/",
		changefreq: "weekly",
		priority: 1.0,
		title: "Ana sayfa",
		description: "Elif Nur Çiçekdağı Özcan — pilot, gezgin ve içerik üreticisi",
	},
	{
		path: "/about",
		changefreq: "monthly",
		priority: 0.85,
		title: "About",
		description: "Airline pilot · Istanbul origin · Boeing 777 flight deck story",
	},
	{
		path: "/contact",
		changefreq: "monthly",
		priority: 0.8,
		title: "Contact",
		description: "Secure contact form with privacy consent",
	},
	{
		path: "/privacy",
		changefreq: "yearly",
		priority: 0.5,
		title: "Privacy Policy",
		description: "How personal data is collected, used, and protected on elifnurcicekdagi.com",
	},
];

export function absoluteUrl(path: string): string {
	return `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
}
