#!/usr/bin/env node
/**
 * Configure UptimeRobot monitors for elifnurcicekdagi.com (idempotent).
 *
 * Free plan: newMonitor via API is blocked — create extra monitors in the dashboard.
 * This script configures the existing health monitor (keyword + email alerts).
 *
 * Usage: source ../all.env && npm run uptimerobot:setup
 */

const API_KEY = process.env.UPTIMEROBOT_API_KEY;
const DOMAIN = "elifnurcicekdagi.com";
const HEALTH_URL = `https://${DOMAIN}/health`;
const SITE_URL = `https://${DOMAIN}/`;

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
	const text = await res.text();
	if (text.startsWith("Rate limit")) {
		throw new Error(text);
	}
	const data = JSON.parse(text);
	if (data.stat !== "ok") {
		return { ok: false, data };
	}
	return { ok: true, data };
}

async function listMonitors(search = "") {
	const params = { ssl: "1", alert_contacts: "1" };
	if (search) params.search = search;
	const result = await call("getMonitors", params);
	if (!result.ok) throw new Error(JSON.stringify(result.data));
	return result.data.monitors ?? [];
}

async function listEmailContacts() {
	const result = await call("getAlertContacts", {});
	if (!result.ok) throw new Error(JSON.stringify(result.data));
	return (result.data.alert_contacts ?? []).filter((c) => String(c.type) === "2");
}

function monitorAlertString(contacts) {
	return contacts.map((id) => `${id}_0_0`).join("-");
}

async function editMonitor(id, params) {
	const result = await call("editMonitor", { id: String(id), ...params });
	return result.ok;
}

const monitors = await listMonitors(DOMAIN);
const health = monitors.find((m) => m.url === HEALTH_URL || m.url === `${HEALTH_URL}/`);

if (!health) {
	console.error(`No health monitor found for ${HEALTH_URL}`);
	console.error("Create one in UptimeRobot dashboard first (HTTP(s), 5 min).");
	process.exit(1);
}

console.log(`health monitor: id ${health.id} status ${health.status}`);

const emails = await listEmailContacts();
const primaryEmail = emails.find((c) => String(c.status) === "1") ?? emails[0];
if (!primaryEmail) {
	console.warn("No email alert contact — add one in UptimeRobot → My Settings → Alert Contacts");
} else {
	const hasEmail = (health.alert_contacts ?? []).some((c) => c.id === primaryEmail.id);
	if (!hasEmail) {
		const ok = await editMonitor(health.id, {
			alert_contacts: monitorAlertString([primaryEmail.id]),
		});
		console.log(ok ? `attached email alert: ${primaryEmail.value}` : "failed to attach email alert");
	} else {
		console.log(`email alert already set: ${primaryEmail.value}`);
	}
}

const keywordOk = await editMonitor(health.id, {
	friendly_name: `${DOMAIN} — health`,
	type: "1",
	url: HEALTH_URL,
	keyword_type: "1",
	keyword_value: '"ok":true',
});
console.log(keywordOk ? "keyword check enabled: \"ok\":true" : "keyword check skipped (plan limit)");

const sslMonitor = monitors.find(
	(m) => m.url === SITE_URL || m.url === `https://${DOMAIN}`,
);
if (sslMonitor) {
	console.log(`SSL/uptime monitor exists: id ${sslMonitor.id} (${sslMonitor.friendly_name})`);
	if (primaryEmail) {
		const hasEmail = (sslMonitor.alert_contacts ?? []).some((c) => c.id === primaryEmail.id);
		if (!hasEmail) {
			await editMonitor(sslMonitor.id, {
				alert_contacts: monitorAlertString([primaryEmail.id]),
			});
			console.log(`attached email to SSL monitor ${sslMonitor.id}`);
		}
	}
} else {
	console.log("");
	console.log("Manual step (free plan blocks API newMonitor):");
	console.log(`  Dashboard → Add Monitor → HTTPS → ${SITE_URL}`);
	console.log("  Enable SSL expiry + domain expiry notifications in monitor settings.");
	console.log("  Re-run: npm run uptimerobot:setup");
}

console.log("");
console.log("done — domain expiry via API blocked on free plan; use dashboard or GitHub expiry-check workflow");
