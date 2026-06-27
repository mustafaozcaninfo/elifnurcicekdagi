const MAX_JSON_BYTES = 65_536;

export function getClientIp(request: Request): string {
	return (
		request.headers.get("CF-Connecting-IP") ??
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown"
	);
}

export async function hashIp(ip: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(ip),
	);
	return [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function assertMethod(request: Request, allowed: string[]): boolean {
	return allowed.includes(request.method);
}

export function contentLengthOk(request: Request): boolean {
	const raw = request.headers.get("content-length");
	if (!raw) return true;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 && n <= MAX_JSON_BYTES;
}

export async function readJson<T>(request: Request): Promise<T | null> {
	if (!contentLengthOk(request)) return null;
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}
