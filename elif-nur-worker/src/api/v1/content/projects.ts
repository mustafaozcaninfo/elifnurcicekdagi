import { jsonError, jsonOk } from "../../shared/response";
import { parseSlug } from "../../shared/validate";
import type { ApiContext } from "../context";
import { mapPublicProject, PROJECT_SELECT, type ProjectRow } from "./types";

const CACHE = { headers: { "cache-control": "public, max-age=60, s-maxage=300" } };

export async function handlePublicProjects(ctx: ApiContext): Promise<Response> {
	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	const slug = parseSlug(ctx.segments[1]);
	if (ctx.segments.length === 1) {
		const { results } = await ctx.env.DB.prepare(
			`SELECT ${PROJECT_SELECT}
       FROM content_projects WHERE status = 'published' ORDER BY sort_order ASC, published_at DESC`,
		).all<ProjectRow>();
		return jsonOk(
			{ items: (results ?? []).map(mapPublicProject) },
			ctx.meta,
			CACHE,
		);
	}

	if (ctx.segments.length === 2 && slug) {
		const row = await ctx.env.DB.prepare(
			`SELECT ${PROJECT_SELECT}
       FROM content_projects WHERE slug = ? AND status = 'published'`,
		)
			.bind(slug)
			.first<ProjectRow>();
		if (!row) {
			return jsonError("NOT_FOUND", "Proje bulunamadı.", ctx.meta, 404);
		}
		return jsonOk(mapPublicProject(row), ctx.meta, CACHE);
	}

	return jsonError("NOT_FOUND", "Endpoint bulunamadı.", ctx.meta, 404);
}
