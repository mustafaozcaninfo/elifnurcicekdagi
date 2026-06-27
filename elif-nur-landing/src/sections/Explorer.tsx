import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompanionFilterBar from "../components/CompanionFilter";
import type { DeckPhase } from "../components/PilotHud";
import DestinationPanel from "../components/DestinationPanel";
import ExploreChrome from "../components/ExploreChrome";
import GlobeRecenterButton from "../components/GlobeRecenterButton";
import JourneyLedger from "../components/JourneyLedger";
import Navbar from "../components/Navbar";
import PilotHud from "../components/PilotHud";
import TravelGlobe from "../components/TravelGlobe";
import WaypointRail from "../components/WaypointRail";
import type { TravelMapCity } from "../data/travel-map";
import { useCompanionFilter } from "../hooks/useCompanionFilter";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLiveFlights } from "../hooks/useLiveFlights";
import { useSite } from "../hooks/useSite";
import { useStableAppHeight } from "../hooks/useStableAppHeight";
import { filterTravelMapByCompanion } from "../utils/companion-filter";

/** ~10s cinematic intro — Boeing 777 departure from Doha. Skippable anytime. */
const PHASE_TIMELINE: { phase: DeckPhase; at: number }[] = [
	{ phase: "boot", at: 0 },
	{ phase: "systems", at: 1200 },
	{ phase: "globe", at: 2800 },
	{ phase: "departure", at: 4800 },
	{ phase: "cruise", at: 7200 },
	{ phase: "reveal", at: 10_000 },
];

export default function Explorer() {
	const { travelMap, branding } = useSite();
	const { companion, setCompanion } = useCompanionFilter();
	const mapView = useMemo(
		() => filterTravelMapByCompanion(travelMap, companion),
		[travelMap, companion],
	);
	const isMobile = useIsMobile();
	useStableAppHeight(isMobile);
	const [phase, setPhase] = useState<DeckPhase>("boot");
	const [exploreReady, setExploreReady] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [focusCityId, setFocusCityId] = useState<string | null>(null);
	const [focusNonce, setFocusNonce] = useState(0);
	const [recenterKey, setRecenterKey] = useState(0);
	const [globeSyncKey, setGlobeSyncKey] = useState(0);
	const [railOpen, setRailOpen] = useState(false);
	const syncTimerRef = useRef<number | undefined>(undefined);

	const interactive = exploreReady;
	const flightsEnabled = phase === "departure" || phase === "cruise";
	const { flights, primary } = useLiveFlights(mapView, flightsEnabled);
	const mapGesturesEnabled = !panelOpen && !(isMobile && railOpen);

	const cityById = new Map(mapView.cities.map((c) => [c.id, c]));
	const selected = selectedId ? (cityById.get(selectedId) ?? null) : null;

	const siblingCities = selected
		? mapView.cities
				.filter((c) => c.country === selected.country)
				.sort((a, b) => a.name.localeCompare(b.name))
		: [];

	useEffect(() => {
		if (!selectedId) return;
		if (!mapView.cities.some((c) => c.id === selectedId)) {
			setSelectedId(null);
			setPanelOpen(false);
			setFocusCityId(null);
		}
	}, [selectedId, mapView.cities]);

	const selectCity = useCallback((city: TravelMapCity) => {
		setSelectedId(city.id);
		setFocusCityId(city.id);
		setFocusNonce((n) => n + 1);
		setPanelOpen(true);
	}, []);

	const handleRailOpenChange = useCallback(
		(open: boolean) => {
			setRailOpen(open);
			if (!open && isMobile) {
				window.clearTimeout(syncTimerRef.current);
				syncTimerRef.current = window.setTimeout(() => {
					setGlobeSyncKey((k) => k + 1);
				}, 420);
			}
		},
		[isMobile],
	);

	const handlePanelClose = useCallback(() => {
		setPanelOpen(false);
		window.clearTimeout(syncTimerRef.current);
		syncTimerRef.current = window.setTimeout(() => {
			setGlobeSyncKey((k) => k + 1);
		}, 180);
	}, []);

	const handleRecenter = useCallback(() => {
		setGlobeSyncKey((k) => k + 1);
		if (selectedId) {
			setFocusCityId(selectedId);
			setFocusNonce((n) => n + 1);
		} else {
			setRecenterKey((k) => k + 1);
		}
	}, [selectedId]);

	useEffect(() => {
		return () => window.clearTimeout(syncTimerRef.current);
	}, []);

	const skipIntro = useCallback(() => {
		setPhase("reveal");
		setExploreReady(true);
	}, []);

	useEffect(() => {
		const timers = PHASE_TIMELINE.map(({ phase: p, at }) =>
			window.setTimeout(() => setPhase(p), at),
		);
		return () => timers.forEach(clearTimeout);
	}, []);

	useEffect(() => {
		if (phase !== "reveal" || exploreReady) return;
		// Wait for reveal camera (2200ms) to finish before handing off
		const t = window.setTimeout(() => setExploreReady(true), isMobile ? 2600 : 2800);
		return () => clearTimeout(t);
	}, [phase, exploreReady, isMobile]);

	return (
		<div id="explorer" className="explorer-shell relative w-full overflow-hidden bg-[#030201] pt-0 md:pt-0">
			<Navbar variant="deck" visible={phase !== "boot"} layer="back" />

			<CompanionFilterBar
				value={companion}
				onChange={setCompanion}
				visible={interactive}
			/>

			<div className="absolute inset-0 z-[1]">
				<TravelGlobe
					variant="deck"
					data={mapView}
					selectedId={selectedId}
					focusCityId={focusCityId}
					focusNonce={focusNonce}
					recenterKey={recenterKey}
					onSelect={(city) => {
						if (!interactive || !city) return;
						selectCity(city);
					}}
					phase={phase}
					primaryFlight={primary}
					interactive={interactive}
					gesturesEnabled={mapGesturesEnabled}
					layoutSyncKey={globeSyncKey}
				/>
			</div>

			<PilotHud
				phase={phase}
				primaryFlight={primary}
				flights={flights}
				travelMap={mapView}
				branding={branding}
				interactive={interactive}
			/>

			<ExploreChrome
				visible={interactive}
				showSkip={!interactive && phase !== "boot"}
				onSkip={skipIntro}
			/>

			<WaypointRail
				cities={mapView.cities}
				countries={mapView.countries}
				selectedId={selectedId}
				visible={interactive}
				onSelect={selectCity}
				onOpenChange={handleRailOpenChange}
			/>

			<GlobeRecenterButton
				visible={interactive && mapGesturesEnabled}
				onClick={handleRecenter}
			/>

			<JourneyLedger
				countries={mapView.countries}
				cities={mapView.cities}
				visible={interactive}
				companion={companion}
				flightSummary={travelMap.flightSummary}
			/>

			<DestinationPanel
				city={selected}
				countries={mapView.countries}
				siblingCities={siblingCities}
				flightSummary={mapView.flightSummary}
				open={panelOpen && interactive && selected !== null}
				onClose={handlePanelClose}
				onSelectCity={selectCity}
			/>
		</div>
	);
}
