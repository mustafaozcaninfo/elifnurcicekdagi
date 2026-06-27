import { jsonError, jsonOk } from "../../shared/response";
import type { ApiContext } from "../context";
import {
	ContentPageRow,
	mapPublicPage,
	mapPublicProject,
	PAGE_SELECT,
	PROJECT_SELECT,
	ProjectRow,
	parseMetaJson,
} from "./types";
import { loadTravelMap } from "./travel-map";

const PUBLIC_SETTING_PREFIXES = ["site.", "landing.", "navigation.", "public."];

function isPublicSettingKey(key: string): boolean {
	return PUBLIC_SETTING_PREFIXES.some((p) => key.startsWith(p));
}

/** GET /api/v1/site — tek istekte tüm public site verisi (SPA + SSR için). */
export async function handlePublicSite(ctx: ApiContext): Promise<Response> {
	if (ctx.request.method !== "GET") {
		return jsonError("METHOD_NOT_ALLOWED", "Yalnızca GET.", ctx.meta, 405);
	}

	const [pagesRes, projectsRes, settingsRes, navRes] = await Promise.all([
		ctx.env.DB.prepare(
			`SELECT ${PAGE_SELECT} FROM content_pages
       WHERE status = 'published' ORDER BY sort_order ASC, published_at DESC`,
		).all<ContentPageRow>(),
		ctx.env.DB.prepare(
			`SELECT ${PROJECT_SELECT} FROM content_projects
       WHERE status = 'published' ORDER BY sort_order ASC`,
		).all<ProjectRow>(),
		ctx.env.DB.prepare("SELECT key, value_json FROM site_settings").all<{
			key: string;
			value_json: string;
		}>(),
		ctx.env.DB.prepare(
			`SELECT slug, path, title, nav_label, page_type, sort_order
       FROM content_pages
       WHERE status = 'published' AND show_in_nav = 1
       ORDER BY sort_order ASC`,
		).all<{
			slug: string;
			path: string;
			title: string;
			nav_label: string | null;
			page_type: string;
			sort_order: number;
		}>(),
	]);

	const settings: Record<string, unknown> = {};
	for (const row of settingsRes.results ?? []) {
		if (isPublicSettingKey(row.key)) {
			settings[row.key] = parseMetaJson(row.value_json);
		}
	}

	const navigation = (navRes.results ?? []).map((n) => ({
		label: n.nav_label ?? n.title,
		path: n.path,
		slug: n.slug,
		pageType: n.page_type,
		sortOrder: n.sort_order,
	}));

	const travelMap = await loadTravelMap(ctx.env.DB);

	return jsonOk(
		{
			pages: (pagesRes.results ?? []).map(mapPublicPage),
			projects: (projectsRes.results ?? []).map(mapPublicProject),
			blog: (pagesRes.results ?? [])
				.filter((p) => p.page_type === "blog")
				.map(mapPublicPage),
			navigation,
			settings,
			travelMap,
			generatedAt: new Date().toISOString(),
		},
		ctx.meta,
		{ headers: { "cache-control": "public, max-age=30, s-maxage=120" } },
	);
}
