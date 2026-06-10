#!/usr/bin/env node
/**
 * HestiaCP mail DNS for elifnurcicekdagi.com (Cloudflare).
 * Does NOT modify apex A records (Worker site).
 *
 * Usage: source ../all.env && node scripts/setup-hestia-mail-dns.mjs
 * Env: MAIL_SERVER_IP=2.25.147.42 DKIM_TXT='v=DKIM1; ...' (optional, auto from arg)
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "d4a105f403a97cc7af26a2f4a7ee9667";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = "elifnurcicekdagi.com";
const MAIL_HOST = "mail";
const WEBMAIL_HOST = "webmail";
const MAIL_IP = process.env.MAIL_SERVER_IP || "2.25.147.42";
const DKIM_TXT =
	process.env.DKIM_TXT ||
	"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAql8qDMp48/qxiLu5IGEGZtlRBJxR2GSNPv5MucEiKJMJRFIpdfW6Hoj3uN3ZLwion5Xt0yj+l5xFPcpMnjbyUVZ2aEARaoq+xShAwVcns9kKX4zSXFr2707K7y154IF4rMi8NONwUuZNAzs54gaTocAiM+j5EpGASyWa6xLng9ARbBz40In/NNlUNDpBIH62EgHL8GfuiftLQKZxd51lPn7NuQzDwubVx6XIzV2aVZT2rdIz0Y794uwIZdYecIqM27c8Jye1WqdpRa1KWRz+7r/+c8Dpr6LRfWUfkcPK9iEjlH8HSuxmBGV1ZKg1imiVFcYqIKlclYbe5T9jmbBIUQIDAQAB";

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
	const existing = records.find((r) => {
		if (r.type !== type || r.name !== fullName) return false;
		if (extra.priority != null && r.priority !== extra.priority) return false;
		// Apex may have multiple TXT (e.g. brevo-code + SPF) — match by content prefix
		if (type === "TXT" && extra.txtMatch) {
			return r.content.includes(extra.txtMatch);
		}
		return true;
	});
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

await upsert("A", MAIL_HOST, MAIL_IP);
await upsert("A", WEBMAIL_HOST, MAIL_IP);
await upsert("MX", "@", `${MAIL_HOST}.${DOMAIN}`, { priority: 10 });
// Server uses Brevo smarthost (dc_smarthost) for outbound — include spf.brevo.com
// Brevo domain verify (brevo-code) + brevo1/brevo2 CNAME DKIM: add in Brevo panel, not this script
await upsert("TXT", "@", `v=spf1 mx a:${MAIL_HOST}.${DOMAIN} ip4:${MAIL_IP} include:spf.brevo.com ~all`, {
	txtMatch: "v=spf1",
});
await upsert("TXT", "mail._domainkey", DKIM_TXT, { txtMatch: "v=DKIM1" });
await upsert("TXT", "_dmarc", `v=DMARC1; p=quarantine; rua=mailto:info@${DOMAIN}; pct=100; adkim=s; aspf=s`, {
	txtMatch: "v=DMARC1",
});

console.log("done — mail DNS applied (grey cloud / DNS only)");
console.log("note: keep brevo-code TXT and brevo1/brevo2 CNAME from Brevo panel separate");
