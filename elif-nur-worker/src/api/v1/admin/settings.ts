import { logApiAudit } from "../../shared/audit";
import { readJson } from "../../shared/request";
import { jsonError, jsonOk } from "../../shared/response";
import { parseMetaJsonInput } from "../../shared/validate";
import type { ApiContext } from "../context";
import { parseMetaJson } from "../content/types";
import { requireAdmin } from "./middleware";

const SETTING_KEY_RE = /^[a-z][a-z0-9._-]{0,63}$/;

function parseSettingKey(raw: string | undefined): string | null {
	if (!raw) return null;
	const key = raw.trim().toLowerCase();
	return SETTING_KEY_RE.test(key) ? key : null;
}

export async function handleAdminSettings(ctx: ApiContext): Promise<Response> {
	const denied = await requireAdmin(ctx);
	if (denied) return denied;

	const keyPath = parseSettingKey(ctx.segments[2]);
	const method = ctx.request.method;

	if (method === "GET" && ctx.segments.length === 2) {
		const { results } = await ctx.env.DB.prepare(
			"SELECT key, value_json, updated_at FROM site_settings ORDER BY key ASC",
		).all<{ key: string; value_json: string; updated_at: string }>();

		const items = (results ?? []).map((r) => ({
			key: r.key,
			value: parseMetaJson(r.value_json),
			updatedAt: r.updated_at,
		}));
		return jsonOk({ items }, ctx.meta);
	}

	if (method === "GET" && ctx.segments.length === 3 && keyPath) {
		const row = await ctx.env.DB.prepare(
			"SELECT key, value_json, updated_at FROM site_settings WHERE key = ?",
		)
			.bind(keyPath)
			.first<{ key: string; value_json: string; updated_at: string }>();
		if (!row) return jsonError("NOT_FOUND", "Ayar bulunamadı.", ctx.meta, 404);
		return jsonOk(
			{ key: row.key, value: parseMetaJson(row.value_json), updatedAt: row.updated_at },
			ctx.meta,
		);
	}

	if ((method === "PUT" || method === "PATCH") && ctx.segments.length === 3 && keyPath) {
		const body = await readJson<{ value?: Record<string, unknown> }>(ctx.request);
		if (!body || body.value == null) {
			return jsonError("BAD_REQUEST", "value objesi zorunlu.", ctx.meta, 400);
		}
		const valueJson = parseMetaJsonInput(body.value);
		if (valueJson === null) {
			return jsonError("BAD_REQUEST", "Geçersiz value JSON.", ctx.meta, 400);
		}

		await ctx.env.DB.prepare(
			`INSERT INTO site_settings (key, value_json, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')`,
		)
			.bind(keyPath, valueJson)
			.run();

		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "settings.upsert",
			resource: "settings",
			resourceId: keyPath,
			ip: ctx.ip,
		});
		return jsonOk({ key: keyPath }, ctx.meta);
	}

	if (method === "DELETE" && ctx.segments.length === 3 && keyPath) {
		const result = await ctx.env.DB.prepare("DELETE FROM site_settings WHERE key = ?")
			.bind(keyPath)
			.run();
		if (!result.meta.changes) return jsonError("NOT_FOUND", "Ayar bulunamadı.", ctx.meta, 404);
		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "settings.delete",
			resource: "settings",
			resourceId: keyPath,
			ip: ctx.ip,
		});
		return jsonOk({ deleted: keyPath }, ctx.meta);
	}

	return jsonError("METHOD_NOT_ALLOWED", "Desteklenmeyen yöntem.", ctx.meta, 405);
}
