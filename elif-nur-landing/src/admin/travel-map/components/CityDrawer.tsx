import { useMemo, useState } from "react";
import type { AirportFlightSummary, TravelMapCity, TravelMapCountry } from "../../../data/travel-map-types";
import { slugify } from "../api-helpers";
import PlaceLookup from "./PlaceLookup";
import CountryLookup from "./CountryLookup";
import type { FlightsPayload } from "../useAtlasData";
import type { CountryLookupResult } from "../../travel-map-types";

const ROLES = ["home", "visited", "layover"] as const;
const COMPANION_OPTIONS = [
	{ value: "", label: "Solo — eş gelmedi" },
	{ value: "spouse", label: "With husband — eşle" },
] as const;

type Props = {
	city: Partial<TravelMapCity> & { name: string };
	countries: TravelMapCountry[];
	flights: FlightsPayload | null;
	onSave: (c: Partial<TravelMapCity> & { name: string; visitedWith?: TravelMapCity["visitedWith"] | null }) => Promise<void>;
	onClose: () => void;
	notify: (msg: string) => void;
};

export default function CityDrawer({
	city,
	countries,
	flights,
	onSave,
	onClose,
	notify,
}: Props) {
	const [draft, setDraft] = useState(city);
	const [saving, setSaving] = useState(false);

	const iata = (draft.airportCode ?? "").toUpperCase();
	const summary: AirportFlightSummary | undefined = iata
		? flights?.summaryByAirport[iata]
		: undefined;

	const linkedFlights = useMemo(() => {
		if (!flights || !iata) return [];
		return flights.flights.filter((f) => f.fromIata === iata || f.toIata === iata);
	}, [flights, iata]);

	const applyLookup = (r: {
		name: string;
		lat: number;
		lng: number;
		countryCode?: string;
		country?: string;
		airportCode?: string;
	}) => {
		const baseName = r.name.split(",")[0].trim();
		setDraft((d) => ({
			...d,
			name: baseName || d.name,
			lat: r.lat,
			lng: r.lng,
			country: r.countryCode ?? d.country,
			countryName: r.country ?? d.countryName,
			airportCode: r.airportCode ?? d.airportCode,
			id: d.id || slugify(baseName),
		}));
	};

	const save = async () => {
		setSaving(true);
		try {
			const payload = {
				...draft,
				visitedWith:
					draft.visitedWith === "spouse"
						? ("spouse" as const)
						: null,
			};
			await onSave(payload);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="atlas-drawer-backdrop" onClick={onClose}>
			<div className="atlas-drawer" onClick={(e) => e.stopPropagation()}>
				<header className="atlas-drawer-head">
					<div>
						<p className="atlas-kicker">{city.id ? "Düzenle" : "Yeni waypoint"}</p>
						<h2 className="text-xl font-semibold">{city.id ? city.name : "Şehir ekle"}</h2>
					</div>
					<button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={onClose}>
						Kapat
					</button>
				</header>

				<div className="atlas-drawer-body">
					{summary && (
						<div className="atlas-flight-chip mb-4">
							<p className="text-xs font-medium text-warm-mustard">Uçuş kaydında · {iata}</p>
							<p className="mt-1 text-sm">
								{summary.sectors} sektör · {summary.blockHrs.toFixed(1)} block saat
							</p>
							<p className="mt-1 font-mono text-xs text-warm-muted">
								{summary.flights.slice(0, 6).join(", ")}
								{summary.flights.length > 6 ? "…" : ""}
							</p>
						</div>
					)}

					<label className="block text-xs text-warm-muted">
						Konum ara
						<div className="mt-1">
							<PlaceLookup onSelect={applyLookup} notify={notify} />
						</div>
					</label>

					<div className="admin-form-grid mt-3">
						<label className="text-xs text-warm-muted">
							ID
							<input
								className="admin-input mt-1"
								value={draft.id ?? ""}
								disabled={!!city.id}
								onChange={(e) => setDraft({ ...draft, id: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Ad
							<input
								className="admin-input mt-1"
								value={draft.name}
								onChange={(e) =>
									setDraft({
										...draft,
										name: e.target.value,
										id: draft.id || slugify(e.target.value),
									})
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Ülke
							<div className="mt-1 mb-2">
								<CountryLookup
									placeholder="Ülke ara — ISO2 otomatik (Germany, TR…)"
									notify={notify}
									onSelect={(r: CountryLookupResult) =>
										setDraft({
											...draft,
											country: r.iso2,
											countryName: r.name,
										})
									}
								/>
							</div>
							<select
								className="admin-input mt-1"
								value={draft.country ?? ""}
								onChange={(e) => {
									const iso = e.target.value;
									const c = countries.find((x) => x.iso2 === iso);
									setDraft({ ...draft, country: iso, countryName: c?.name });
								}}
							>
								<option value="">— Haritadaki ülkeler —</option>
								{countries.map((c) => (
									<option key={c.iso2} value={c.iso2}>
										{c.iso2} — {c.name}
									</option>
								))}
							</select>
						</label>
						<label className="text-xs text-warm-muted">
							IATA
							<input
								className="admin-input mt-1 font-mono uppercase"
								maxLength={4}
								value={draft.airportCode ?? ""}
								onChange={(e) =>
									setDraft({ ...draft, airportCode: e.target.value.toUpperCase() })
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Enlem
							<input
								type="number"
								step="any"
								className="admin-input mt-1 font-mono"
								value={draft.lat ?? 0}
								onChange={(e) => setDraft({ ...draft, lat: parseFloat(e.target.value) })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Boylam
							<input
								type="number"
								step="any"
								className="admin-input mt-1 font-mono"
								value={draft.lng ?? 0}
								onChange={(e) => setDraft({ ...draft, lng: parseFloat(e.target.value) })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Rol
							<select
								className="admin-input mt-1"
								value={draft.role ?? "visited"}
								onChange={(e) =>
									setDraft({ ...draft, role: e.target.value as TravelMapCity["role"] })
								}
							>
								{ROLES.map((r) => (
									<option key={r} value={r}>
										{r}
									</option>
								))}
							</select>
						</label>
						<label className="text-xs text-warm-muted">
							Kimle
							<select
								className="admin-input mt-1"
								value={draft.visitedWith === "spouse" ? "spouse" : ""}
								onChange={(e) =>
									setDraft({
										...draft,
										visitedWith:
											e.target.value === "spouse" ? "spouse" : undefined,
									})
								}
							>
								{COMPANION_OPTIONS.map((o) => (
									<option key={o.value || "solo"} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</label>
					</div>

					<label className="mt-3 block text-xs text-warm-muted">
						Not (ön yüzde görünür)
						<input
							className="admin-input mt-1"
							value={draft.note ?? ""}
							onChange={(e) => setDraft({ ...draft, note: e.target.value })}
							placeholder="Kısa açıklama veya uçuş özeti"
						/>
					</label>

					{linkedFlights.length > 0 && (
						<div className="mt-4">
							<p className="text-xs font-medium text-warm-muted">Bu havalimanındaki uçuşlar</p>
							<ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs font-mono">
								{linkedFlights.map((f) => (
									<li key={f.id} className="rounded bg-black/20 px-2 py-1">
										{f.flightNumber} {f.fromIata}→{f.toIata}
										{f.blockHrs != null ? ` · ${f.blockHrs.toFixed(1)}h` : ""}
										{f.acReg ? ` · ${f.acReg}` : ""}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<footer className="atlas-drawer-foot">
					<button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
						İptal
					</button>
					<button
						type="button"
						className="admin-btn admin-btn-primary"
						onClick={save}
						disabled={saving}
					>
						{saving ? "Kaydediliyor…" : "Kaydet"}
					</button>
				</footer>
			</div>
		</div>
	);
}
