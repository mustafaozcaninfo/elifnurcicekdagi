import { injectAnalytics } from "./analytics";
import { handleContact } from "./api/contact";
import { handleHealth } from "./api/health";
import { renderHealthDashboard } from "./health/dashboard-page";
import { applySecurityHeaders } from "./security-headers";
import { handleSeoRequest, shouldServeNotFoundPage } from "./seo/handlers";

const NO_STORE = { "cache-control": "no-store" } as const;

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/health") {
			const response = applySecurityHeaders(await handleHealth(request, env));
			response.headers.set("cache-control", "no-store");
			return response;
		}

		if (url.pathname === "/health/dashboard") {
			return applySecurityHeaders(
				new Response(renderHealthDashboard(), {
					headers: {
						"content-type": "text/html; charset=utf-8",
						...NO_STORE,
					},
				}),
			);
		}

		if (url.pathname === "/api/contact") {
			const response = applySecurityHeaders(await handleContact(request, env));
			response.headers.set("cache-control", "no-store");
			return response;
		}

		const seo = handleSeoRequest(url.pathname);
		if (seo) {
			return applySecurityHeaders(seo);
		}

		const assetResponse = await env.ASSETS.fetch(request);

		if (
			assetResponse.status === 404 &&
			shouldServeNotFoundPage(request, url.pathname)
		) {
			const notFoundPage = await env.ASSETS.fetch(
				new Request(new URL("/404.html", url.origin), {
					method: "GET",
					headers: { accept: "text/html" },
				}),
			);
			const html = notFoundPage.ok ? await notFoundPage.text() : null;
			if (html) {
				const withAnalytics = await injectAnalytics(
					new Response(html, {
						status: 404,
						headers: { "content-type": "text/html; charset=utf-8" },
					}),
					env.CF_WEB_ANALYTICS_TOKEN,
				);
				return applySecurityHeaders(withAnalytics);
			}
		}

		const withAnalytics = await injectAnalytics(
			assetResponse,
			env.CF_WEB_ANALYTICS_TOKEN,
		);
		return applySecurityHeaders(withAnalytics);
	},
} satisfies ExportedHandler<Env>;
