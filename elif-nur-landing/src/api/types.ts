export type ApiEnvelope<T> = {
	ok: boolean;
	data: T;
	meta: { requestId: string };
};

export type SiteProject = {
	slug: string;
	title: string;
	summary: string | null;
	bodyMd: string;
	linkUrl: string | null;
	sortOrder: number;
	meta: Record<string, unknown>;
	seo: { title: string | null; description: string | null };
};

export type SitePage = {
	slug: string;
	path: string;
	title: string;
	excerpt: string | null;
	bodyMd: string;
	pageType: string;
	navLabel?: string | null;
};

export type NavItem = {
	label: string;
	path: string;
	slug: string;
	pageType: string;
};

export type SiteBundle = {
	pages: SitePage[];
	projects: SiteProject[];
	blog: SitePage[];
	navigation: NavItem[];
	settings: Record<string, unknown>;
	travelMap?: unknown;
};

export type AdminPage = {
	slug: string;
	path: string;
	title: string;
	excerpt: string | null;
	bodyMd: string;
	pageType: string;
	sortOrder: number;
	meta: Record<string, unknown>;
	seo: { title: string | null; description: string | null };
	status: "draft" | "published";
	showInNav: boolean;
	navLabel: string | null;
	publishedAt: string | null;
	updatedAt: string;
};

export type AdminProject = SiteProject & {
	status: "draft" | "published";
};

export type SettingItem = {
	key: string;
	value: Record<string, unknown>;
	updatedAt: string;
};
