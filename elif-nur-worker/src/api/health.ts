const SITE = "elifnurcicekdagi.com";

/** Static infra reference — no secrets. Keep in sync with OPERATIONS.md */
export const INFRA = {
	worker: "elif-nur-worker",
	d1: { name: "elif-nur-db", id: "453e2db6-d161-4a3a-86a9-55ad036097c1" },
	kv: { name: "RATE_LIMIT", id: "bb1ce06a5dd7457581a52bf584bde252" },
	mail: {
		mx: "mail.elifnurcicekdagi.com",
		webmail: "https://webmail.elifnurcicekdagi.com",
		imap: "mail.elifnurcicekdagi.com:993",
		smtp: "mail.elifnurcicekdagi.com:587",
		serverIp: "2.25.147.42",
		account: "info@elifnurcicekdagi.com",
	},
	brevo: { relay: "smtp-relay.brevo.com" },
	vps: { hostname: "web.typecalendar.com", panel: "HestiaCP 1.9.6" },
} as const;

export type ProbeResult = {
	ok: boolean;
	status?: number;
	latencyMs?: number;
	error?: string;
};

export type HealthReport = {
	ok: boolean;
	site: string;
	status: "healthy" | "degraded";
	timestamp: string;
	worker: {
		colo?: string;
		cfRay?: string;
	};
	bindings: {
		d1: { ok: boolean; name: string; error?: string };
		kv: { ok: boolean; name: string };
		assets: boolean;
	};
	secrets: {
		turnstile: boolean;
		brevo: boolean;
		analytics: boolean;
	};
	config: {
		contactNotifyEmail: string;
		turnstileSiteKey: string;
	};
	contact: {
		total: number;
		last24h: number;
		latestAt: string | null;
	};
	probes: {
		site: ProbeResult;
		webmail: ProbeResult;
	};
	infra: typeof INFRA;
	apis: {
		live: { method: string; path: string; description: string }[];
		planned: string[];
	};
};

async function probeUrl(url: string, timeoutMs = 5000): Promise<ProbeResult> {
	const start = Date.now();
	try {
		const res = await fetch(url, {
			method: "HEAD",
			signal: AbortSignal.timeout(timeoutMs),
			redirect: "follow",
		});
		return {
			ok: res.ok,
			status: res.status,
			latencyMs: Date.now() - start,
		};
	} catch (e) {
		return {
			ok: false,
			latencyMs: Date.now() - start,
			error: e instanceof Error ? e.message : "probe failed",
		};
	}
}

async function getContactStats(db: D1Database): Promise<HealthReport["contact"]> {
	const totalRow = await db
		.prepare("SELECT COUNT(*) AS n FROM contact_submissions")
		.first<{ n: number }>();
	const last24Row = await db
		.prepare(
			"SELECT COUNT(*) AS n FROM contact_submissions WHERE created_at >= datetime('now', '-1 day')",
		)
		.first<{ n: number }>();
	const latestRow = await db
		.prepare("SELECT created_at FROM contact_submissions ORDER BY id DESC LIMIT 1")
		.first<{ created_at: string }>();

	return {
		total: totalRow?.n ?? 0,
		last24h: last24Row?.n ?? 0,
		latestAt: latestRow?.created_at ?? null,
	};
}

export async function buildHealthReport(
	env: Env,
	request: Request,
): Promise<HealthReport> {
	let d1Ok = false;
	let d1Error: string | undefined;
	try {
		await env.DB.prepare("SELECT 1").first();
		d1Ok = true;
	} catch (e) {
		d1Error = e instanceof Error ? e.message : "D1 unavailable";
	}

	let contact: HealthReport["contact"] = { total: 0, last24h: 0, latestAt: null };
	if (d1Ok) {
		try {
			contact = await getContactStats(env.DB);
		} catch {
			/* stats optional */
		}
	}

	const [siteProbe, webmailProbe] = await Promise.all([
		probeUrl(`https://${SITE}/favicon.svg`, 3000),
		probeUrl(INFRA.mail.webmail, 3000),
	]);

	const secrets = {
		turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
		brevo: Boolean(env.BREVO_API_KEY),
		analytics: Boolean(env.CF_WEB_ANALYTICS_TOKEN),
	};

	const degraded =
		!d1Ok ||
		!secrets.turnstile ||
		!secrets.brevo ||
		!webmailProbe.ok;

	return {
		ok: d1Ok,
		site: SITE,
		status: degraded ? "degraded" : "healthy",
		timestamp: new Date().toISOString(),
		worker: {
			colo: request.cf?.colo as string | undefined,
			cfRay: request.headers.get("cf-ray") ?? undefined,
		},
		bindings: {
			d1: { ok: d1Ok, name: INFRA.d1.name, error: d1Error },
			kv: { ok: true, name: INFRA.kv.name },
			assets: Boolean(env.ASSETS),
		},
		secrets,
		config: {
			contactNotifyEmail: env.CONTACT_NOTIFY_EMAIL,
			turnstileSiteKey: env.TURNSTILE_SITE_KEY,
		},
		contact,
		probes: {
			site: siteProbe,
			webmail: webmailProbe,
		},
		infra: INFRA,
		apis: {
			live: [
				{ method: "GET", path: "/health", description: "Sistem durumu (JSON)" },
				{ method: "GET", path: "/health/dashboard", description: "Durum paneli (HTML)" },
				{ method: "POST", path: "/api/contact", description: "İletişim formu" },
			],
			planned: [
				"REST API v1 (içerik, portfolyo, vb.)",
				"Kimlik doğrulama / admin",
				"Webhook entegrasyonları",
			],
		},
	};
}

export async function handleHealth(request: Request, env: Env): Promise<Response> {
	const report = await buildHealthReport(env, request);
	return Response.json(report, {
		headers: { "cache-control": "no-store" },
	});
}
