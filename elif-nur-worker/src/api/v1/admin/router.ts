import { jsonError } from "../../shared/response";
import type { ApiContext } from "../context";
import { handleAdminAudit } from "./audit";
import { handleAdminAuth } from "./auth";
import { handleAdminPages } from "./pages";
import { handleAdminProjects } from "./projects";
import { handleAdminSettings } from "./settings";
import { handleAdminTravelMap } from "./travel-map";

/** segments: admin, resource, ... */
export async function handleAdminRouter(ctx: ApiContext): Promise<Response> {
	if (ctx.segments[1] === "auth") {
		return handleAdminAuth(ctx);
	}

	const resource = ctx.segments[1];

	switch (resource) {
		case "pages":
			return handleAdminPages(ctx);
		case "projects":
			return handleAdminProjects(ctx);
		case "settings":
			return handleAdminSettings(ctx);
		case "audit":
			return handleAdminAudit(ctx);
		case "travel-map":
			return handleAdminTravelMap(ctx);
		default:
			return jsonError("NOT_FOUND", "Admin endpoint bulunamadı.", ctx.meta, 404);
	}
}
