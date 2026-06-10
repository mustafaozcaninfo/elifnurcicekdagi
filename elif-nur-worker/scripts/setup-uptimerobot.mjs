#!/usr/bin/env node
/**
 * Create UptimeRobot monitors (idempotent): health + HTTPS with expiry alerts.
 *
 * UptimeRobot free plan sends SSL/domain expiry emails when enabled on HTTP monitors.
 *
 * 1. UptimeRobot → My Settings → API → Main API Key
 * 2. Add to all.env: UPTIMEROBOT_API_KEY=...
 * 3. node scripts/setup-uptimerobot.mjs
 */

const API_KEY = process.env.UPTIMEROBOT_API_KEY;
const DOMAIN = "elifnurcicekdagi.com";
const URL = `https://${DOMAIN}`;
const HEALTH = `${URL}/health`;

if (!API_KEY) {
	console.error("UPTIMEROBOT_API_KEY required in all.env");
	process.exit(1);
}

async function call(endpoint, params) {
	const body = new URLSearchParams({ format: "json", api_key: API_KEY, ...params });
	const res = await fetch(`https://api.uptimerobot.com/v2/${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	const data = await res.json();
	if (data.stat !== "ok") {
		throw new Error(`${endpoint}: ${JSON.stringify(data)}`);
	}
	return data;
}

async function listMonitors() {
	const data = await call("getMonitors", { ssl: "1" });
	return data.monitors ?? [];
}

async function ensureMonitor(createParams) {
	const monitors = await listMonitors();
	const existing = monitors.find(
		(m) => m.friendly_name === createParams.friendly_name,
	);
	if (existing) {
		console.log(`exists: ${createParams.friendly_name} (id ${existing.id})`);
		return existing;
	}
	const data = await call("newMonitor", createParams);
	console.log(`created: ${createParams.friendly_name} (id ${data.monitor?.id})`);
	return data.monitor;
}

// Health: uptime + keyword + domain expiry notifications from URL host
await ensureMonitor({
	friendly_name: `${DOMAIN} — health`,
	url: HEALTH,
	type: "1",
	keyword_type: "1",
	keyword_value: '"ok":true',
	interval: "300",
	disable_domain_expire_notifications: "0",
});

// HTTPS: uptime + SSL cert expiry alerts (UptimeRobot checks cert on HTTPS URL)
await ensureMonitor({
	friendly_name: `${DOMAIN} — SSL`,
	url: URL,
	type: "1",
	interval: "300",
	disable_domain_expire_notifications: "1",
});

console.log("done — add Alert Contact email in UptimeRobot if not set yet");
