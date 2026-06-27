import type { TravelMapCity, TravelMapData } from "../data/travel-map";

export type GlobeArc = {
	id: string;
	startLat: number;
	startLng: number;
	endLat: number;
	endLng: number;
	color: [string, string];
	stroke: number;
	altitude: number;
	dashAnimateTime: number;
};

const ARC_GOLD = "#D4A017";
const ARC_MUTED: [string, string] = ["rgba(212,160,23,0.14)", "rgba(194,91,63,0.05)"];
const ARC_INTRO: [string, string] = ["rgba(212,160,23,0.55)", "rgba(194,91,63,0.12)"];
const ARC_ACTIVE: [string, string] = ["rgba(212,160,23,0.95)", "rgba(240,193,75,0.35)"];

function routeTouchesSelection(
	route: { from: string; to: string },
	selectedId: string | null,
	routeOriginId: string,
): boolean {
	if (!selectedId) return false;
	if (selectedId === routeOriginId) {
		return route.from === "istanbul" && route.to === routeOriginId;
	}
	return route.from === selectedId || route.to === selectedId;
}

export function buildGlobeArcs(
	data: TravelMapData,
	cityById: Map<string, TravelMapCity>,
	opts: {
		interactive: boolean;
		selectedId: string | null;
		introMode: boolean;
		mobile?: boolean;
	},
): GlobeArc[] {
	const routes = data.routes ?? [];
	if (!routes.length) return [];

	const routeOriginId = "doha";
	const arcColor = data.globe?.arcColor ?? ARC_GOLD;

	let mapped = routes
		.map((r) => {
			const from = cityById.get(r.from);
			const to = cityById.get(r.to);
			if (!from || !to) return null;

			const highlighted = routeTouchesSelection(r, opts.selectedId, routeOriginId);
			const isOriginLink = r.from === "istanbul" && r.to === routeOriginId;

			let color: [string, string];
			let stroke: number;
			let altitude: number;
			let dashAnimateTime: number;

			if (highlighted) {
				color = ARC_ACTIVE;
				stroke = 0.85;
				altitude = 0.32;
				dashAnimateTime = 1400;
			} else if (opts.introMode) {
				color = [arcColor, "rgba(194,91,63,0.1)"];
				stroke = isOriginLink ? 0.65 : 0.45;
				altitude = 0.28;
				dashAnimateTime = opts.mobile ? 0 : 2200;
			} else if (opts.interactive) {
				color = isOriginLink
					? ["rgba(194,91,63,0.28)", "rgba(194,91,63,0.08)"]
					: ARC_MUTED;
				stroke = isOriginLink ? 0.35 : 0.22;
				altitude = 0.22;
				dashAnimateTime = opts.mobile ? 0 : 4800;
			} else {
				color = ARC_INTRO;
				stroke = 0.4;
				altitude = 0.26;
				dashAnimateTime = 2600;
			}

			return {
				id: `${r.from}-${r.to}`,
				startLat: from.lat,
				startLng: from.lng,
				endLat: to.lat,
				endLng: to.lng,
				color,
				stroke,
				altitude,
				dashAnimateTime,
			};
		})
		.filter((a): a is GlobeArc => a !== null);

	// Mobile interactive: only origin link + selected route — avoids visual noise + GPU load
	if (opts.mobile && opts.interactive && !opts.introMode) {
		if (!opts.selectedId) {
			mapped = mapped.filter((a) => a.id === "istanbul-doha");
		} else {
			mapped = mapped.filter(
				(a) =>
					a.id === "istanbul-doha" ||
					a.id.includes(opts.selectedId!) ||
					a.id.startsWith(`doha-${opts.selectedId}`) ||
					a.id.endsWith(`-${opts.selectedId}`),
			);
		}
	}

	return mapped;
}

export function buildHubPulseRings(hub: TravelMapCity | undefined) {
	if (!hub) return [];
	return [
		{ lat: hub.lat, lng: hub.lng, maxR: 2.8, propagationSpeed: 2.2, repeatPeriod: 1400 },
		{ lat: hub.lat, lng: hub.lng, maxR: 4.2, propagationSpeed: 1.4, repeatPeriod: 2200 },
	];
}

/** Flagship long-hauls for cinematic intro departures from DOH. */
export const INTRO_FLAGSHIP_DEST_IDS = [
	"london",
	"new-york",
	"tokyo",
	"sydney",
	"paris",
] as const;
