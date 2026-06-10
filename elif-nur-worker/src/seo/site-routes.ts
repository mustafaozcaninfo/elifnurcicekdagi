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
		description: "Elif Nur Çiçekdağı resmi web sitesi",
	},
	{
		path: "/iletisim",
		changefreq: "monthly",
		priority: 0.8,
		title: "İletişim",
		description: "İletişim formu ve KVKK onaylı mesaj gönderimi",
	},
	{
		path: "/gizlilik",
		changefreq: "yearly",
		priority: 0.5,
		title: "Gizlilik politikası",
		description: "Kişisel verilerin işlenmesi ve KVKK aydınlatması",
	},
];

export function absoluteUrl(path: string): string {
	return `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
}
