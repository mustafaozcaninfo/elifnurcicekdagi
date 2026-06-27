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
		expect(body.error).toBe("Geçersiz JSON");
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
		expect(body.error).toContain("gizlilik politikasını");
	});

	it("POST /api/contact rejects missing fields", async () => {
		const response = await SELF.fetch(`${SITE}/api/contact`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "", email: "", message: "" }),
		});
		expect(response.status).toBe(400);
		const body = await response.json<{ error: string }>();
		expect(body.error).toBe("Tüm alanlar zorunludur.");
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
		expect(body.error).toBe("Geçersiz e-posta adresi.");
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
		expect(xml).toContain("<loc>https://elifnurcicekdagi.com/iletisim</loc>");
		expect(xml).toContain("<lastmod>");
	});

	it("GET /llms.txt describes the site for LLMs", async () => {
		const response = await SELF.fetch(`${SITE}/llms.txt`);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("# Elif Nur Çiçekdağı");
		expect(text).toContain("/iletisim");
		expect(text).toContain("/api/v1");
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
});
