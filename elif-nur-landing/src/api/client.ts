import type { ApiEnvelope, SiteBundle } from "./types";

const API = "/api/v1";
const ADMIN = `${API}/admin`;

const adminInit: RequestInit = {
	credentials: "include",
	headers: { "Content-Type": "application/json" },
};

export async function fetchSite(): Promise<SiteBundle | null> {
	try {
		const res = await fetch(`${API}/site`);
		if (!res.ok) return null;
		const json = (await res.json()) as ApiEnvelope<SiteBundle>;
		return json.ok ? json.data : null;
	} catch {
		return null;
	}
}

/** Tek seferlik giriş — key bellekte kalır, saklanmaz. Sunucu HttpOnly çerez döner. */
export async function adminLogin(apiKey: string): Promise<{ ok: boolean; error?: string }> {
	const res = await fetch(`${ADMIN}/auth/login`, {
		method: "POST",
		credentials: "include",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = (json as { error?: { message?: string } })?.error?.message;
		return { ok: false, error: err ?? "Giriş başarısız" };
	}
	return { ok: true };
}

export async function adminLogout(): Promise<void> {
	await fetch(`${ADMIN}/auth/logout`, { method: "POST", credentials: "include" });
}

export async function adminSessionCheck(): Promise<boolean> {
	const res = await fetch(`${ADMIN}/auth/me`, { credentials: "include" });
	return res.ok;
}

/** Oturum çerezi ile admin API — Authorization header yok. */
export async function adminFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
	const res = await fetch(`${API}${path}`, {
		...adminInit,
		...init,
		headers: { ...adminInit.headers, ...init.headers },
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		const err = (json as { error?: { message?: string } })?.error?.message;
		return { ok: false, status: res.status, error: err ?? `HTTP ${res.status}` };
	}
	return { ok: true, status: res.status, data: (json as ApiEnvelope<T>).data };
}
