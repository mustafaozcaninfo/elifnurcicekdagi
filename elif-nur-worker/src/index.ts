import { injectAnalytics } from "./analytics";
import { handleContact } from "./api/contact";
import { handleHealth } from "./api/health";
import { handleApiV1 } from "./api/v1/router";
import { fetchPublishedPageByPath, renderDynamicPageHtml } from "./content/render-page";
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

		if (url.pathname === "/api/v1" || url.pathname.startsWith("/api/v1/")) {
			return applySecurityHeaders(await handleApiV1(request, env));
		}

		const seo = await handleSeoRequest(url.pathname, env);
		if (seo) {
			return applySecurityHeaders(seo);
		}

		if (url.pathname === "/contact" || url.pathname === "/contact/") {
			const contactPage = await env.ASSETS.fetch(
				new Request(new URL("/contact/index.html", url.origin), request),
			);
			if (contactPage.ok) {
				return applySecurityHeaders(
					new Response(contactPage.body, {
						status: 200,
						headers: {
							"content-type": "text/html; charset=utf-8",
							"cache-control": "public, max-age=60, s-maxage=300",
						},
					}),
				);
			}
		}

		if (url.pathname === "/iletisim" || url.pathname === "/iletisim/") {
			return Response.redirect(new URL("/contact", url.origin).toString(), 301);
		}

		if (url.pathname === "/gizlilik" || url.pathname === "/gizlilik/") {
			return Response.redirect(new URL("/privacy", url.origin).toString(), 301);
		}

		if (url.pathname === "/privacy" || url.pathname === "/privacy/") {
			const privacyPage = await env.ASSETS.fetch(
				new Request(new URL("/privacy/index.html", url.origin), request),
			);
			if (privacyPage.ok) {
				return applySecurityHeaders(
					new Response(privacyPage.body, {
						status: 200,
						headers: {
							"content-type": "text/html; charset=utf-8",
							"cache-control": "public, max-age=60, s-maxage=300",
						},
					}),
				);
			}
		}

		if (url.pathname === "/about" || url.pathname === "/about/") {
			const aboutPage = await env.ASSETS.fetch(
				new Request(new URL("/about/index.html", url.origin), request),
			);
			if (aboutPage.ok) {
				return applySecurityHeaders(
					new Response(aboutPage.body, {
						status: 200,
						headers: {
							"content-type": "text/html; charset=utf-8",
							"cache-control": "public, max-age=60, s-maxage=300",
						},
					}),
				);
			}
		}

		if (url.pathname === "/hakkimda" || url.pathname === "/hakkimda/") {
			return Response.redirect(new URL("/about", url.origin).toString(), 301);
		}

		if (url.pathname === "/admin" || url.pathname === "/admin/") {
			const adminPage = await env.ASSETS.fetch(
				new Request(new URL("/admin/index.html", url.origin), request),
			);
			if (adminPage.ok) {
				return applySecurityHeaders(
					new Response(adminPage.body, {
						status: 200,
						headers: {
							"content-type": "text/html; charset=utf-8",
							"cache-control": "no-store",
						},
					}),
				);
			}
		}

		const assetResponse = await env.ASSETS.fetch(request);

		if (
			assetResponse.status === 404 &&
			shouldServeNotFoundPage(request, url.pathname)
		) {
			const pagePath = url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "") || "/";
			if (pagePath !== "/") {
				try {
					const dynamicPage = await fetchPublishedPageByPath(env.DB, pagePath);
					if (dynamicPage && dynamicPage.page_type !== "landing") {
						const html = renderDynamicPageHtml(dynamicPage);
						const withAnalytics = await injectAnalytics(
							new Response(html, {
								status: 200,
								headers: {
									"content-type": "text/html; charset=utf-8",
									"cache-control": "public, max-age=60, s-maxage=300",
								},
							}),
							env.CF_WEB_ANALYTICS_TOKEN,
						);
						return applySecurityHeaders(withAnalytics);
					}
				} catch {
					/* D1 unavailable */
				}
			}
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
