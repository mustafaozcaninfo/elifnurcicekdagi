#!/usr/bin/env node
/**
 * Seed CMS content via Admin API.
 * Usage: source ../../all.env && node scripts/seed-content.mjs
 */

const SITE = process.env.SITE_URL ?? "https://elifnurcicekdagi.com";
const KEY = process.env.ADMIN_API_KEY?.trim();

if (!KEY) {
	console.error("ADMIN_API_KEY required");
	process.exit(1);
}

const headers = {
	Authorization: `Bearer ${KEY}`,
	"Content-Type": "application/json",
};

async function api(method, path, body) {
	const res = await fetch(`${SITE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	const json = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, json };
}

function assertOk(result, label) {
	if (!result.ok && result.status !== 409) {
		console.error(label, result.status, result.json);
		throw new Error(`API ${result.status}`);
	}
}

async function upsertSetting(key, value) {
	assertOk(await api("PUT", `/api/v1/admin/settings/${key}`, { value }), key);
	console.log("settings", key);
}

async function upsertPage(body) {
	const existing = await api("GET", `/api/v1/admin/pages/${body.slug}`);
	if (existing.status === 200) {
		assertOk(await api("PATCH", `/api/v1/admin/pages/${body.slug}`, body), body.slug);
		console.log("page patch", body.slug);
	} else {
		assertOk(await api("POST", "/api/v1/admin/pages", body), body.slug);
		console.log("page create", body.slug);
	}
}

async function upsertProject(body) {
	const existing = await api("GET", `/api/v1/admin/projects/${body.slug}`);
	if (existing.status === 200) {
		assertOk(await api("PATCH", `/api/v1/admin/projects/${body.slug}`, body), body.slug);
		console.log("project patch", body.slug);
	} else {
		assertOk(await api("POST", "/api/v1/admin/projects", body), body.slug);
		console.log("project create", body.slug);
	}
}

await upsertSetting("site.branding", {
	siteName: "Elif Nur Çiçekdağı Özcan",
	tagline: "From cockpit views to city walks or the other way around.",
	email: "info@elifnurcicekdagi.com",
});

await upsertSetting("landing.hero", {
	heading: "Hi, I'm Elif",
	tagline: "From cockpit views to city walks or the other way around.",
	intro: "First Officer · Travel storyteller · Between sky and the world's most beautiful places.",
});

await upsertSetting("landing.about", {
	heading: "About Me",
	body: "With more than five years as a First Officer and a lifelong passion for exploration, I capture the world from 35,000 feet and on the ground.",
});

await upsertSetting("landing.travelMap", {
	version: 1,
	title: "Explorer Atlas",
	subtitle: "Countries and cities from the flight deck and beyond",
	homeHub: { code: "IST", city: "Istanbul", lat: 41.0082, lng: 28.9784 },
	stats: { countries: 2, cities: 4, continents: 2 },
	countries: [
		{ iso2: "TR", name: "Turkey", visited: true, color: "#C25B3F" },
		{ iso2: "QA", name: "Qatar", visited: true, color: "#D4A017" },
	],
	cities: [
		{
			id: "istanbul",
			name: "Istanbul",
			country: "TR",
			countryName: "Turkey",
			lat: 41.0082,
			lng: 28.9784,
			role: "home",
			note: "Where continents meet",
		},
		{
			id: "antalya",
			name: "Antalya",
			country: "TR",
			countryName: "Turkey",
			lat: 36.8969,
			lng: 30.7133,
			role: "visited",
			note: "Mediterranean coast",
		},
		{
			id: "ankara",
			name: "Ankara",
			country: "TR",
			countryName: "Turkey",
			lat: 39.9334,
			lng: 32.8597,
			role: "visited",
			note: "Capital horizons",
		},
		{
			id: "doha",
			name: "Doha",
			country: "QA",
			countryName: "Qatar",
			lat: 25.2854,
			lng: 51.531,
			role: "hub",
			note: "Gulf connections",
		},
	],
	routes: [
		{ from: "istanbul", to: "doha", type: "flight", label: "IST → DOH" },
		{ from: "istanbul", to: "antalya", type: "flight", label: "IST → AYT" },
		{ from: "istanbul", to: "ankara", type: "flight", label: "IST → ESB" },
	],
	globe: {
		atmosphereColor: "#C25B3F",
		pointColor: "#F5EDE4",
		arcColor: "#D4A017",
		autoRotateSpeed: 0.35,
	},
});

await upsertPage({
	slug: "hakkimda",
	path: "/hakkimda",
	title: "Hakkımda",
	pageType: "page",
	showInNav: true,
	navLabel: "Hakkımda",
	status: "published",
	excerpt: "First Officer, gezgin ve içerik üreticisi.",
	bodyMd: `# Hakkımda

Beş yılı aşkın First Officer deneyimim ve keşfetme tutkumla dünyayı hem 35.000 feet'ten hem de yerden görüntülüyorum.

Kokpit disiplini ile özgür keşif arasındaki kontrastın güzelliğine inanıyorum.`,
	seoTitle: "Hakkımda",
	seoDescription: "Elif Nur Çiçekdağı Özcan — pilot ve gezgin.",
	sortOrder: 10,
});

await upsertProject({
	slug: "sardegna-escape",
	title: "Sardegna Escape",
	summary: "Mediterranean coastlines and slow island rhythm.",
	status: "published",
	sortOrder: 1,
	meta: { category: "Mediterranean", location: "Italy" },
	bodyMd: "Sardinia chapter — beaches, light, and quiet luxury.",
});

await upsertProject({
	slug: "hellas-aegean",
	title: "Hellas & Aegean",
	summary: "Greek islands, whitewashed villages, endless blue.",
	status: "published",
	sortOrder: 2,
	meta: { category: "Aegean", location: "Greece" },
	bodyMd: "Aegean sailing and island hopping.",
});

await upsertProject({
	slug: "vienna-beyond",
	title: "Vienna & Beyond",
	summary: "Central European palaces, cafés, and city walks.",
	status: "published",
	sortOrder: 3,
	meta: { category: "Central Europe", location: "Austria" },
	bodyMd: "Vienna and surrounding capitals.",
});

console.log("seed complete");
