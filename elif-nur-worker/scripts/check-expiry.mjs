#!/usr/bin/env node
/**
 * Check SSL cert and domain registry expiry.
 * Exit 1 if either expires within WARN_DAYS (default 30).
 */

import { execSync } from "node:child_process";

const DOMAIN = process.env.DOMAIN ?? "elifnurcicekdagi.com";
const WARN_DAYS = Number(process.env.WARN_DAYS ?? "30");
const MS_PER_DAY = 86_400_000;

function daysUntil(date) {
	return Math.floor((date.getTime() - Date.now()) / MS_PER_DAY);
}

async function getDomainExpiry() {
	const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${DOMAIN}`);
	if (!res.ok) throw new Error(`RDAP failed: ${res.status}`);
	const data = await res.json();
	const event = data.events?.find((e) => e.eventAction === "expiration");
	if (!event?.eventDate) throw new Error(`Domain expiry not found in RDAP for ${DOMAIN}`);
	return new Date(event.eventDate);
}

function getSslExpiry() {
	const pem = execSync(
		`echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null`,
		{ encoding: "utf8" },
	);
	const match = pem.match(/notAfter=(.+)/);
	if (!match) throw new Error(`SSL expiry not found for ${DOMAIN}`);
	return new Date(match[1].trim());
}

const domainExpiry = await getDomainExpiry();
const sslExpiry = getSslExpiry();
const domainDays = daysUntil(domainExpiry);
const sslDays = daysUntil(sslExpiry);

console.log(`Domain ${DOMAIN}: expires ${domainExpiry.toISOString()} (${domainDays} days)`);
console.log(`SSL ${DOMAIN}: expires ${sslExpiry.toISOString()} (${sslDays} days)`);

const warnings = [];
if (domainDays < WARN_DAYS) {
	warnings.push(`Domain expires in ${domainDays} days (threshold ${WARN_DAYS})`);
}
if (sslDays < WARN_DAYS) {
	warnings.push(`SSL expires in ${sslDays} days (threshold ${WARN_DAYS})`);
}

if (warnings.length) {
	console.error("EXPIRY WARNING:");
	for (const w of warnings) console.error(`  - ${w}`);
	process.exit(1);
}

console.log(`OK — both expire in more than ${WARN_DAYS} days`);
