import { verifyAdminSession } from "./session";

function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const ab = enc.encode(a);
	const bb = enc.encode(b);
	if (ab.length !== bb.length) return false;
	let diff = 0;
	for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
	return diff === 0;
}

export function extractBearerToken(request: Request): string | null {
	const auth = request.headers.get("authorization");
	if (!auth?.startsWith("Bearer ")) return null;
	const token = auth.slice(7).trim();
	return token || null;
}

/** Doğrudan ADMIN_API_KEY (script/curl) — tarayıcı UI bunu kullanmamalı. */
export function verifyAdminKey(request: Request, env: Env): boolean {
	const expected = env.ADMIN_API_KEY;
	if (!expected) return false;
	const token =
		extractBearerToken(request) ??
		request.headers.get("x-admin-key")?.trim() ??
		"";
	if (!token) return false;
	return timingSafeEqual(token, expected);
}

/** HttpOnly oturum çerezi veya Bearer (otomasyon). */
export async function verifyAdminAuth(request: Request, env: Env): Promise<boolean> {
	if (await verifyAdminSession(request, env)) return true;
	return verifyAdminKey(request, env);
}
