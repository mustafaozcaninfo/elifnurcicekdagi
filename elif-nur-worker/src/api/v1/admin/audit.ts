import { jsonError, jsonOk } from "../../shared/response";
import { parseLimit } from "../../shared/validate";
import type { ApiContext } from "../context";
import { requireAdmin } from "./middleware";

export async function handleAdminAudit(ctx: ApiContext): Promise<Response> {
	const denied = await requireAdmin(ctx);
	if (denied) return denied;

	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	const limit = parseLimit(ctx.query.get("limit"), 50, 100);

	const { results } = await ctx.env.DB.prepare(
		`SELECT id, actor, action, resource, resource_id, ip_hash, created_at
     FROM api_audit_log ORDER BY id DESC LIMIT ?`,
	)
		.bind(limit)
		.all<{
			id: number;
			actor: string;
			action: string;
			resource: string;
			resource_id: string | null;
			ip_hash: string | null;
			created_at: string;
		}>();

	return jsonOk(
		{
			items: (results ?? []).map((r) => ({
				id: r.id,
				actor: r.actor,
				action: r.action,
				resource: r.resource,
				resourceId: r.resource_id,
				ipHash: r.ip_hash,
				createdAt: r.created_at,
			})),
		},
		ctx.meta,
		{ headers: { "cache-control": "no-store" } },
	);
}
