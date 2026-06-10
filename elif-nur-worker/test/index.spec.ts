import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const SITE = "https://elifnurcicekdagi.com";

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

	it("GET / serves the landing page HTML", async () => {
		const response = await SELF.fetch(`${SITE}/`);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("Elif Nur Çiçekdağı");
		expect(html).toContain("elifnurcicekdagi.com");
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

	it("GET /robots.txt includes sitemap", async () => {
		const response = await SELF.fetch(`${SITE}/robots.txt`);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("Sitemap: https://elifnurcicekdagi.com/sitemap.xml");
	});
});
