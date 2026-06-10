import { renderLlmsTxt } from "./llms";
import { renderRobotsTxt } from "./robots";
import { renderSitemapXml } from "./sitemap";

const TEXT_CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export function handleSeoRequest(pathname: string): Response | null {
	switch (pathname) {
		case "/robots.txt":
			return new Response(renderRobotsTxt(), {
				headers: {
					"content-type": "text/plain; charset=utf-8",
					"cache-control": TEXT_CACHE,
				},
			});
		case "/sitemap.xml":
			return new Response(renderSitemapXml(), {
				headers: {
					"content-type": "application/xml; charset=utf-8",
					"cache-control": TEXT_CACHE,
				},
			});
		case "/llms.txt":
			return new Response(renderLlmsTxt(), {
				headers: {
					"content-type": "text/plain; charset=utf-8",
					"cache-control": TEXT_CACHE,
				},
			});
		default:
			return null;
	}
}

export function shouldServeNotFoundPage(request: Request, pathname: string): boolean {
	if (request.method !== "GET" && request.method !== "HEAD") return false;
	if (pathname.startsWith("/api/") || pathname.startsWith("/health")) return false;
	const accept = request.headers.get("accept") ?? "";
	if (accept.includes("text/html")) return true;
	return !pathname.includes(".") || pathname.endsWith(".html");
}
