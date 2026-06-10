import { SITE_ORIGIN } from "./site-routes";

export function renderRobotsTxt(): string {
	return [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/",
		"Disallow: /health",
		"",
		`Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
		"",
	].join("\n");
}
