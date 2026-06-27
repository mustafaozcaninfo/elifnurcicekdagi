import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeckPhase } from "./PilotHud";
import type { ActiveFlight } from "../hooks/useLiveFlights";
import { useIsMobile } from "../hooks/useIsMobile";
import type { TravelMapCity, TravelMapData } from "../data/travel-map";
import { buildGlobePoints } from "../utils/globe-points";
import {
	flyToCity,
	recenterOverview,
	resetOrbitTarget,
	type GlobeCameraApi,
	type GlobeControls,
} from "../utils/globe-camera";
import { buildGlobeArcs } from "../utils/hub-arcs";

const Globe = lazy(() => import("react-globe.gl"));

type CountryFeature = {
	type: "Feature";
	properties: { ISO_A2?: string; NAME?: string };
	geometry: unknown;
};

type Props = {
	data: TravelMapData;
	selectedId: string | null;
	onSelect: (city: TravelMapCity | null) => void;
	variant?: "deck" | "card";
	phase?: DeckPhase;
	primaryFlight?: ActiveFlight | null;
	focusCityId?: string | null;
	focusNonce?: number;
	recenterKey?: number;
	interactive?: boolean;
	gesturesEnabled?: boolean;
	layoutSyncKey?: number;
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function applyControls(
	ctrl: GlobeControls,
	mode: "intro" | "interactive" | "idle" | "locked",
	mobile: boolean,
) {
	ctrl.autoRotate = mode === "intro";
	ctrl.autoRotateSpeed = 0.12;
	ctrl.enableRotate = mode === "interactive" || mode === "intro";
	ctrl.enablePan = false;
	ctrl.zoomSpeed = mobile ? 0.85 : 1.1;
	ctrl.rotateSpeed = mobile ? 0.72 : 0.45;
	ctrl.minDistance = mobile ? 95 : 101;
	ctrl.maxDistance = mobile ? 360 : 480;

	if (mode === "interactive") {
		ctrl.autoRotate = false;
		ctrl.enableZoom = true;
	} else if (mode === "intro") {
		ctrl.enableZoom = false;
	} else if (mode === "locked") {
		ctrl.autoRotate = false;
		ctrl.enableZoom = false;
		ctrl.enableRotate = false;
	} else {
		ctrl.autoRotate = false;
		ctrl.enableZoom = false;
		ctrl.enableRotate = false;
	}
}

export default function TravelGlobe({
	data,
	selectedId,
	onSelect,
	variant = "card",
	phase = "reveal",
	primaryFlight = null,
	focusCityId = null,
	focusNonce = 0,
	recenterKey = 0,
	interactive = false,
	gesturesEnabled = true,
	layoutSyncKey = 0,
}: Props) {
	const isDeck = variant === "deck";
	const isMobile = useIsMobile();
	const containerRef = useRef<HTMLDivElement>(null);
	const globeRef = useRef<GlobeCameraApi | null>(null);
	const [dims, setDims] = useState({ w: 800, h: 600 });
	const [countries, setCountries] = useState<CountryFeature[]>([]);
	const [globeOpacity, setGlobeOpacity] = useState(isDeck ? 0 : 1);
	const [hoverId, setHoverId] = useState<string | null>(null);
	const [showPoints, setShowPoints] = useState(false);

	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;
	const globeReadyRef = useRef(false);
	const lastCameraPhaseRef = useRef<DeckPhase | null>(null);
	const exploreHandoffRef = useRef(false);

	const syncDimensions = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		const { width, height } = el.getBoundingClientRect();
		if (width > 0 && height > 0) {
			setDims({ w: width, h: height });
		}
	}, []);

	const applyInteractiveControls = useCallback(() => {
		const g = globeRef.current;
		if (!g || !interactive) return;
		const ctrl = g.controls();
		if (!ctrl) return;
		applyControls(ctrl, gesturesEnabled ? "interactive" : "locked", isMobile);
	}, [interactive, gesturesEnabled, isMobile]);

	const globeCenter =
		data.cities.find((c) => c.id === "doha") ??
		data.cities.find((c) => c.role === "home") ??
		data.cities[0];

	const introMode = isDeck && !interactive && (phase === "departure" || phase === "cruise");

	const visitedIso = useMemo(
		() => new Set(data.countries.filter((c) => c.visited).map((c) => c.iso2.toUpperCase())),
		[data.countries],
	);

	const colorByIso = useMemo(() => {
		const m = new Map<string, string>();
		for (const c of data.countries) {
			if (c.visited) m.set(c.iso2.toUpperCase(), c.color ?? "#C25B3F");
		}
		return m;
	}, [data.countries]);

	const cityById = useMemo(() => {
		const m = new Map<string, TravelMapCity>();
		for (const c of data.cities) m.set(c.id, c);
		return m;
	}, [data.cities]);

	const points = useMemo(
		() => buildGlobePoints(data.cities, selectedId, isMobile),
		[data.cities, selectedId, isMobile],
	);

	const arcs = useMemo(
		() =>
			buildGlobeArcs(data, cityById, {
				interactive,
				selectedId,
				introMode,
				mobile: isMobile,
			}),
		[data, cityById, interactive, selectedId, introMode, isMobile],
	);

	const visitedPolygons = useMemo(() => {
		const names = new Set(
			data.countries.filter((c) => c.visited).map((c) => c.name.toLowerCase()),
		);
		return countries.filter((f) => {
			const iso = (f.properties?.ISO_A2 ?? (f.properties as { iso_a2?: string }).iso_a2)
				?.toUpperCase();
			if (iso && iso !== "-99" && visitedIso.has(iso)) return true;
			const name = (f.properties?.NAME ?? (f.properties as { name?: string }).name ?? "")
				.toLowerCase();
			return names.has(name);
		});
	}, [countries, visitedIso, data.countries]);

	const labelCities = useMemo(() => {
		if (!interactive) return [];
		const ids = new Set<string>();
		if (selectedId) ids.add(selectedId);
		if (!isMobile && hoverId) ids.add(hoverId);
		for (const c of data.cities) {
			if (c.role === "home") ids.add(c.id);
		}
		return data.cities.filter((c) => ids.has(c.id));
	}, [data.cities, selectedId, hoverId, interactive, isMobile]);

	const onGlobeReady = useCallback(() => {
		const g = globeRef.current;
		if (!g) return;
		const ctrl = g.controls();
		if (ctrl) applyControls(ctrl, interactive ? "interactive" : "idle", isMobile);
		if (!globeReadyRef.current && globeCenter) {
			globeReadyRef.current = true;
			g.pointOfView(
				{ lat: globeCenter.lat, lng: globeCenter.lng, altitude: 2.4 },
				0,
			);
		}
	}, [globeCenter, interactive, isMobile]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => syncDimensions());
		ro.observe(el);
		syncDimensions();
		return () => ro.disconnect();
	}, [syncDimensions]);

	useEffect(() => {
		if (!isMobile || typeof window === "undefined") return;
		const vv = window.visualViewport;
		if (!vv) return;

		let timer: number | undefined;
		const onViewportChange = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(syncDimensions, 120);
		};

		vv.addEventListener("resize", onViewportChange);
		vv.addEventListener("scroll", onViewportChange);
		return () => {
			vv.removeEventListener("resize", onViewportChange);
			vv.removeEventListener("scroll", onViewportChange);
			window.clearTimeout(timer);
		};
	}, [isMobile, syncDimensions]);

	useEffect(() => {
		if (!layoutSyncKey) return;
		syncDimensions();
		const g = globeRef.current;
		if (!g || !interactive) return;
		resetOrbitTarget(g.controls());
		applyInteractiveControls();
	}, [layoutSyncKey, syncDimensions, interactive, applyInteractiveControls]);

	useEffect(() => {
		fetch(GEO_URL)
			.then((r) => r.json())
			.then((topo) =>
				import("topojson-client").then((topojson) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const geo = topojson.feature(topo as any, (topo as any).objects.countries) as {
						features: CountryFeature[];
					};
					setCountries(geo.features ?? []);
				}),
			)
			.catch(() => setCountries([]));
	}, []);

	useEffect(() => {
		if (!isDeck) return;
		if (["globe", "systems", "departure", "cruise", "reveal"].includes(phase)) {
			setGlobeOpacity(1);
		}
	}, [isDeck, phase]);

	useEffect(() => {
		const g = globeRef.current;
		if (!g) return;
		const ctrl = g.controls();
		if (!ctrl) return;

		if (interactive) {
			applyInteractiveControls();
			return;
		}

		if (!isDeck) {
			applyControls(ctrl, "idle", isMobile);
			return;
		}

		if (phase === "departure" || phase === "cruise" || phase === "globe") {
			applyControls(ctrl, "intro", isMobile);
		} else if (phase === "reveal") {
			applyControls(ctrl, "idle", isMobile);
			ctrl.autoRotate = false;
		} else {
			applyControls(ctrl, "idle", isMobile);
			ctrl.autoRotate = false;
		}
	}, [interactive, isDeck, phase, isMobile, applyInteractiveControls]);

	/** Intro camera — one animation per phase, never re-triggered on flight ticks. */
	useEffect(() => {
		if (interactive || !isDeck || !globeRef.current || !globeCenter) return;
		if (lastCameraPhaseRef.current === phase) return;

		lastCameraPhaseRef.current = phase;
		const g = globeRef.current;
		const overviewAlt = isMobile ? 2.2 : 2.05;

		switch (phase) {
			case "boot":
			case "systems":
				g.pointOfView({ lat: globeCenter.lat, lng: globeCenter.lng, altitude: 3.1 }, 0);
				break;
			case "globe":
				g.pointOfView({ lat: globeCenter.lat, lng: globeCenter.lng, altitude: 2.35 }, 2800);
				break;
			case "departure":
				g.pointOfView(
					{ lat: globeCenter.lat + 8, lng: globeCenter.lng + 12, altitude: 1.78 },
					2400,
				);
				break;
			case "cruise":
				g.pointOfView(
					{ lat: globeCenter.lat, lng: globeCenter.lng, altitude: 1.88 },
					2600,
				);
				break;
			case "reveal":
				g.pointOfView(
					{ lat: globeCenter.lat, lng: globeCenter.lng, altitude: overviewAlt },
					2200,
				);
				break;
		}
	}, [interactive, isDeck, phase, globeCenter, isMobile]);

	/** Explore handoff — single settle, no second camera punch. */
	useEffect(() => {
		if (!interactive || exploreHandoffRef.current || !globeRef.current || !globeCenter) {
			return;
		}
		exploreHandoffRef.current = true;

		const g = globeRef.current;
		const ctrl = g.controls();
		if (ctrl) applyControls(ctrl, "interactive", isMobile);

		const alreadyAtReveal = lastCameraPhaseRef.current === "reveal";
		if (!alreadyAtReveal) {
			recenterOverview(g, globeCenter.lat, globeCenter.lng, isMobile, 600);
		}
	}, [interactive, globeCenter, isMobile]);

	useEffect(() => {
		if (!focusCityId || !globeRef.current || !interactive) return;
		const city = data.cities.find((c) => c.id === focusCityId);
		if (!city) return;
		flyToCity(
			globeRef.current,
			city.lat,
			city.lng,
			isMobile ? 1.82 : 1.55,
			900,
		);
	}, [focusCityId, focusNonce, data.cities, isMobile, interactive]);

	useEffect(() => {
		if (!recenterKey || !globeRef.current || !interactive || !globeCenter) return;
		recenterOverview(globeRef.current, globeCenter.lat, globeCenter.lng, isMobile);
	}, [recenterKey, interactive, globeCenter, isMobile]);

	useEffect(() => {
		if (!interactive) {
			setShowPoints(false);
			return;
		}
		const t = window.setTimeout(() => setShowPoints(true), 400);
		return () => clearTimeout(t);
	}, [interactive]);

	const shellClass = isDeck
		? `deck-globe-shell relative h-full w-full overflow-hidden bg-[#030201] ${interactive && gesturesEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${interactive && !gesturesEnabled ? "deck-globe-shell--locked" : ""}`
		: "relative h-[min(72vh,640px)] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-gallery";

	const polygonAlt = isMobile ? 0.008 : 0.014;

	return (
		<div ref={containerRef} className={shellClass}>
			<div
				className="h-full w-full transition-opacity duration-[2200ms] ease-out"
				style={{ opacity: globeOpacity }}
			>
				<Suspense
					fallback={
						<div className="flex h-full items-center justify-center font-kanit text-sm text-warm-muted">
							Loading atlas…
						</div>
					}
				>
					<Globe
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						ref={globeRef as any}
						onGlobeReady={onGlobeReady}
						width={dims.w}
						height={dims.h}
						backgroundColor="rgba(3,2,1,0)"
						globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
						bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
						atmosphereColor={data.globe?.atmosphereColor ?? "#C25B3F"}
						atmosphereAltitude={isDeck ? (isMobile ? 0.22 : 0.28) : 0.2}
						polygonsData={visitedPolygons}
						polygonCapColor={(f: object) => {
							const iso = (f as CountryFeature).properties?.ISO_A2?.toUpperCase() ?? "";
							return colorByIso.get(iso) ?? "rgba(194,91,63,0.55)";
						}}
						polygonSideColor={() => "rgba(194, 91, 63, 0.08)"}
						polygonStrokeColor={() => "rgba(245, 237, 228, 0.12)"}
						polygonAltitude={polygonAlt}
						arcsData={arcs}
						arcStartLat={(d: object) => (d as { startLat: number }).startLat}
						arcStartLng={(d: object) => (d as { startLng: number }).startLng}
						arcEndLat={(d: object) => (d as { endLat: number }).endLat}
						arcEndLng={(d: object) => (d as { endLng: number }).endLng}
						arcColor={(d: object) => (d as { color: string[] }).color}
						arcAltitude={(d: object) => (d as { altitude: number }).altitude}
						arcStroke={(d: object) => (d as { stroke: number }).stroke}
						arcDashLength={isMobile ? 1 : 0.42}
						arcDashGap={isMobile ? 0 : 0.14}
						arcDashAnimateTime={(d: object) => (d as { dashAnimateTime: number }).dashAnimateTime}
						pointsData={showPoints ? points : []}
						pointLat={(d: object) => (d as TravelMapCity).lat}
						pointLng={(d: object) => (d as TravelMapCity).lng}
						pointAltitude={0.012}
						pointRadius={(d: object) => (d as { size?: number }).size ?? 0.1}
						pointColor={(d: object) =>
							(d as { color?: string }).color ?? "rgba(245,237,228,0.7)"
						}
						onPointClick={(p: object) => {
							if (!interactive) return;
							onSelect(p as TravelMapCity);
						}}
						onPointHover={
							isMobile
								? undefined
								: (p: object | null) => {
										if (!interactive) return;
										const city = p as TravelMapCity | null;
										setHoverId(city?.id ?? null);
										if (containerRef.current) {
											containerRef.current.style.cursor = city ? "pointer" : "grab";
										}
									}
						}
						labelsData={labelCities}
						labelLat={(d: object) => (d as TravelMapCity).lat}
						labelLng={(d: object) => (d as TravelMapCity).lng}
						labelText={(d: object) =>
							(d as TravelMapCity).airportCode ?? (d as TravelMapCity).name
						}
						labelSize={isMobile ? 1.05 : 1.2}
						labelColor={() => "rgba(245, 237, 228, 0.92)"}
						labelDotRadius={0}
						labelAltitude={0.038}
					/>
				</Suspense>
			</div>
			{!isDeck && (
				<div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/5" />
			)}
			{isDeck && !interactive && (
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_32%,rgba(3,2,1,0.5)_100%)]" />
			)}
			{interactive && !isMobile && (
				<div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden rounded-xl border border-white/8 bg-black/40 px-3 py-2 backdrop-blur-sm md:block">
					<p className="font-ui text-[0.58rem] font-medium text-warm-muted">Waypoints</p>
					<ul className="mt-1.5 space-y-1 font-ui text-[0.58rem] text-warm-light/75">
						<li className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-[#C25B3F]" /> Origin
						</li>
						<li className="flex items-center gap-1.5">
							<span className="text-[0.55rem] text-warm-light">♥</span> With husband
						</li>
						<li className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-[#85B8CB]" /> Solo
						</li>
					</ul>
				</div>
			)}
		</div>
	);
}
