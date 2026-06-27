import { hashIp } from "./request";

const COOKIE_NAME = "elif_admin_session";
const SESSION_TTL_SEC = 8 * 60 * 60; // 8 saat

export type AdminSession = {
	id: string;
	ipHash: string;
	createdAt: string;
};

function sessionKvKey(token: string): string {
	return `admin_sess:${token}`;
}

export function parseSessionCookie(request: Request): string | null {
	const raw = request.headers.get("cookie");
	if (!raw) return null;
	for (const part of raw.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === COOKIE_NAME) {
			const val = rest.join("=").trim();
			return val || null;
		}
	}
	return null;
}

export async function createAdminSession(
	kv: KVNamespace,
	ip: string,
): Promise<{ token: string; cookie: string }> {
	const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
	const session: AdminSession = {
		id: token.slice(0, 16),
		ipHash: await hashIp(ip),
		createdAt: new Date().toISOString(),
	};
	await kv.put(sessionKvKey(token), JSON.stringify(session), {
		expirationTtl: SESSION_TTL_SEC,
	});
	const cookie = [
		`${COOKIE_NAME}=${token}`,
		"Path=/api/v1/admin",
		"HttpOnly",
		"Secure",
		"SameSite=Strict",
		`Max-Age=${SESSION_TTL_SEC}`,
	].join("; ");
	return { token, cookie };
}

export async function verifyAdminSession(
	request: Request,
	env: Env,
): Promise<boolean> {
	const token = parseSessionCookie(request);
	if (!token || token.length < 32 || token.length > 128) return false;
	const raw = await env.RATE_LIMIT.get(sessionKvKey(token));
	if (!raw) return false;
	try {
		JSON.parse(raw) as AdminSession;
		return true;
	} catch {
		return false;
	}
}

export async function destroyAdminSession(
	request: Request,
	kv: KVNamespace,
): Promise<string> {
	const token = parseSessionCookie(request);
	if (token) await kv.delete(sessionKvKey(token));
	return [
		`${COOKIE_NAME}=`,
		"Path=/api/v1/admin",
		"HttpOnly",
		"Secure",
		"SameSite=Strict",
		"Max-Age=0",
	].join("; ");
}
