const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_SEC = 3600;

type ContactPayload = {
	name?: string;
	email?: string;
	message?: string;
	consent?: boolean;
	"cf-turnstile-response"?: string;
	website?: string;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

async function hashIp(ip: string): Promise<string> {
	const data = new TextEncoder().encode(ip);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function checkRateLimit(
	kv: KVNamespace,
	ip: string,
): Promise<boolean> {
	const key = `rate:${await hashIp(ip)}`;
	const current = Number((await kv.get(key)) ?? "0");
	if (current >= RATE_LIMIT_MAX) return false;
	await kv.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SEC });
	return true;
}

async function verifyTurnstile(
	secret: string,
	token: string,
	ip: string,
): Promise<boolean> {
	const body = new URLSearchParams({
		secret,
		response: token,
		remoteip: ip,
	});
	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{ method: "POST", body },
	);
	const data = (await res.json()) as { success?: boolean };
	return Boolean(data.success);
}

async function sendBrevoNotification(
	apiKey: string,
	to: string,
	name: string,
	email: string,
	message: string,
): Promise<void> {
	const res = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			"api-key": apiKey,
			"content-type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({
			sender: { name: "elifnurcicekdagi.com", email: "info@elifnurcicekdagi.com" },
			to: [{ email: to }],
			subject: `New contact form: ${name}`,
			htmlContent: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
			replyTo: { email, name },
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		console.error("Brevo error:", res.status, text);
	}
}

export async function handleContact(
	request: Request,
	env: Env,
): Promise<Response> {
	if (request.method !== "POST") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	const ip =
		request.headers.get("CF-Connecting-IP") ??
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown";

	if (!(await checkRateLimit(env.RATE_LIMIT, ip))) {
		return Response.json(
			{ error: "Too many requests. Please try again later." },
			{ status: 429 },
		);
	}

	let payload: ContactPayload;
	try {
		payload = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (payload.website) {
		return Response.json({ ok: true });
	}

	const name = payload.name?.trim().slice(0, 120) ?? "";
	const email = payload.email?.trim().slice(0, 254) ?? "";
	const message = payload.message?.trim().slice(0, 5000) ?? "";
	const turnstileToken = payload["cf-turnstile-response"] ?? "";

	if (!name || !email || !message) {
		return Response.json({ error: "All fields are required." }, { status: 400 });
	}
	if (!payload.consent) {
		return Response.json(
			{ error: "You must accept the privacy policy." },
			{ status: 400 },
		);
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return Response.json({ error: "Invalid email address." }, { status: 400 });
	}
	if (!env.TURNSTILE_SECRET_KEY) {
		return Response.json({ error: "Form is not configured yet." }, { status: 503 });
	}
	if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip))) {
		return Response.json({ error: "Security verification failed." }, { status: 403 });
	}

	const ipHash = await hashIp(ip);
	await env.DB.prepare(
		"INSERT INTO contact_submissions (name, email, message, ip_hash, consent_given) VALUES (?, ?, ?, ?, ?)",
	)
		.bind(name, email, message, ipHash, 1)
		.run();

	console.log(
		JSON.stringify({
			event: "contact_submission",
			name,
			email,
			messageLength: message.length,
			brevo: Boolean(env.BREVO_API_KEY),
		}),
	);

	if (env.BREVO_API_KEY && env.CONTACT_NOTIFY_EMAIL) {
		await sendBrevoNotification(
			env.BREVO_API_KEY,
			env.CONTACT_NOTIFY_EMAIL,
			name,
			email,
			message,
		);
	}

	return Response.json({ ok: true, message: "Message received. Thank you!" });
}
