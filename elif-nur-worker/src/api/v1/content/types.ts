export type PageType = "page" | "blog" | "landing" | "legal";

export type ContentPageRow = {
	id: number;
	slug: string;
	path: string;
	title: string;
	excerpt: string | null;
	body_md: string;
	page_type: PageType;
	sort_order: number;
	meta_json: string;
	seo_title: string | null;
	seo_description: string | null;
	show_in_nav: number;
	nav_label: string | null;
	status: "draft" | "published";
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

export type ProjectRow = {
	id: number;
	slug: string;
	title: string;
	summary: string | null;
	body_md: string;
	link_url: string | null;
	sort_order: number;
	meta_json: string;
	seo_title: string | null;
	seo_description: string | null;
	status: "draft" | "published";
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

export type PublicPage = {
	slug: string;
	path: string;
	title: string;
	excerpt: string | null;
	bodyMd: string;
	pageType: PageType;
	sortOrder: number;
	meta: Record<string, unknown>;
	seo: { title: string | null; description: string | null };
	publishedAt: string | null;
	updatedAt: string;
};

export type AdminPage = PublicPage & {
	status: "draft" | "published";
	showInNav: boolean;
	navLabel: string | null;
	createdAt: string;
};

export type PublicProject = {
	slug: string;
	title: string;
	summary: string | null;
	bodyMd: string;
	linkUrl: string | null;
	sortOrder: number;
	meta: Record<string, unknown>;
	seo: { title: string | null; description: string | null };
	publishedAt: string | null;
	updatedAt: string;
};

export type AdminProject = PublicProject & {
	status: "draft" | "published";
	createdAt: string;
};

export function parseMetaJson(raw: string): Record<string, unknown> {
	try {
		const v = JSON.parse(raw) as unknown;
		return v && typeof v === "object" && !Array.isArray(v)
			? (v as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

export function mapPublicPage(row: ContentPageRow): PublicPage {
	return {
		slug: row.slug,
		path: row.path,
		title: row.title,
		excerpt: row.excerpt,
		bodyMd: row.body_md,
		pageType: row.page_type,
		sortOrder: row.sort_order,
		meta: parseMetaJson(row.meta_json),
		seo: { title: row.seo_title, description: row.seo_description },
		publishedAt: row.published_at,
		updatedAt: row.updated_at,
	};
}

export function mapAdminPage(row: ContentPageRow): AdminPage {
	return {
		...mapPublicPage(row),
		status: row.status,
		showInNav: row.show_in_nav === 1,
		navLabel: row.nav_label,
		createdAt: row.created_at,
	};
}

export function mapPublicProject(row: ProjectRow): PublicProject {
	return {
		slug: row.slug,
		title: row.title,
		summary: row.summary,
		bodyMd: row.body_md,
		linkUrl: row.link_url,
		sortOrder: row.sort_order,
		meta: parseMetaJson(row.meta_json),
		seo: { title: row.seo_title, description: row.seo_description },
		publishedAt: row.published_at,
		updatedAt: row.updated_at,
	};
}

export function mapAdminProject(row: ProjectRow): AdminProject {
	return {
		...mapPublicProject(row),
		status: row.status,
		createdAt: row.created_at,
	};
}

export const PAGE_SELECT = `id, slug, path, title, excerpt, body_md, page_type, sort_order, meta_json,
  seo_title, seo_description, show_in_nav, nav_label, status, published_at, created_at, updated_at`;

export const PROJECT_SELECT = `id, slug, title, summary, body_md, link_url, sort_order, meta_json,
  seo_title, seo_description, status, published_at, created_at, updated_at`;
