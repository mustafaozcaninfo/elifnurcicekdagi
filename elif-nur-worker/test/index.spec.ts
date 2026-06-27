import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const SITE = "https://elifnurcicekdagi.com";
const ADMIN_KEY = "test-admin-key-for-ci-only-32chars";
const adminHeaders = {
	Authorization: `Bearer ${ADMIN_KEY}`,
	"content-type": "application/json",
};

describe("elif-nur-worker", () => {
	it("GET /health returns ok JSON with security headers", async () => {
		const response = await SELF.fetch(`${SITE}/health`);
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
		const body = await response.json<{ ok: boolean; site: string; apis: { live: unknown[] } }>();
		expect(body.ok).toBe(true);
		expect(body.site).toBe("elifnurcicekdagi.com");
		expect(body.apis.live.some((a: { path: string }) => a.path === "/health")).toBe(true);
	});

	it("GET /health/dashboard returns HTML ops panel", async () => {
		const response = await SELF.fetch(`${SITE}/health/dashboard`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("Operasyon Paneli");
		expect(html).toContain("/health");
	});

	it("GET / serves the production landing page shell", async () => {
		const response = await SELF.fetch(`${SITE}/`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("Elif Nur Çiçekdağı");
		expect(html).toContain("elifnurcicekdagi.com");
		expect(html).toContain('id="root"');
		expect(html).toContain("/assets/");
	});

	it("POST /api/contact rejects invalid JSON", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "not-json",
		});
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string }>();
		expect(body.error).toBe("Invalid JSON");
	});

	it("POST /api/contact rejects missing KVKK consent", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				name: "Test",
				email: "test@example.com",
				message: "Merhaba",
				consent: false,
			}),
		});
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string }>();
		expect(body.error).toContain("privacy policy");
	});

	it("POST /api/contact rejects missing fields", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "", email: "", message: "" }),
		});
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string }>();
		expect(body.error).toBe("All fields are required.");
	});

	it("POST /api/contact rejects invalid email", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				name: "Test",
				email: "not-an-email",
				message: "Merhaba",
				consent: true,
			}),
		});
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string }>();
		expect(body.error).toBe("Invalid email address.");
	});

	it("POST /api/contact returns 405 for non-POST", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`);
		expect(response.status).toBe(405);
	});

	it("GET /robots.txt is dynamic and blocks private paths", async () => {
		const response = await SELF.fetch(`${SITE}/robots.txt`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/plain");
		const text = await response.text();
		expect(text).toContain("Sitemap: https://elifnurcicekdagi.com/sitemap.xml");
		expect(text).toContain("Disallow: /api/");
		expect(text).toContain("Disallow: /health");
		expect(text).toContain("Disallow: /admin");
	});

	it("GET /sitemap.xml lists public routes dynamically", async () => {
		const response = await SELF.fetch(`${SITE}/sitemap.xml`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("xml");
		const xml = await response.text();
		expect(xml).toContain("<loc>https://elifnurcicekdagi.com/</loc>");
		expect(xml).toContain("<loc>https://elifnurcicekdagi.com/contact</loc>");
		expect(xml).toContain("<loc>https://elifnurcicekdagi.com/about</loc>");
		expect(xml).toContain("<loc>https://elifnurcicekdagi.com/privacy</loc>");
		expect(xml).toContain("<lastmod>");
	});

	it("GET /llms.txt describes the site for LLMs", async () => {
		const response = await SELF.fetch(`${SITE}/llms.txt`);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("# Elif Nur Çiçekdağı");
		expect(text).toContain("/contact");
		expect(text).toContain("/api/v1");
	});

	it("GET /about serves the about page HTML", async () => {
		const response = await SELF.fetch(`${SITE}/about`, {
			headers: { accept: "text/html" },
		});
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain("About");
		expect(html).toContain("/assets/");
	});

	it("GET /media/elif-pilot-cockpit.jpg serves portrait asset", async () => {
		const response = await SELF.fetch(`${SITE}/media/elif-pilot-cockpit.jpg`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("image/jpeg");
	});

	it("GET /hakkimda redirects to /about", async () => {
		const response = await SELF.fetch(`${SITE}/hakkimda`, { redirect: "manual" });
		expect(response.status).toBe(301);
		expect(response.headers.get("location")).toContain("/about");
	});

	it("GET /favicon.svg has valid UTF-8 Turkish name", async () => {
		const response = await SELF.fetch(`${SITE}/favicon.svg`);
		expect(response.status).toBe(200);
		const svg = await response.text();
		expect(svg).toContain("Çiçekdağı");
		expect(svg).not.toMatch(/Çiçekda\x1f/);
	});

	it("GET /og-image.png returns social preview asset", async () => {
		const response = await SELF.fetch(`${SITE}/og-image.png`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("image/png");
	});

	it("GET unknown path returns custom 404 HTML", async () => {
		const response = await SELF.fetch(`${SITE}/bu-sayfa-yok`, {
			headers: { accept: "text/html" },
		});
		expect(response.status).toBe(404);
		const html = await response.text();
		expect(html).toContain("Sayfa bulunamadı");
		expect(html).toContain('href="/"');
	});

	it("GET /api/v1 returns discovery envelope", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1`);
		expect(response.status).toBe(200);
		const body = await response.json<{
			ok: boolean;
			data: { version: string; endpoints: { public: string[] } };
			meta: { requestId: string };
		}>();
		expect(body.ok).toBe(true);
		expect(body.data.version).toBe("1");
		expect(body.data.endpoints.public).toContain("GET /api/v1/pages");
		expect(body.meta.requestId).toBeTruthy();
	});

	it("GET /api/v1/pages returns published list envelope", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1/pages`);
		expect(response.status).toBe(200);
		const body = await response.json<{ ok: boolean; data: { items: unknown[] } }>();
		expect(body.ok).toBe(true);
		expect(Array.isArray(body.data.items)).toBe(true);
	});

	it("GET /api/v1/admin/auth/me rejects without session", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1/admin/auth/me`);
		expect(response.status).toBe(401);
	});

	it("POST /api/v1/admin/pages rejects unauthenticated write", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1/admin/pages`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ slug: "test", title: "Test" }),
		});
		expect([401, 503]).toContain(response.status);
		const body = await response.json<{ ok: false; error: { code: string } }>();
		expect(body.ok).toBe(false);
		expect(["UNAUTHORIZED", "INTERNAL_ERROR"]).toContain(body.error.code);
	});

	it("GET /api/v1/unknown returns NOT_FOUND envelope", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1/unknown`);
		expect(response.status).toBe(404);
		const body = await response.json<{ ok: false; error: { code: string } }>();
		expect(body.error.code).toBe("NOT_FOUND");
	});

	it("GET /api/v1/site returns public site bundle", async () => {
		const response = await SELF.fetch(`${SITE}/api/v1/site`);
		expect(response.status).toBe(200);
		const body = await response.json<{
			ok: boolean;
			data: { pages: unknown[]; projects: unknown[]; navigation: unknown[]; settings: object };
		}>();
		expect(body.ok).toBe(true);
		expect(Array.isArray(body.data.pages)).toBe(true);
		expect(Array.isArray(body.data.navigation)).toBe(true);
	});

	it("admin CRUD: page lifecycle", async () => {
		const slug = `test-page-${Date.now()}`;
		const create = await SELF.fetch(`${SITE}/api/v1/admin/pages`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				slug,
				path: `/${slug}`,
				title: "Test Page",
				pageType: "page",
				status: "published",
				bodyMd: "# Test\n\nHello CMS.",
			}),
		});
		expect(create.status).toBe(201);

		const pub = await SELF.fetch(`${SITE}/api/v1/pages/${slug}`);
		expect(pub.status).toBe(200);

		const resolve = await SELF.fetch(`${SITE}/api/v1/resolve?path=/${slug}`);
		expect(resolve.status).toBe(200);

		const html = await SELF.fetch(`${SITE}/${slug}`, {
			headers: { accept: "text/html" },
		});
		expect(html.status).toBe(200);
		expect(await html.text()).toContain("Test Page");

		const del = await SELF.fetch(`${SITE}/api/v1/admin/pages/${slug}`, {
			method: "DELETE",
			headers: adminHeaders,
		});
		expect(del.status).toBe(200);
	});

	it("admin settings upsert and read", async () => {
		await SELF.fetch(`${SITE}/api/v1/admin/settings/site.test`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({ value: { hello: "cms" } }),
		});
		const site = await SELF.fetch(`${SITE}/api/v1/site`);
		const body = await site.json<{ data: { settings: Record<string, unknown> } }>();
		expect(body.data.settings["site.test"]).toEqual({ hello: "cms" });
	});

	it("admin travel-map CRUD and lookup", async () => {
		const get = await SELF.fetch(`${SITE}/api/v1/admin/travel-map`, {
			headers: adminHeaders,
		});
		expect(get.status).toBe(200);
		const initial = await get.json<{ ok: boolean; data: { map: { cities: unknown[] } } }>();
		expect(initial.ok).toBe(true);
		expect(Array.isArray(initial.data.map.cities)).toBe(true);

		const create = await SELF.fetch(`${SITE}/api/v1/admin/travel-map/cities`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				id: "test-city-ci",
				name: "Test City",
				country: "TR",
				countryName: "Turkey",
				lat: 41.0,
				lng: 29.0,
				role: "visited",
				airportCode: "TST",
			}),
		});
		expect(create.status).toBe(200);

		const lookup = await SELF.fetch(`${SITE}/api/v1/admin/travel-map/lookup?q=IST&type=airport`, {
			headers: adminHeaders,
		});
		expect(lookup.status).toBe(200);
		const lookupBody = await lookup.json<{ ok: boolean; data: { results: { airportCode?: string }[] } }>();
		expect(lookupBody.ok).toBe(true);
		expect(lookupBody.data.results.some((r) => r.airportCode === "IST")).toBe(true);

		const countryLookup = await SELF.fetch(
			`${SITE}/api/v1/admin/travel-map/lookup?q=Germany&type=country`,
			{ headers: adminHeaders },
		);
		expect(countryLookup.status).toBe(200);
		const countryBody = await countryLookup.json<{
			ok: boolean;
			data: { results: { iso2: string; name: string }[] };
		}>();
		expect(countryBody.ok).toBe(true);
		expect(countryBody.data.results.some((r) => r.iso2 === "DE")).toBe(true);

		const isoLookup = await SELF.fetch(
			`${SITE}/api/v1/admin/travel-map/lookup?q=TR&type=country`,
			{ headers: adminHeaders },
		);
		const isoBody = await isoLookup.json<{
			ok: boolean;
			data: { results: { iso2: string }[] };
		}>();
		expect(isoBody.data.results[0]?.iso2).toBe("TR");

		const del = await SELF.fetch(`${SITE}/api/v1/admin/travel-map/cities/test-city-ci`, {
			method: "DELETE",
			headers: adminHeaders,
		});
		expect(del.status).toBe(200);
	});

	it("computeStats counts continents from city countries (UN M49)", async () => {
		const { countContinentsFromIso2, listContinentsFromIso2 } = await import(
			"../src/api/v1/content/continents"
		);
		const { computeStats } = await import("../src/api/v1/content/travel-map-store");

		const sample = ["US", "DE", "JP", "AU", "BR", "EG", "TR", "QA"];
		expect(countContinentsFromIso2(sample)).toBe(6);
		expect(listContinentsFromIso2(sample).sort()).toEqual(
			["AF", "AS", "EU", "NA", "OC", "SA"].sort(),
		);

		const stats = computeStats({
			version: 1,
			title: "t",
			subtitle: "s",
			countries: [
				{ iso2: "US", name: "United States", visited: true },
				{ iso2: "FR", name: "France", visited: true },
			],
			cities: [
				{ id: "nyc", name: "New York", country: "US", lat: 40.7, lng: -74.0 },
				{ id: "paris", name: "Paris", country: "FR", lat: 48.8, lng: 2.3 },
			],
		});
		expect(stats?.continents).toBe(2);
	});
});
