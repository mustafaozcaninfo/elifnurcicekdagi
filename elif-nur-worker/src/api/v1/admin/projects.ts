import { logApiAudit } from "../../shared/audit";
import { readJson } from "../../shared/request";
import { jsonError, jsonOk } from "../../shared/response";
import {
	optionalString,
	parseMetaJsonInput,
	parseSlug,
	parseStatus,
	trimString,
} from "../../shared/validate";
import type { ApiContext } from "../context";
import { mapAdminProject, PROJECT_SELECT, type ProjectRow } from "../content/types";
import { requireAdmin } from "./middleware";

type ProjectBody = {
	slug?: string;
	title?: string;
	summary?: string;
	bodyMd?: string;
	linkUrl?: string;
	sortOrder?: number;
	meta?: Record<string, unknown>;
	seoTitle?: string;
	seoDescription?: string;
	status?: string;
};

export async function handleAdminProjects(ctx: ApiContext): Promise<Response> {
	const denied = await requireAdmin(ctx);
	if (denied) return denied;

	const slugPath = parseSlug(ctx.segments[2]);
	const method = ctx.request.method;

	if (method === "GET" && ctx.segments.length === 2) {
		const status = parseStatus(ctx.query.get("status") ?? undefined);
		let sql = `SELECT ${PROJECT_SELECT} FROM content_projects WHERE 1=1`;
		const binds: string[] = [];
		if (status) {
			sql += ` AND status = ?`;
			binds.push(status);
		}
		sql += ` ORDER BY sort_order ASC, updated_at DESC`;
		const { results } = await ctx.env.DB.prepare(sql)
			.bind(...binds)
			.all<ProjectRow>();
		return jsonOk({ items: (results ?? []).map(mapAdminProject) }, ctx.meta);
	}

	if (method === "GET" && ctx.segments.length === 3 && slugPath) {
		const row = await ctx.env.DB.prepare(
			`SELECT ${PROJECT_SELECT} FROM content_projects WHERE slug = ?`,
		)
			.bind(slugPath)
			.first<ProjectRow>();
		if (!row) return jsonError("NOT_FOUND", "Proje bulunamadı.", ctx.meta, 404);
		return jsonOk(mapAdminProject(row), ctx.meta);
	}

	if (method === "POST" && ctx.segments.length === 2) {
		const body = await readJson<ProjectBody>(ctx.request);
		if (!body) return jsonError("BAD_REQUEST", "Geçersiz JSON.", ctx.meta, 400);

		const slug = parseSlug(body.slug);
		const title = trimString(body.title, 200);
		const status = parseStatus(body.status) ?? "draft";
		const metaJson = body.meta != null ? parseMetaJsonInput(body.meta) : "{}";
		if (!slug || !title || metaJson === null) {
			return jsonError("BAD_REQUEST", "slug ve title zorunlu.", ctx.meta, 400);
		}

		const publishedAt = status === "published" ? new Date().toISOString() : null;
		try {
			await ctx.env.DB.prepare(
				`INSERT INTO content_projects (
          slug, title, summary, body_md, link_url, sort_order, meta_json,
          seo_title, seo_description, status, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(
					slug,
					title,
					optionalString(body.summary, 500) ?? "",
					optionalString(body.bodyMd, 50_000) ?? "",
					optionalString(body.linkUrl, 500),
					typeof body.sortOrder === "number" ? Math.max(0, Math.floor(body.sortOrder)) : 0,
					metaJson,
					optionalString(body.seoTitle, 200),
					optionalString(body.seoDescription, 500),
					status,
					publishedAt,
				)
				.run();
		} catch {
			return jsonError("BAD_REQUEST", "slug zaten kullanılıyor.", ctx.meta, 400);
		}

		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "projects.create",
			resource: "projects",
			resourceId: slug,
			ip: ctx.ip,
		});
		return jsonOk({ slug, status }, ctx.meta, { status: 201 });
	}

	if (method === "PATCH" && ctx.segments.length === 3 && slugPath) {
		const body = await readJson<ProjectBody>(ctx.request);
		if (!body) return jsonError("BAD_REQUEST", "Geçersiz JSON.", ctx.meta, 400);

		const existing = await ctx.env.DB.prepare(
			"SELECT id FROM content_projects WHERE slug = ?",
		)
			.bind(slugPath)
			.first<{ id: number }>();
		if (!existing) return jsonError("NOT_FOUND", "Proje bulunamadı.", ctx.meta, 404);

		const title = body.title != null ? trimString(body.title, 200) : null;
		const status = body.status != null ? parseStatus(body.status) : null;
		const metaJson = body.meta != null ? parseMetaJsonInput(body.meta) : null;
		if (body.title != null && !title) return jsonError("BAD_REQUEST", "Geçersiz title.", ctx.meta, 400);
		if (body.status != null && !status) return jsonError("BAD_REQUEST", "Geçersiz status.", ctx.meta, 400);
		if (body.meta != null && metaJson === null) return jsonError("BAD_REQUEST", "Geçersiz meta.", ctx.meta, 400);

		const publishedAt =
			status === "published" ? new Date().toISOString() : status === "draft" ? null : undefined;

		await ctx.env.DB.prepare(
			`UPDATE content_projects SET
        title = COALESCE(?, title),
        summary = COALESCE(?, summary),
        body_md = COALESCE(?, body_md),
        link_url = COALESCE(?, link_url),
        sort_order = COALESCE(?, sort_order),
        meta_json = COALESCE(?, meta_json),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        status = COALESCE(?, status),
        published_at = CASE WHEN ? IS NOT NULL THEN ? ELSE published_at END,
        updated_at = datetime('now')
       WHERE slug = ?`,
		)
			.bind(
				title,
				body.summary !== undefined ? optionalString(body.summary, 500) ?? "" : null,
				body.bodyMd !== undefined ? optionalString(body.bodyMd, 50_000) ?? "" : null,
				body.linkUrl !== undefined ? optionalString(body.linkUrl, 500) : null,
				typeof body.sortOrder === "number" ? Math.max(0, Math.floor(body.sortOrder)) : null,
				metaJson,
				body.seoTitle !== undefined ? optionalString(body.seoTitle, 200) : null,
				body.seoDescription !== undefined ? optionalString(body.seoDescription, 500) : null,
				status,
				publishedAt ?? null,
				publishedAt ?? null,
				slugPath,
			)
			.run();

		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "projects.update",
			resource: "projects",
			resourceId: slugPath,
			ip: ctx.ip,
		});
		return jsonOk({ slug: slugPath }, ctx.meta);
	}

	if (method === "DELETE" && ctx.segments.length === 3 && slugPath) {
		const result = await ctx.env.DB.prepare("DELETE FROM content_projects WHERE slug = ?")
			.bind(slugPath)
			.run();
		if (!result.meta.changes) return jsonError("NOT_FOUND", "Proje bulunamadı.", ctx.meta, 404);
		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "projects.delete",
			resource: "projects",
			resourceId: slugPath,
			ip: ctx.ip,
		});
		return jsonOk({ deleted: slugPath }, ctx.meta);
	}

	return jsonError("METHOD_NOT_ALLOWED", "Desteklenmeyen yöntem.", ctx.meta, 405);
}
