#!/usr/bin/env node
/**
 * Enable Cloudflare Workers Observability failure notifications (free).
 *
 * Usage: source ../all.env && npm run alerts:configure
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const EMAIL = process.env.ALERT_EMAIL ?? "mst4fa@gmail.com";
const POLICY_NAME = "elif-nur-worker observability";

if (!ACCOUNT_ID || !TOKEN) {
	console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN required");
	process.exit(1);
}

const api = async (method, path, body) => {
	const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`${method} ${path}: ${JSON.stringify(data.errors)}`);
	}
	return data.result;
};

try {
	const policies = await api(
		"GET",
		`/accounts/${ACCOUNT_ID}/alerting/v3/policies?per_page=50`,
	);
	const existing = (policies ?? []).find((p) => p.name === POLICY_NAME);
	if (existing) {
		console.log(`alert policy exists: ${existing.name} (${existing.id})`);
		process.exit(0);
	}

	const created = await api("POST", `/accounts/${ACCOUNT_ID}/alerting/v3/policies`, {
		name: POLICY_NAME,
		description: "Worker observability alert failures",
		enabled: true,
		alert_type: "workers_observability_alert",
		mechanisms: { email: [{ id: EMAIL }] },
		filters: { status: ["FIRING_FAILED"] },
	});
	console.log(`created observability alert policy → ${EMAIL} (id ${created.id})`);
	console.log("");
	console.log("Create alert rules in: Cloudflare → Workers → elif-nur-worker → Observability → Alerts");
	console.log("MCP logs: Cursor → Settings → MCP → cloudflare-observability → Reconnect");
} catch (err) {
	console.error(err.message);
	process.exit(1);
}
