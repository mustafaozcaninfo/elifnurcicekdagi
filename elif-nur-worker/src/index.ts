import { injectAnalytics } from "./analytics";
import { handleContact } from "./api/contact";
import { handleHealth } from "./api/health";
import { renderHealthDashboard } from "./health/dashboard-page";
import { applySecurityHeaders, SECURITY_HEADERS } from "./security-headers";

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

		const assetResponse = await env.ASSETS.fetch(request);
		const withAnalytics = await injectAnalytics(
			assetResponse,
			env.CF_WEB_ANALYTICS_TOKEN,
		);
		return applySecurityHeaders(withAnalytics);
	},
} satisfies ExportedHandler<Env>;
