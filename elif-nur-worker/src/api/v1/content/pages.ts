import { jsonError, jsonOk } from "../../shared/response";
import { parseContentPath, parsePageType, parseSlug } from "../../shared/validate";
import type { ApiContext } from "../context";
import {
	ContentPageRow,
	mapPublicPage,
	PAGE_SELECT,
	type PageType,
} from "./types";

const CACHE = { headers: { "cache-control": "public, max-age=60, s-maxage=300" } };

function pageTypeFilter(ctx: ApiContext): PageType | null {
	const t = ctx.query.get("type");
	if (!t) return null;
	return parsePageType(t);
}

export async function handlePublicPages(ctx: ApiContext): Promise<Response> {
	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	// GET /pages/by-path/* — resolve by URL path
	if (ctx.segments[1] === "by-path") {
		const pathParts = ctx.segments.slice(2);
		const path = parseContentPath(pathParts.length ? `/${pathParts.join("/")}` : "/");
		if (!path) {
			return jsonError("BAD_REQUEST", "Geçersiz path.", ctx.meta, 400);
		}
		const row = await ctx.env.DB.prepare(
			`SELECT ${PAGE_SELECT} FROM content_pages WHERE path = ? AND status = 'published'`,
		)
			.bind(path)
			.first<ContentPageRow>();
		if (!row) {
			return jsonError("NOT_FOUND", "Sayfa bulunamadı.", ctx.meta, 404);
		}
		return jsonOk(mapPublicPage(row), ctx.meta, CACHE);
	}

	const slug = parseSlug(ctx.segments[1]);
	const typeFilter = pageTypeFilter(ctx);

	if (ctx.segments.length === 1) {
		let sql = `SELECT ${PAGE_SELECT} FROM content_pages WHERE status = 'published'`;
		const binds: (string | number)[] = [];
		if (typeFilter) {
			sql += ` AND page_type = ?`;
			binds.push(typeFilter);
		}
		sql += ` ORDER BY sort_order ASC, published_at DESC`;
		const stmt = ctx.env.DB.prepare(sql);
		const { results } = await (binds.length ? stmt.bind(...binds) : stmt).all<ContentPageRow>();
		return jsonOk({ items: (results ?? []).map(mapPublicPage) }, ctx.meta, CACHE);
	}

	if (ctx.segments.length === 2 && slug) {
		const row = await ctx.env.DB.prepare(
			`SELECT ${PAGE_SELECT} FROM content_pages WHERE slug = ? AND status = 'published'`,
		)
			.bind(slug)
			.first<ContentPageRow>();
		if (!row) {
			return jsonError("NOT_FOUND", "Sayfa bulunamadı.", ctx.meta, 404);
		}
		return jsonOk(mapPublicPage(row), ctx.meta, CACHE);
	}

	return jsonError("NOT_FOUND", "Endpoint bulunamadı.", ctx.meta, 404);
}
