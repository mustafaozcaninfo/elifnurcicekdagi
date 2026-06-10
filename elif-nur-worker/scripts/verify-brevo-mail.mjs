#!/usr/bin/env node
/**
 * Check elifnurcicekdagi.com on Brevo (domain auth + senders).
 * Usage: source ../../all.env && node scripts/verify-brevo-mail.mjs
 */

const API_KEY = process.env.BREVO_API_KEY?.trim();
const DOMAIN = "elifnurcicekdagi.com";
const SENDERS = ["info@elifnurcicekdagi.com", "noreply@elifnurcicekdagi.com"];

if (!API_KEY) {
	console.error("BREVO_API_KEY required (add to all.env)");
	process.exit(1);
}

const api = async (method, path, body) => {
	const res = await fetch(`https://api.brevo.com/v3${path}`, {
		method,
		headers: {
			"api-key": API_KEY,
			accept: "application/json",
			"content-type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = new Error(data.message || res.statusText);
		err.code = data.code;
		err.status = res.status;
		throw err;
	}
	return data;
};

try {
	const account = await api("GET", "/account");
	console.log("Brevo account:", account.email, "| plan:", account.plan?.type);

	const domain = await api("GET", `/senders/domains/${DOMAIN}`);
	console.log("\nDomain:", domain.domain_name ?? DOMAIN);
	console.log("  verified:", domain.verified);
	console.log("  authenticated:", domain.authenticated);
	if (domain.dns_records && typeof domain.dns_records === "object") {
		for (const [k, v] of Object.entries(domain.dns_records)) {
			if (v == null) {
				console.log(`  DNS ${k}: (n/a)`);
				continue;
			}
			const rec = v.record || v;
			const status = rec?.status ?? v?.status ?? v;
			console.log(`  DNS ${k}:`, status === true || status === "valid" ? "OK" : status);
		}
	}

	if (!domain.authenticated) {
		console.log("\nTrying authenticate PUT...");
		const auth = await api("PUT", `/senders/domains/${DOMAIN}/authenticate`);
		console.log("  ", auth.message || auth);
	}

	const { senders = [] } = await api("GET", `/senders?domain=${DOMAIN}`);
	const existing = new Set(senders.map((s) => s.email?.toLowerCase()));
	console.log("\nSenders on domain:", [...existing].join(", ") || "(none)");

	for (const email of SENDERS) {
		if (existing.has(email)) continue;
		console.log(`Creating sender ${email}...`);
		await api("POST", "/senders", { name: DOMAIN, email });
		console.log(`  created ${email}`);
	}

	console.log("\nDone.");
} catch (e) {
	if (e.code === "unauthorized" && String(e.message).includes("unrecognised IP")) {
		console.error("\nBrevo IP kısıtlaması:", e.message);
		console.error("Çözüm: https://app.brevo.com/security/authorised_ips");
		console.error("  - IP kısıtlamasını kapatın VEYA");
		console.error("  - Makinenizin IP'sini (ve gerekirse 2.25.147.42) ekleyin");
		process.exit(2);
	}
	console.error("Error:", e.message || e);
	process.exit(1);
}
