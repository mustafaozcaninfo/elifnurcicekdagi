import type { FlightsPayload } from "../useAtlasData";
import type { TravelMapData } from "../../travel-map-types";
import type { AtlasView } from "../TravelMapAdmin";

type Props = {
	map: TravelMapData;
	stats: {
		withIata: number;
		inLog: number;
		logNotOnMap: string[];
		flightCount: number;
	} | null;
	flights: FlightsPayload | null;
	onNavigate: (v: AtlasView) => void;
	onFilterFlightLog: () => void;
};

export default function AtlasDashboard({ map, stats, flights, onNavigate, onFilterFlightLog }: Props) {
	return (
		<div className="space-y-6">
			<header>
				<h1 className="atlas-page-title">Genel Bakış</h1>
				<p className="atlas-page-sub">
					Harita D1 relational tablolardan gelir. Uçuş kodları ayrı <code>travel_flights</code>{" "}
					tablosunda.
				</p>
			</header>

			<div className="atlas-stat-grid">
				<button type="button" className="atlas-stat-card" onClick={() => onNavigate("cities")}>
					<span className="atlas-stat-value">{map.cities.length}</span>
					<span className="atlas-stat-label">Şehir</span>
				</button>
				<button type="button" className="atlas-stat-card" onClick={() => onNavigate("countries")}>
					<span className="atlas-stat-value">{map.countries.length}</span>
					<span className="atlas-stat-label">Ülke</span>
				</button>
				<button type="button" className="atlas-stat-card" onClick={() => onNavigate("flights")}>
					<span className="atlas-stat-value">{stats?.flightCount ?? 0}</span>
					<span className="atlas-stat-label">Uçuş kaydı</span>
				</button>
				<button type="button" className="atlas-stat-card" onClick={() => onNavigate("routes")}>
					<span className="atlas-stat-value">{map.routes?.length ?? 0}</span>
					<span className="atlas-stat-label">Globe rotası</span>
				</button>
			</div>

			<div className="atlas-card p-5">
				<h3 className="atlas-section-title">Uçuş logu ↔ Harita</h3>
				<div className="mt-3 grid gap-3 sm:grid-cols-3">
					<div className="atlas-mini-stat">
						<span className="text-2xl font-semibold text-warm-mustard">{stats?.inLog ?? 0}</span>
						<p className="text-xs text-warm-muted">Şehir uçuş kaydında</p>
					</div>
					<div className="atlas-mini-stat">
						<span className="text-2xl font-semibold">{stats?.withIata ?? 0}</span>
						<p className="text-xs text-warm-muted">IATA kodlu şehir</p>
					</div>
					<div className="atlas-mini-stat">
						<span className="text-2xl font-semibold text-amber-300">
							{stats?.logNotOnMap.length ?? 0}
						</span>
						<p className="text-xs text-warm-muted">Logda var, haritada yok</p>
					</div>
				</div>
				{(stats?.logNotOnMap.length ?? 0) > 0 && (
					<p className="mt-3 text-xs text-warm-muted">
						Eksik IATA: {stats!.logNotOnMap.slice(0, 12).join(", ")}
						{stats!.logNotOnMap.length > 12 ? "…" : ""}
					</p>
				)}
				<button
					type="button"
					className="admin-btn admin-btn-primary mt-4"
					onClick={onFilterFlightLog}
				>
					Uçuş kayıtlı şehirleri göster
				</button>
			</div>

			<div className="atlas-card p-5">
				<h3 className="atlas-section-title">Nasıl çalışır?</h3>
				<ul className="mt-3 space-y-2 text-sm text-warm-muted">
					<li>
						<strong className="text-warm-light">Şehirler</strong> — haritadaki pinler. IATA kodu
						uçuş kaydıyla eşleşir.
					</li>
					<li>
						<strong className="text-warm-light">Uçuş Kaydı</strong> — QR245/DOH-IST, block hrs, A/C
						REG. Şehir seçmek zorunlu değil; veri tutmak için.
					</li>
					<li>
						<strong className="text-warm-light">Ülkeler</strong> — ISO2 benzersiz. Her şehir bir
						ülkeye bağlı.
					</li>
					<li>
						<strong className="text-warm-light">Rotalar</strong> — globe üzerindeki ark çizgileri
						(otomatik oluşturulabilir).
					</li>
				</ul>
			</div>

			{flights && flights.count > 0 && (
				<div className="atlas-card overflow-hidden">
					<div className="border-b border-white/8 px-4 py-3">
						<h3 className="atlas-section-title">Son uçuşlar</h3>
					</div>
					<div className="max-h-64 overflow-y-auto">
						<table className="admin-table w-full">
							<thead>
								<tr className="text-warm-muted">
									<th>Uçuş</th>
									<th>Rota</th>
									<th>Block</th>
									<th>A/C</th>
								</tr>
							</thead>
							<tbody>
								{flights.flights.slice(-8).reverse().map((f) => (
									<tr key={f.id}>
										<td className="font-mono font-medium">{f.flightNumber}</td>
										<td className="font-mono text-xs">
											{f.fromIata} → {f.toIata}
										</td>
										<td className="font-mono text-xs">
											{f.blockHrs != null ? `${f.blockHrs.toFixed(1)}h` : "—"}
										</td>
										<td className="font-mono text-xs">{f.acReg ?? "—"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<button
						type="button"
						className="admin-btn admin-btn-ghost m-4 text-xs"
						onClick={() => onNavigate("flights")}
					>
						Tüm uçuş kaydı →
					</button>
				</div>
			)}
		</div>
	);
}
