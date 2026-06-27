const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseSlug(raw: string | undefined): string | null {
	if (!raw) return null;
	const slug = raw.trim().toLowerCase().slice(0, 80);
	return SLUG_RE.test(slug) ? slug : null;
}

export function trimString(
	value: unknown,
	max: number,
): string | null {
	if (typeof value !== "string") return null;
	const t = value.trim();
	if (!t || t.length > max) return null;
	return t;
}

export function optionalString(value: unknown, max: number): string | null {
	if (value == null || value === "") return null;
	return trimString(value, max);
}

export type ContentStatus = "draft" | "published";

export type PageType = "page" | "blog" | "landing" | "legal";

const PAGE_TYPES = new Set<PageType>(["page", "blog", "landing", "legal"]);

const PATH_RE = /^\/[a-z0-9/-]*$/;

export function parseStatus(value: unknown): ContentStatus | null {
	if (value === "draft" || value === "published") return value;
	return null;
}

export function parsePageType(value: unknown): PageType | null {
	if (typeof value === "string" && PAGE_TYPES.has(value as PageType)) {
		return value as PageType;
	}
	return null;
}

/** URL path e.g. /hakkimda or /blog/yazi-1 */
export function parseContentPath(raw: string | undefined): string | null {
	if (!raw) return null;
	let path = raw.trim();
	if (!path.startsWith("/")) path = `/${path}`;
	path = path.replace(/\/+/g, "/").toLowerCase();
	if (path.length > 200 || !PATH_RE.test(path) || path.includes("..")) return null;
	if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
	return path;
}

export function pathFromSlug(slug: string): string {
	return slug === "home" ? "/" : `/${slug}`;
}

export function parseMetaJsonInput(value: unknown): string | null {
	if (value == null) return "{}";
	if (typeof value !== "object" || Array.isArray(value)) return null;
	const json = JSON.stringify(value);
	if (json.length > 65_536) return null;
	return json;
}

export function parseBooleanFlag(value: unknown): boolean | null {
	if (value === true || value === 1 || value === "1" || value === "true") return true;
	if (value === false || value === 0 || value === "0" || value === "false") return false;
	return null;
}

export function parseLimit(value: string | null, fallback = 50, max = 100): number {
	if (!value) return fallback;
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.max(1, Math.min(max, Math.floor(n)));
}
