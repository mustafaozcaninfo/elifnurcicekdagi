import { applyApiCors, handleCorsPreflight } from "../shared/cors";
import { consumeRateLimit } from "../shared/rate-limit";
import { jsonError } from "../shared/response";
import { handleAdminRouter } from "./admin/router";
import { createContext } from "./context";
import { handlePublicPages } from "./content/pages";
import { handlePublicProjects } from "./content/projects";
import { handleResolve } from "./content/resolve";
import { handlePublicSite } from "./content/site";
import { handleTravelMap } from "./content/travel-map";
import { handleMeta } from "./meta";

const PUBLIC_READ_LIMIT = 120;
const PUBLIC_READ_WINDOW = 60;
const ADMIN_WRITE_LIMIT = 60;
const ADMIN_WRITE_WINDOW = 60;

export async function handleApiV1(request: Request, env: Env): Promise<Response> {
	const preflight = handleCorsPreflight(request);
	if (preflight) return preflight;

	const ctx = createContext(request, env);
	const { segments } = ctx;

	const isAdmin = segments[0] === "admin";
	const rateBucket = isAdmin ? "v1-admin" : "v1-read";
	const rateMax = isAdmin ? ADMIN_WRITE_LIMIT : PUBLIC_READ_LIMIT;
	const allowed = await consumeRateLimit(
		env.RATE_LIMIT,
		ctx.ip,
		rateBucket,
		rateMax,
		isAdmin ? ADMIN_WRITE_WINDOW : PUBLIC_READ_WINDOW,
	);
	if (!allowed) {
		return applyApiCors(
			request,
			jsonError("RATE_LIMITED", "Çok fazla istek.", ctx.meta, 429),
		);
	}

	let response: Response;

	if (segments.length === 0) {
		response = handleMeta(ctx);
	} else if (segments[0] === "site") {
		response = await handlePublicSite(ctx);
	} else if (segments[0] === "travel" && segments[1] === "map") {
		response = await handleTravelMap(ctx);
	} else if (segments[0] === "resolve") {
		response = await handleResolve(ctx);
	} else if (segments[0] === "pages") {
		response = await handlePublicPages(ctx);
	} else if (segments[0] === "projects") {
		response = await handlePublicProjects(ctx);
	} else if (segments[0] === "admin") {
		response = await handleAdminRouter(ctx);
	} else {
		response = jsonError("NOT_FOUND", "Endpoint bulunamadı.", ctx.meta, 404);
	}

	return applyApiCors(request, response);
}
