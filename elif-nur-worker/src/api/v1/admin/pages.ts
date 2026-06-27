import { logApiAudit } from "../../shared/audit";
import { readJson } from "../../shared/request";
import { jsonError, jsonOk } from "../../shared/response";
import {
	optionalString,
	parseBooleanFlag,
	parseContentPath,
	parseMetaJsonInput,
	parsePageType,
	parseSlug,
	parseStatus,
	pathFromSlug,
	trimString,
} from "../../shared/validate";
import type { ApiContext } from "../context";
import {
	ContentPageRow,
	mapAdminPage,
	PAGE_SELECT,
} from "../content/types";
import { requireAdmin } from "./middleware";

type PageBody = {
	slug?: string;
	path?: string;
	title?: string;
	excerpt?: string;
	bodyMd?: string;
	pageType?: string;
	sortOrder?: number;
	meta?: Record<string, unknown>;
	seoTitle?: string;
	seoDescription?: string;
	showInNav?: boolean;
	navLabel?: string;
	status?: string;
};

function publishedAtForStatus(status: "draft" | "published" | null): string | null | undefined {
	if (status === "published") return new Date().toISOString();
	if (status === "draft") return null;
	return undefined;
}

export async function handleAdminPages(ctx: ApiContext): Promise<Response> {
	const denied = await requireAdmin(ctx);
	if (denied) return denied;

	const slugPath = parseSlug(ctx.segments[2]);
	const method = ctx.request.method;

	if (method === "GET" && ctx.segments.length === 2) {
		const status = parseStatus(ctx.query.get("status") ?? undefined);
		const pageType = parsePageType(ctx.query.get("type") ?? undefined);
		let sql = `SELECT ${PAGE_SELECT} FROM content_pages WHERE 1=1`;
		const binds: string[] = [];
		if (status) {
			sql += ` AND status = ?`;
			binds.push(status);
		}
		if (pageType) {
			sql += ` AND page_type = ?`;
			binds.push(pageType);
		}
		sql += ` ORDER BY sort_order ASC, updated_at DESC`;
		const { results } = await ctx.env.DB.prepare(sql)
			.bind(...binds)
			.all<ContentPageRow>();
		return jsonOk({ items: (results ?? []).map(mapAdminPage) }, ctx.meta);
	}

	if (method === "GET" && ctx.segments.length === 3 && slugPath) {
		const row = await ctx.env.DB.prepare(
			`SELECT ${PAGE_SELECT} FROM content_pages WHERE slug = ?`,
		)
			.bind(slugPath)
			.first<ContentPageRow>();
		if (!row) return jsonError("NOT_FOUND", "Sayfa bulunamadı.", ctx.meta, 404);
		return jsonOk(mapAdminPage(row), ctx.meta);
	}

	if (method === "POST" && ctx.segments.length === 2) {
		const body = await readJson<PageBody>(ctx.request);
		if (!body) return jsonError("BAD_REQUEST", "Geçersiz JSON.", ctx.meta, 400);

		const slug = parseSlug(body.slug);
		const title = trimString(body.title, 200);
		const status = parseStatus(body.status) ?? "draft";
		const pageType = parsePageType(body.pageType) ?? "page";
		const path = parseContentPath(body.path) ?? (slug ? pathFromSlug(slug) : null);
		const metaJson = body.meta != null ? parseMetaJsonInput(body.meta) : "{}";
		const showInNav = parseBooleanFlag(body.showInNav) ?? false;

		if (!slug || !title || !path || metaJson === null) {
			return jsonError("BAD_REQUEST", "slug, title ve geçerli path/meta zorunlu.", ctx.meta, 400);
		}

		const publishedAt = publishedAtForStatus(status);
		try {
			await ctx.env.DB.prepare(
				`INSERT INTO content_pages (
          slug, path, title, excerpt, body_md, page_type, sort_order, meta_json,
          seo_title, seo_description, show_in_nav, nav_label, status, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(
					slug,
					path,
					title,
					optionalString(body.excerpt, 500) ?? "",
					optionalString(body.bodyMd, 50_000) ?? "",
					pageType,
					typeof body.sortOrder === "number" ? Math.max(0, Math.floor(body.sortOrder)) : 0,
					metaJson,
					optionalString(body.seoTitle, 200),
					optionalString(body.seoDescription, 500),
					showInNav ? 1 : 0,
					optionalString(body.navLabel, 100),
					status,
					publishedAt,
				)
				.run();
		} catch {
			return jsonError("BAD_REQUEST", "slug veya path zaten kullanılıyor.", ctx.meta, 400);
		}

		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "pages.create",
			resource: "pages",
			resourceId: slug,
			ip: ctx.ip,
		});
		return jsonOk({ slug, path, status }, ctx.meta, { status: 201 });
	}

	if (method === "PATCH" && ctx.segments.length === 3 && slugPath) {
		const body = await readJson<PageBody>(ctx.request);
		if (!body) return jsonError("BAD_REQUEST", "Geçersiz JSON.", ctx.meta, 400);

		const existing = await ctx.env.DB.prepare(
			`SELECT ${PAGE_SELECT} FROM content_pages WHERE slug = ?`,
		)
			.bind(slugPath)
			.first<ContentPageRow>();
		if (!existing) return jsonError("NOT_FOUND", "Sayfa bulunamadı.", ctx.meta, 404);

		const title = body.title != null ? trimString(body.title, 200) : null;
		const status = body.status != null ? parseStatus(body.status) : null;
		const pageType = body.pageType != null ? parsePageType(body.pageType) : null;
		const path = body.path != null ? parseContentPath(body.path) : null;
		const metaJson = body.meta != null ? parseMetaJsonInput(body.meta) : null;
		const showInNav =
			body.showInNav !== undefined ? parseBooleanFlag(body.showInNav) : null;

		if (body.title != null && !title) return jsonError("BAD_REQUEST", "Geçersiz title.", ctx.meta, 400);
		if (body.status != null && !status) return jsonError("BAD_REQUEST", "Geçersiz status.", ctx.meta, 400);
		if (body.pageType != null && !pageType) return jsonError("BAD_REQUEST", "Geçersiz pageType.", ctx.meta, 400);
		if (body.path != null && !path) return jsonError("BAD_REQUEST", "Geçersiz path.", ctx.meta, 400);
		if (body.meta != null && metaJson === null) return jsonError("BAD_REQUEST", "Geçersiz meta.", ctx.meta, 400);

		const publishedAt = publishedAtForStatus(status);

		await ctx.env.DB.prepare(
			`UPDATE content_pages SET
        title = COALESCE(?, title),
        path = COALESCE(?, path),
        excerpt = COALESCE(?, excerpt),
        body_md = COALESCE(?, body_md),
        page_type = COALESCE(?, page_type),
        sort_order = COALESCE(?, sort_order),
        meta_json = COALESCE(?, meta_json),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        show_in_nav = COALESCE(?, show_in_nav),
        nav_label = COALESCE(?, nav_label),
        status = COALESCE(?, status),
        published_at = CASE WHEN ? IS NOT NULL THEN ? ELSE published_at END,
        updated_at = datetime('now')
       WHERE slug = ?`,
		)
			.bind(
				title,
				path,
				body.excerpt !== undefined ? optionalString(body.excerpt, 500) ?? "" : null,
				body.bodyMd !== undefined ? optionalString(body.bodyMd, 50_000) ?? "" : null,
				pageType,
				typeof body.sortOrder === "number" ? Math.max(0, Math.floor(body.sortOrder)) : null,
				metaJson,
				body.seoTitle !== undefined ? optionalString(body.seoTitle, 200) : null,
				body.seoDescription !== undefined ? optionalString(body.seoDescription, 500) : null,
				showInNav !== null ? (showInNav ? 1 : 0) : null,
				body.navLabel !== undefined ? optionalString(body.navLabel, 100) : null,
				status,
				publishedAt ?? null,
				publishedAt ?? null,
				slugPath,
			)
			.run();

		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "pages.update",
			resource: "pages",
			resourceId: slugPath,
			ip: ctx.ip,
		});
		return jsonOk({ slug: slugPath }, ctx.meta);
	}

	if (method === "DELETE" && ctx.segments.length === 3 && slugPath) {
		const result = await ctx.env.DB.prepare("DELETE FROM content_pages WHERE slug = ?")
			.bind(slugPath)
			.run();
		if (!result.meta.changes) return jsonError("NOT_FOUND", "Sayfa bulunamadı.", ctx.meta, 404);
		await logApiAudit(ctx.env.DB, {
			actor: "admin",
			action: "pages.delete",
			resource: "pages",
			resourceId: slugPath,
			ip: ctx.ip,
		});
		return jsonOk({ deleted: slugPath }, ctx.meta);
	}

	return jsonError("METHOD_NOT_ALLOWED", "Desteklenmeyen yöntem.", ctx.meta, 405);
}
