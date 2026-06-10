#!/usr/bin/env node
/**
 * Zoho Mail (inbox) + Brevo (transactional) DNS for elifnurcicekdagi.com
 * Run after Zoho domain verification. Idempotent.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... node scripts/setup-email-dns.mjs
 *   ZOHO_DKIM_TXT="zoho._domainkey...." node scripts/setup-email-dns.mjs  # optional DKIM
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "d4a105f403a97cc7af26a2f4a7ee9667";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = "elifnurcicekdagi.com";
const ZOHO_DKIM = process.env.ZOHO_DKIM_TXT;

if (!TOKEN) {
	console.error("CLOUDFLARE_API_TOKEN required");
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

const listRecords = () => api("GET", `/zones/${ZONE_ID}/dns_records?per_page=100`);

const upsert = async (type, name, content, extra = {}) => {
	const records = await listRecords();
	const fullName = name === "@" ? DOMAIN : `${name}.${DOMAIN}`;
	const existing = records.find(
		(r) => r.type === type && r.name === fullName && (extra.priority == null || r.priority === extra.priority),
	);
	const payload = {
		type,
		name: name === "@" ? DOMAIN : name,
		content,
		proxied: false,
		ttl: 3600,
		...extra,
	};
	if (existing) {
		await api("PUT", `/zones/${ZONE_ID}/dns_records/${existing.id}`, payload);
		console.log(`updated ${type} ${fullName}`);
	} else {
		await api("POST", `/zones/${ZONE_ID}/dns_records`, payload);
		console.log(`created ${type} ${fullName}`);
	}
};

const MX = [
	{ priority: 10, content: "mx.zoho.com" },
	{ priority: 20, content: "mx2.zoho.com" },
	{ priority: 50, content: "mx3.zoho.com" },
];

for (const mx of MX) {
	await upsert("MX", "@", mx.content, { priority: mx.priority });
}

await upsert("TXT", "@", "v=spf1 include:zoho.com include:spf.brevo.com ~all");
await upsert("TXT", "_dmarc", `v=DMARC1; p=none; rua=mailto:info@${DOMAIN}`);

if (ZOHO_DKIM) {
	await upsert("TXT", "zoho._domainkey", ZOHO_DKIM);
} else {
	console.log("skip DKIM — set ZOHO_DKIM_TXT from Zoho admin when ready");
}

console.log("done — verify in Zoho Mail + Brevo sender domain panels");
