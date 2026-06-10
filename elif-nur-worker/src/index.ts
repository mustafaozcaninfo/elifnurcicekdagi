import { injectAnalytics } from "./analytics";
import { handleContact } from "./api/contact";
import { applySecurityHeaders, SECURITY_HEADERS } from "./security-headers";

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/health") {
			return Response.json(
				{ ok: true, site: "elifnurcicekdagi.com" },
				{
					headers: {
						...SECURITY_HEADERS,
						"cache-control": "no-store",
					},
				},
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
