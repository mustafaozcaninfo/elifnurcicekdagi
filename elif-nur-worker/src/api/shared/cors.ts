const SITE_ORIGINS = new Set([
	"https://elifnurcicekdagi.com",
	"https://www.elifnurcicekdagi.com",
]);

/** Same-origin browser calls only; no wildcard CORS. */
export function applyApiCors(request: Request, response: Response): Response {
	const origin = request.headers.get("origin");
	if (!origin || !SITE_ORIGINS.has(origin)) return response;

	const headers = new Headers(response.headers);
	headers.set("access-control-allow-origin", origin);
	headers.set("access-control-allow-credentials", "true");
	headers.set("vary", "Origin");
	headers.set("access-control-allow-methods", "GET, POST, PATCH, DELETE, OPTIONS");
	headers.set(
		"access-control-allow-headers",
		"authorization, content-type, x-admin-key",
	);
	headers.set("access-control-max-age", "600");

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function handleCorsPreflight(request: Request): Response | null {
	if (request.method !== "OPTIONS") return null;
	const origin = request.headers.get("origin");
	if (!origin || !SITE_ORIGINS.has(origin)) {
		return new Response(null, { status: 403 });
	}
	return new Response(null, {
		status: 204,
		headers: {
			"access-control-allow-origin": origin,
			"access-control-allow-credentials": "true",
			"access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
			"access-control-allow-headers":
				"authorization, content-type, x-admin-key",
			"access-control-max-age": "600",
			vary: "Origin",
		},
	});
}
