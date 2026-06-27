import { useCallback, useEffect, useMemo, useState } from "react";
import CompanionFilterBar from "../components/CompanionFilter";
import type { DeckPhase } from "../components/PilotHud";
import DestinationPanel from "../components/DestinationPanel";
import ExploreChrome from "../components/ExploreChrome";
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
	const [phase, setPhase] = useState<DeckPhase>("boot");
	const [exploreReady, setExploreReady] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [focusCityId, setFocusCityId] = useState<string | null>(null);
	const [railOpen, setRailOpen] = useState(false);

	const interactive = exploreReady;
	const flightsEnabled = phase === "departure" || phase === "cruise";
	const { flights, primary } = useLiveFlights(mapView, flightsEnabled);
	const mapGesturePriority = isMobile && !railOpen && !panelOpen;

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
		setPanelOpen(true);
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
		<div id="explorer" className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-[#030201] pt-0 md:pt-0">
			<Navbar variant="deck" visible={phase !== "boot"} />

			<CompanionFilterBar
				value={companion}
				onChange={setCompanion}
				visible={interactive}
			/>

			<div className="absolute inset-0 z-0">
				<TravelGlobe
					variant="deck"
					data={mapView}
					selectedId={selectedId}
					focusCityId={focusCityId}
					onSelect={(city) => {
						if (!interactive || !city) return;
						selectCity(city);
					}}
					phase={phase}
					primaryFlight={primary}
					interactive={interactive}
					gesturePriority={mapGesturePriority}
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
				onOpenChange={setRailOpen}
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
				onClose={() => setPanelOpen(false)}
				onSelectCity={selectCity}
			/>
		</div>
	);
}
