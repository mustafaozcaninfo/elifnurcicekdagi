const SECURITY_HEADERS: Record<string, string> = {
	"strict-transport-security": "max-age=31536000; includeSubDomains; preload",
	"x-content-type-options": "nosniff",
	"x-frame-options": "SAMEORIGIN",
	"referrer-policy": "strict-origin-when-cross-origin",
	"permissions-policy": "camera=(), microphone=(), geolocation=()",
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
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

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
