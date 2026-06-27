import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { TravelMapCity, TravelMapData } from "../data/travel-map";

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
};

const GEO_URL =
	"https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function TravelGlobe({ data, selectedId, onSelect }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const globeRef = useRef<{
		pointOfView: (pov: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
		controls: () => { autoRotate: boolean; autoRotateSpeed: number };
	} | null>(null);
	const [dims, setDims] = useState({ w: 800, h: 600 });
	const [countries, setCountries] = useState<CountryFeature[]>([]);

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
		() =>
			data.cities.map((c) => ({
				...c,
				size: c.id === selectedId ? 0.55 : c.role === "home" ? 0.45 : 0.32,
				color: c.id === selectedId ? "#D4A017" : data.globe?.pointColor ?? "#F5EDE4",
			})),
		[data.cities, data.globe?.pointColor, selectedId],
	);

	const arcs = useMemo(() => {
		if (!data.routes?.length) return [];
		return data.routes
			.map((r) => {
				const from = cityById.get(r.from);
				const to = cityById.get(r.to);
				if (!from || !to) return null;
				return {
					startLat: from.lat,
					startLng: from.lng,
					endLat: to.lat,
					endLng: to.lng,
					color: [data.globe?.arcColor ?? "#D4A017", "rgba(194,91,63,0.15)"],
					label: r.label,
				};
			})
			.filter(Boolean);
	}, [data.routes, cityById, data.globe?.arcColor]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setDims({ w: width, h: height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		fetch(GEO_URL)
			.then((r) => r.json())
			.then((topo) => import("topojson-client").then((topojson) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const geo = topojson.feature(topo as any, (topo as any).objects.countries) as {
					features: CountryFeature[];
				};
				setCountries(geo.features ?? []);
			}))
			.catch(() => setCountries([]));
	}, []);

	useEffect(() => {
		const hub = data.homeHub ?? data.cities[0];
		if (!hub || !globeRef.current) return;
		const t = setTimeout(() => {
			globeRef.current?.pointOfView({ lat: hub.lat, lng: hub.lng, altitude: 1.8 }, 1200);
			const ctrl = globeRef.current?.controls();
			if (ctrl) {
				ctrl.autoRotate = true;
				ctrl.autoRotateSpeed = data.globe?.autoRotateSpeed ?? 0.35;
			}
		}, 400);
		return () => clearTimeout(t);
	}, [data.homeHub, data.cities, data.globe?.autoRotateSpeed]);

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

	return (
		<div
			ref={containerRef}
			className="relative h-[min(72vh,640px)] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-gallery"
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
					width={dims.w}
					height={dims.h}
					backgroundColor="rgba(15,10,5,0)"
					globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
					bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
					atmosphereColor={data.globe?.atmosphereColor ?? "#C25B3F"}
					atmosphereAltitude={0.2}
					polygonsData={visitedPolygons}
					polygonCapColor={(f: object) => {
						const iso = (f as CountryFeature).properties?.ISO_A2?.toUpperCase() ?? "";
						return colorByIso.get(iso) ?? "rgba(194,91,63,0.55)";
					}}
					polygonSideColor={() => "rgba(194, 91, 63, 0.08)"}
					polygonStrokeColor={() => "rgba(245, 237, 228, 0.12)"}
					polygonAltitude={0.012}
					pointsData={points}
					pointLat={(d: object) => (d as TravelMapCity).lat}
					pointLng={(d: object) => (d as TravelMapCity).lng}
					pointAltitude={0.02}
					pointRadius={(d: object) => (d as { size: number }).size}
					pointColor={(d: object) => (d as { color: string }).color}
					onPointClick={(p: object) => onSelect(p as TravelMapCity)}
					arcsData={arcs}
					arcStartLat={(d: object) => (d as { startLat: number }).startLat}
					arcStartLng={(d: object) => (d as { startLng: number }).startLng}
					arcEndLat={(d: object) => (d as { endLat: number }).endLat}
					arcEndLng={(d: object) => (d as { endLng: number }).endLng}
					arcColor={(d: object) => (d as { color: string[] }).color}
					arcAltitude={0.25}
					arcStroke={0.5}
					arcDashLength={0.4}
					arcDashGap={0.2}
					arcDashAnimateTime={2400}
					labelsData={data.cities}
					labelLat={(d: object) => (d as TravelMapCity).lat}
					labelLng={(d: object) => (d as TravelMapCity).lng}
					labelText={(d: object) => (d as TravelMapCity).name}
					labelSize={1.2}
					labelColor={() => "rgba(245, 237, 228, 0.85)"}
					labelDotRadius={0.2}
					labelAltitude={0.025}
				/>
			</Suspense>
			<div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/5" />
		</div>
	);
}
