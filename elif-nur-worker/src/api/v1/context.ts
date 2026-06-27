import type { ApiMeta } from "../shared/response";

export type ApiContext = {
	request: Request;
	env: Env;
	meta: ApiMeta;
	ip: string;
	pathname: string;
	segments: string[];
	query: URLSearchParams;
};

export function createContext(request: Request, env: Env): ApiContext {
	const url = new URL(request.url);
	const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
	// api, v1, ...
	const segments = parts.slice(2);
	return {
		request,
		env,
		meta: { version: "1", requestId: crypto.randomUUID() },
		ip:
			request.headers.get("CF-Connecting-IP") ??
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			"unknown",
		pathname: url.pathname,
		segments,
		query: url.searchParams,
	};
}
