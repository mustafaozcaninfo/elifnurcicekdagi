import { injectAnalytics } from "./analytics";
import { handleContact } from "./api/contact";

const SECURITY_HEADERS: Record<string, string> = {
	"strict-transport-security": "max-age=31536000; includeSubDomains; preload",
	"x-content-type-options": "nosniff",
	"x-frame-options": "SAMEORIGIN",
	"referrer-policy": "strict-origin-when-cross-origin",
	"permissions-policy": "camera=(), microphone=(), geolocation=()",
};

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
			const response = await handleContact(request, env);
			for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
				response.headers.set(key, value);
			}
			response.headers.set("cache-control", "no-store");
			return response;
		}

		const assetResponse = await env.ASSETS.fetch(request);
		return injectAnalytics(assetResponse, env.CF_WEB_ANALYTICS_TOKEN);
	},
} satisfies ExportedHandler<Env>;
