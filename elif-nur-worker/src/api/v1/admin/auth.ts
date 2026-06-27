import { logApiAudit } from "../../shared/audit";
import { verifyAdminKey } from "../../shared/auth";
import {
	createAdminSession,
	destroyAdminSession,
	verifyAdminSession,
} from "../../shared/session";
import { jsonError, jsonOk } from "../../shared/response";
import type { ApiContext } from "../context";

export async function handleAdminAuth(ctx: ApiContext): Promise<Response> {
	const action = `${ctx.segments[1]}/${ctx.segments[2]}`;
	const method = ctx.request.method;

	if (action === "auth/login" && method === "POST") {
		if (!ctx.env.ADMIN_API_KEY) {
			return jsonError("INTERNAL_ERROR", "Admin API yapılandırılmamış.", ctx.meta, 503);
		}
		if (!verifyAdminKey(ctx.request, ctx.env)) {
			return jsonError("UNAUTHORIZED", "Geçersiz admin anahtarı.", ctx.meta, 401);
		}
		const { cookie } = await createAdminSession(ctx.env.RATE_LIMIT, ctx.ip);
		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "auth.login",
			resource: "auth",
			ip: ctx.ip,
		});
		return jsonOk(
			{ authenticated: true, expiresInHours: 8 },
			ctx.meta,
			{
				headers: {
					"set-cookie": cookie,
					"cache-control": "no-store",
				},
			},
		);
	}

	if (action === "auth/logout" && method === "POST") {
		const clearCookie = await destroyAdminSession(ctx.request, ctx.env.RATE_LIMIT);
		return jsonOk({ authenticated: false }, ctx.meta, {
			headers: { "set-cookie": clearCookie, "cache-control": "no-store" },
		});
	}

	if (action === "auth/me" && method === "GET") {
		const ok = await verifyAdminSession(ctx.request, ctx.env);
		if (!ok) {
			return jsonError("UNAUTHORIZED", "Oturum yok veya süresi doldu.", ctx.meta, 401);
		}
		return jsonOk({ authenticated: true }, ctx.meta, {
			headers: { "cache-control": "no-store" },
		});
	}

	return jsonError("METHOD_NOT_ALLOWED", "Desteklenmeyen yöntem.", ctx.meta, 405);
}
