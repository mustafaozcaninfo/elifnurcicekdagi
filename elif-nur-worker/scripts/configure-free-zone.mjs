#!/usr/bin/env node
/**
 * Free-plan Cloudflare zone optimizations for elifnurcicekdagi.com
 * Idempotent — safe to re-run. Does NOT modify DNS records.
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "d4a105f403a97cc7af26a2f4a7ee9667";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

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

const ZONE_SETTINGS = {
	always_use_https: "on",
	automatic_https_rewrites: "on",
	brotli: "on",
	http3: "on",
	early_hints: "on",
	ipv6: "on",
	tls_1_3: "zrt",
	min_tls_version: "1.2",
	ssl: "full",
	browser_cache_ttl: 14400,
	cache_level: "aggressive",
	development_mode: "off",
	rocket_loader: "off",
	polish: "off",
	mirage: "off",
	security_level: "low",
	opportunistic_encryption: "on",
	websockets: "on",
	browser_check: "off",
	hotlink_protection: "off",
	email_obfuscation: "on",
	privacy_pass: "on",
	server_side_exclude: "on",
	opportunistic_onion: "on",
	visitor_ip: "on",
	tls_client_auth: "off",
	origin_error_page_pass_thru: "off",
};

const SECURITY_HEADER = {
	strict_transport_security: {
		enabled: true,
		max_age: 31536000,
		include_subdomains: true,
		preload: false,
		nosniff: true,
	},
};

const CACHE_RULES = {
	rules: [
		{
			description: "Bypass health check",
			enabled: true,
			expression:
				'(http.host eq "elifnurcicekdagi.com" or http.host eq "www.elifnurcicekdagi.com") and http.request.uri.path eq "/health"',
			action: "set_cache_settings",
			action_parameters: { cache: false },
		},
		{
			description: "Cache static assets (free plan)",
			enabled: true,
			expression:
				'(http.host eq "elifnurcicekdagi.com" or http.host eq "www.elifnurcicekdagi.com") and (http.request.uri.path.extension in {"css" "js" "jpg" "jpeg" "png" "gif" "webp" "svg" "ico" "woff" "woff2" "ttf" "eot" "avif" "txt" "xml"})',
			action: "set_cache_settings",
			action_parameters: {
				cache: true,
				edge_ttl: { mode: "override_origin", default: 2592000 },
				browser_ttl: { mode: "override_origin", default: 31536000 },
			},
		},
		{
			description: "Cache HTML pages at edge",
			enabled: true,
			expression:
				'(http.host eq "elifnurcicekdagi.com" or http.host eq "www.elifnurcicekdagi.com") and http.request.method eq "GET" and not http.request.uri.path eq "/health"',
			action: "set_cache_settings",
			action_parameters: {
				cache: true,
				edge_ttl: { mode: "override_origin", default: 7200 },
				browser_ttl: { mode: "override_origin", default: 3600 },
			},
		},
	],
};

const REDIRECT_RULES = {
	rules: [
		{
			description: "Canonical redirect www to apex",
			enabled: true,
			expression: '(http.host eq "www.elifnurcicekdagi.com")',
			action: "redirect",
			action_parameters: {
				from_value: {
					status_code: 301,
					preserve_query_string: true,
					target_url: {
						expression:
							'concat("https://elifnurcicekdagi.com", http.request.uri.path)',
					},
				},
			},
		},
	],
};

async function main() {
	console.log("Applying zone settings (free plan)...");
	for (const [id, value] of Object.entries(ZONE_SETTINGS)) {
		try {
			await api("PATCH", `/zones/${ZONE_ID}/settings/${id}`, { value });
			console.log(`  ✓ ${id} = ${value}`);
		} catch (err) {
			console.log(`  ~ ${id} skipped (${err.message})`);
		}
	}

	console.log("Applying HSTS security header (zone level)...");
	try {
		await api("PATCH", `/zones/${ZONE_ID}/settings/security_header`, {
			value: SECURITY_HEADER,
		});
		console.log("  ✓ security_header HSTS enabled");
	} catch (err) {
		console.log(`  ~ security_header skipped (${err.message})`);
	}

	console.log("Applying cache rules...");
	await api(
		"PUT",
		`/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
		CACHE_RULES,
	);
	console.log("  ✓ cache rules updated");

	console.log("Applying www → apex redirect...");
	await api(
		"PUT",
		`/zones/${ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
		REDIRECT_RULES,
	);
	console.log("  ✓ redirect rules updated");

	console.log("Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
