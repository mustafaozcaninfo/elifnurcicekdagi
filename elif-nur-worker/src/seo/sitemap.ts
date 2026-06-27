import { absoluteUrl, PUBLIC_ROUTES } from "./site-routes";

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

type DynamicRoute = { path: string; updated_at: string };

export async function renderSitemapXml(db: D1Database, lastmod = new Date()): Promise<string> {
	const day = lastmod.toISOString().slice(0, 10);

	let dynamicRoutes: DynamicRoute[] = [];
	try {
		const { results } = await db
			.prepare(
				`SELECT path, updated_at FROM content_pages
         WHERE status = 'published' AND page_type IN ('page', 'blog', 'legal')
         AND path != '/'`,
			)
			.all<DynamicRoute>();
		dynamicRoutes = results ?? [];
	} catch {
		/* migration pending — static routes only */
	}

	const seen = new Set<string>();
	const urls: string[] = [];

	for (const route of PUBLIC_ROUTES) {
		seen.add(route.path);
		urls.push(`  <url>
    <loc>${escapeXml(absoluteUrl(route.path))}</loc>
    <lastmod>${day}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`);
	}

	for (const row of dynamicRoutes) {
		if (seen.has(row.path)) continue;
		seen.add(row.path);
		const mod = row.updated_at?.slice(0, 10) ?? day;
		urls.push(`  <url>
    <loc>${escapeXml(absoluteUrl(row.path))}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}
