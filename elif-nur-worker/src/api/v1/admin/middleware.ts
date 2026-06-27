import { verifyAdminAuth } from "../../shared/auth";
import { jsonError } from "../../shared/response";
import type { ApiContext } from "../context";

export async function requireAdmin(ctx: ApiContext): Promise<Response | null> {
	if (!ctx.env.ADMIN_API_KEY) {
		return jsonError(
			"INTERNAL_ERROR",
			"Admin API yapılandırılmamış.",
			ctx.meta,
			503,
		);
	}
	if (!(await verifyAdminAuth(ctx.request, ctx.env))) {
		return jsonError(
			"UNAUTHORIZED",
			"Geçersiz oturum veya admin anahtarı.",
			ctx.meta,
			401,
		);
	}
	return null;
}
