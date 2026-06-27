import { useEffect, useMemo, useRef, useState } from "react";
import type { TravelMapCity, TravelMapData } from "../data/travel-map";
import { INTRO_FLAGSHIP_DEST_IDS } from "../utils/hub-arcs";
import { flightAltitudeFt, interpolateFlight } from "../utils/geo";

export type ActiveFlight = {
	id: string;
	label: string;
	fromName: string;
	toName: string;
	startLat: number;
	startLng: number;
	endLat: number;
	endLng: number;
	lat: number;
	lng: number;
	bearing: number;
	progress: number;
	altitudeFt: number;
	callsign: string;
	aircraft: string;
};

const FLIGHT_MS = 11_500;
const STAGGER_MS = 3_200;
const CALLSIGNS = ["ENF·001", "ENF·384", "ENF·772", "ENF·118", "ENF·820"];
const AIRCRAFT = "B777";

type RouteJob = {
	id: string;
	label: string;
	from: TravelMapCity;
	to: TravelMapCity;
	callsign: string;
};

function buildIntroJobs(data: TravelMapData): RouteJob[] {
	const cityById = new Map(data.cities.map((c) => [c.id, c]));
	const base = cityById.get("doha") ?? data.cities.find((c) => c.role === "home");

	if (!base) return [];

	const jobs: RouteJob[] = [];
	for (const [i, destId] of INTRO_FLAGSHIP_DEST_IDS.entries()) {
		const dest = cityById.get(destId);
		if (!dest) continue;
		const code = dest.airportCode ?? dest.name.slice(0, 3).toUpperCase();
		jobs.push({
			id: `${base.id}-${dest.id}`,
			label: `${base.airportCode ?? "DOH"} → ${code}`,
			from: base,
			to: dest,
			callsign: CALLSIGNS[i % CALLSIGNS.length],
		});
	}

	if (jobs.length >= 2) return jobs;

	const fallback = data.cities.find((c) => c.id !== base.id);
	if (fallback) {
		jobs.push({
			id: `${base.id}-${fallback.id}`,
			label: `${base.name} → ${fallback.name}`,
			from: base,
			to: fallback,
			callsign: CALLSIGNS[0],
		});
	}

	return jobs;
}

export function useLiveFlights(data: TravelMapData, enabled: boolean) {
	const jobs = useMemo(() => buildIntroJobs(data), [data]);
	const [flights, setFlights] = useState<ActiveFlight[]>([]);
	const rafRef = useRef(0);

	useEffect(() => {
		if (!enabled || !jobs.length) {
			setFlights([]);
			return;
		}

		type Slot = {
			job: RouteJob;
			startedAt: number;
			slot: number;
		};

		const slots: Slot[] = jobs.slice(0, 4).map((job, i) => ({
			job,
			startedAt: performance.now() + i * STAGGER_MS,
			slot: i,
		}));

		let lastPublish = 0;
		const tick = (now: number) => {
			const active: ActiveFlight[] = [];

			for (const slot of slots) {
				const elapsed = now - slot.startedAt;
				if (elapsed < 0) continue;

				const cycle = Math.floor(elapsed / FLIGHT_MS);
				const job = jobs[(slot.slot + cycle) % jobs.length];
				const localT = (elapsed % FLIGHT_MS) / FLIGHT_MS;
				const pos = interpolateFlight(
					job.from.lat,
					job.from.lng,
					job.to.lat,
					job.to.lng,
					localT,
				);

				active.push({
					id: `${job.id}-${cycle}`,
					label: job.label,
					fromName: job.from.name,
					toName: job.to.name,
					startLat: job.from.lat,
					startLng: job.from.lng,
					endLat: job.to.lat,
					endLng: job.to.lng,
					lat: pos.lat,
					lng: pos.lng,
					bearing: pos.bearing,
					progress: localT,
					altitudeFt: flightAltitudeFt(localT),
					callsign: job.callsign,
					aircraft: AIRCRAFT,
				});
			}

			if (now - lastPublish >= 120) {
				setFlights(active);
				lastPublish = now;
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [enabled, jobs]);

	const primary = flights[0] ?? null;

	return { flights, primary };
}
