import { useMemo, useState } from "react";
import { useAtlasData } from "./useAtlasData";
import AtlasCities from "./views/AtlasCities";
import AtlasCountries from "./views/AtlasCountries";
import AtlasDashboard from "./views/AtlasDashboard";
import AtlasFlights from "./views/AtlasFlights";
import AtlasMeta from "./views/AtlasMeta";
import AtlasRoutes from "./views/AtlasRoutes";

type Props = { notify: (msg: string) => void };

export type AtlasView = "dashboard" | "cities" | "countries" | "flights" | "routes" | "meta";

const NAV: { id: AtlasView; label: string; hint: string }[] = [
	{ id: "dashboard", label: "Genel Bakış", hint: "Özet ve bağlantılar" },
	{ id: "cities", label: "Şehirler", hint: "Waypoint CRUD" },
	{ id: "countries", label: "Ülkeler", hint: "ISO2 ve renkler" },
	{ id: "flights", label: "Uçuş Kaydı", hint: "QR245 / DOH-IST" },
	{ id: "routes", label: "Rotalar", hint: "Globe arkleri" },
	{ id: "meta", label: "Harita Ayarları", hint: "Başlık ve globe" },
];

export default function TravelMapAdmin({ notify }: Props) {
	const { map, flights, errors, loading, reload, flightAirports, cityFlags } = useAtlasData(notify);
	const [view, setView] = useState<AtlasView>("dashboard");
	const [filterFlightLog, setFilterFlightLog] = useState(false);

	const stats = useMemo(() => {
		if (!map || !flights) return null;
		const withIata = map.cities.filter((c) => c.airportCode).length;
		const inLog = map.cities.filter((c) =>
			c.airportCode ? flightAirports.has(c.airportCode.toUpperCase()) : false,
		).length;
		const logNotOnMap = [...flightAirports].filter(
			(iata) => !map.cities.some((c) => c.airportCode?.toUpperCase() === iata),
		);
		return { withIata, inLog, logNotOnMap, flightCount: flights.count };
	}, [map, flights, flightAirports]);

	if (loading && !map) {
		return <p className="atlas-muted py-12 text-center">Atlas yükleniyor…</p>;
	}
	if (!map) return <p className="atlas-muted py-12 text-center">Veri yok.</p>;

	return (
		<div className="atlas-shell">
			<aside className="atlas-sidebar">
				<div className="atlas-sidebar-head">
					<p className="atlas-kicker">Explorer Atlas</p>
					<h2 className="atlas-sidebar-title">Yönetim</h2>
					<p className="atlas-sidebar-sub">D1 · canlı harita</p>
				</div>
				<nav className="atlas-nav">
					{NAV.map((item) => (
						<button
							key={item.id}
							type="button"
							className={`atlas-nav-item ${view === item.id ? "atlas-nav-item-active" : ""}`}
							onClick={() => setView(item.id)}
						>
							<span className="atlas-nav-label">{item.label}</span>
							<span className="atlas-nav-hint">{item.hint}</span>
						</button>
					))}
				</nav>
				<div className="atlas-sidebar-foot">
					<button type="button" className="admin-btn admin-btn-ghost w-full text-xs" onClick={reload}>
						Yenile
					</button>
					<a href="/explorer" className="admin-btn admin-btn-ghost mt-2 block w-full text-center text-xs">
						Explorer önizle
					</a>
				</div>
			</aside>

			<main className="atlas-main">
				{errors.length > 0 && (
					<div className="atlas-alert mb-4">
						<strong>Uyarılar</strong>
						<ul className="mt-1 list-inside list-disc text-xs">
							{errors.map((e) => (
								<li key={e}>{e}</li>
							))}
						</ul>
					</div>
				)}

				{view === "dashboard" && (
					<AtlasDashboard
						map={map}
						stats={stats}
						flights={flights}
						onNavigate={setView}
						onFilterFlightLog={() => {
							setFilterFlightLog(true);
							setView("cities");
						}}
					/>
				)}
				{view === "cities" && (
					<AtlasCities
						map={map}
						flights={flights}
						notify={notify}
						onSaved={reload}
						cityFlags={cityFlags}
						initialFlightLogOnly={filterFlightLog}
						onClearFilter={() => setFilterFlightLog(false)}
					/>
				)}
				{view === "countries" && (
					<AtlasCountries map={map} notify={notify} onSaved={reload} />
				)}
				{view === "flights" && (
					<AtlasFlights flights={flights} notify={notify} onSaved={reload} map={map} />
				)}
				{view === "routes" && <AtlasRoutes map={map} notify={notify} onSaved={reload} />}
				{view === "meta" && <AtlasMeta map={map} notify={notify} onSaved={reload} />}
			</main>
		</div>
	);
}

export { notifyApiError } from "./api-helpers";