import { jsonError, jsonOk } from "../../shared/response";
import { parseContentPath } from "../../shared/validate";
import type { ApiContext } from "../context";
import { ContentPageRow, mapPublicPage, PAGE_SELECT } from "./types";

/** GET /api/v1/resolve?path=/hakkimda — path ile içerik çözümleme */
export async function handleResolve(ctx: ApiContext): Promise<Response> {
	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	const path = parseContentPath(ctx.query.get("path") ?? undefined);
	if (!path) {
		return jsonError("BAD_REQUEST", "path parametresi zorunludur.", ctx.meta, 400);
	}

	const row = await ctx.env.DB.prepare(
		`SELECT ${PAGE_SELECT} FROM content_pages WHERE path = ? AND status = 'published'`,
	)
		.bind(path)
		.first<ContentPageRow>();

	if (!row) {
		return jsonError("NOT_FOUND", "Bu path için yayınlanmış içerik yok.", ctx.meta, 404);
	}

	return jsonOk(
		{
			kind: "page",
			page: mapPublicPage(row),
		},
		ctx.meta,
		{ headers: { "cache-control": "public, max-age=60, s-maxage=300" } },
	);
}
