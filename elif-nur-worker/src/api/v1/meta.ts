import { jsonOk } from "../shared/response";
import type { ApiContext } from "./context";

export function handleMeta(ctx: ApiContext): Response {
	return jsonOk(
		{
			name: "elifnurcicekdagi.com API",
			version: "1",
			documentation: "https://elifnurcicekdagi.com/llms.txt",
			security: {
				public: "GET only; published content",
				admin:
					"Browser: POST /admin/auth/login → HttpOnly cookie (8h). Scripts: Bearer ADMIN_API_KEY",
				cors: "same-site origins only",
				rateLimit: "per-IP buckets on KV",
				audit: "admin mutations logged with IP hash",
			},
			endpoints: {
				public: [
					"GET /api/v1",
					"GET /api/v1/site",
					"GET /api/v1/travel/map",
					"GET /api/v1/resolve?path=/...",
					"GET /api/v1/pages",
					"GET /api/v1/pages/:slug",
					"GET /api/v1/pages/by-path/...",
					"GET /api/v1/pages?type=blog",
					"GET /api/v1/projects",
					"GET /api/v1/projects/:slug",
				],
				admin: [
					"POST /api/v1/admin/auth/login",
					"POST /api/v1/admin/auth/logout",
					"GET /api/v1/admin/auth/me",
					"GET|POST /api/v1/admin/pages",
					"GET|PATCH|DELETE /api/v1/admin/pages/:slug",
					"GET|POST /api/v1/admin/projects",
					"GET|PATCH|DELETE /api/v1/admin/projects/:slug",
					"GET|PUT|PATCH|DELETE /api/v1/admin/settings/:key",
					"GET|PUT /api/v1/admin/travel-map",
					"GET|POST|PATCH|DELETE /api/v1/admin/travel-map/cities/:id",
					"GET|POST|PATCH|DELETE /api/v1/admin/travel-map/countries/:iso2",
					"GET|POST|DELETE /api/v1/admin/travel-map/routes",
					"GET|POST /api/v1/admin/travel-map/flights",
					"DELETE /api/v1/admin/travel-map/flights/:id",
					"POST /api/v1/admin/travel-map/flights/import",
					"GET /api/v1/admin/travel-map/lookup?q=&type=auto|city|airport",
					"GET /api/v1/admin/audit",
				],
				legacy: ["POST /api/contact"],
			},
			contentModel: {
				pages: "slug, path, pageType (page|blog|landing|legal), meta JSON, SEO, nav",
				projects: "journeys/portfolio with meta JSON",
				settings: "site.* / landing.* key-value JSON blobs",
			},
		},
		ctx.meta,
		{
			headers: {
				"cache-control": "public, max-age=300, s-maxage=600",
			},
		},
	);
}
