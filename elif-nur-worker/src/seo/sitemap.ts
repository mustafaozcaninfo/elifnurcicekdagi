import { absoluteUrl, PUBLIC_ROUTES } from "./site-routes";

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function renderSitemapXml(lastmod = new Date()): string {
	const day = lastmod.toISOString().slice(0, 10);
	const urls = PUBLIC_ROUTES.map(
		(route) => `  <url>
    <loc>${escapeXml(absoluteUrl(route.path))}</loc>
    <lastmod>${day}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
	).join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
