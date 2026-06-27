import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../../../api/client";
import type { TravelMapCity } from "../../../data/travel-map-types";
import { notifyApiError } from "../api-helpers";
import CityDrawer from "../components/CityDrawer";
import type { FlightsPayload } from "../useAtlasData";
import type { TravelMapData } from "../../travel-map-types";

type Filter = "all" | "flight-log" | "iata" | "no-iata";

type Props = {
	map: TravelMapData;
	flights: FlightsPayload | null;
	notify: (msg: string) => void;
	onSaved: () => void;
	cityFlags: (code?: string) => { inFlightLog: boolean; hasIata: boolean };
	initialFlightLogOnly?: boolean;
	onClearFilter?: () => void;
};

const emptyCity = (): Partial<TravelMapCity> & { name: string } => ({
	name: "",
	country: "",
	lat: 0,
	lng: 0,
	role: "visited",
});

export default function AtlasCities({
	map,
	flights,
	notify,
	onSaved,
	cityFlags,
	initialFlightLogOnly,
	onClearFilter,
}: Props) {
	const [q, setQ] = useState("");
	const [country, setCountry] = useState("");
	const [filter, setFilter] = useState<Filter>(initialFlightLogOnly ? "flight-log" : "all");
	const [editing, setEditing] = useState<(Partial<TravelMapCity> & { name: string }) | null>(null);

	useEffect(() => {
		if (initialFlightLogOnly) setFilter("flight-log");
	}, [initialFlightLogOnly]);

	const rows = useMemo(() => {
		let list = [...map.cities];
		if (country) list = list.filter((c) => c.country === country);
		if (q.trim()) {
			const s = q.toLowerCase();
			list = list.filter(
				(c) =>
					c.name.toLowerCase().includes(s) ||
					c.id.includes(s) ||
					(c.airportCode?.toLowerCase().includes(s) ?? false),
			);
		}
		if (filter === "flight-log") {
			list = list.filter((c) => cityFlags(c.airportCode).inFlightLog);
		} else if (filter === "iata") {
			list = list.filter((c) => c.airportCode);
		} else if (filter === "no-iata") {
			list = list.filter((c) => !c.airportCode);
		}
		return list.sort((a, b) => a.name.localeCompare(b.name));
	}, [map.cities, country, q, filter, cityFlags]);

	const saveCity = async (draft: Partial<TravelMapCity> & { name: string }) => {
		if (!draft.name || !draft.country) {
			notify("Ad ve ülke zorunlu");
			return;
		}
		const isNew = !map.cities.some((c) => c.id === draft.id);
		const body = {
			...draft,
			id: draft.id || draft.name.toLowerCase().replace(/\s+/g, "-"),
			lat: Number(draft.lat),
			lng: Number(draft.lng),
			visitedWith: draft.visitedWith === "spouse" ? "spouse" : null,
		};
		const res = isNew
			? await adminFetch("/admin/travel-map/cities", { method: "POST", body: JSON.stringify(body) })
			: await adminFetch(`/admin/travel-map/cities/${draft.id}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			notifyApiError(res, "Kayıt hatası", notify);
			return;
		}
		notify(isNew ? "Şehir eklendi" : "Güncellendi");
		setEditing(null);
		onSaved();
	};

	const deleteCity = async (id: string) => {
		if (!confirm(`"${id}" silinsin mi?`)) return;
		const res = await adminFetch(`/admin/travel-map/cities/${id}`, { method: "DELETE" });
		if (!res.ok) {
			notifyApiError(res, "Silinemedi", notify);
			return;
		}
		notify("Silindi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="atlas-page-title">Şehirler</h1>
					<p className="atlas-page-sub">{map.cities.length} waypoint · IATA uçuş kaydıyla eşleşir</p>
				</div>
				<button
					type="button"
					className="admin-btn admin-btn-primary"
					onClick={() => setEditing(emptyCity())}
				>
					+ Şehir
				</button>
			</header>

			<div className="flex flex-wrap gap-2">
				{(
					[
						["all", "Tümü"],
						["flight-log", "Uçuş kaydında"],
						["iata", "IATA var"],
						["no-iata", "IATA yok"],
					] as const
				).map(([id, label]) => (
					<button
						key={id}
						type="button"
						className={`atlas-pill ${filter === id ? "atlas-pill-active" : ""}`}
						onClick={() => {
							setFilter(id);
							onClearFilter?.();
						}}
					>
						{label}
					</button>
				))}
			</div>

			<div className="flex flex-wrap gap-2">
				<input
					className="admin-input max-w-xs"
					placeholder="Ara…"
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
				<select
					className="admin-input max-w-xs"
					value={country}
					onChange={(e) => setCountry(e.target.value)}
				>
					<option value="">Tüm ülkeler</option>
					{map.countries.map((c) => (
						<option key={c.iso2} value={c.iso2}>
							{c.name}
						</option>
					))}
				</select>
			</div>

			<div className="atlas-card overflow-x-auto">
				<table className="admin-table w-full">
					<thead>
						<tr className="text-warm-muted">
							<th>Şehir</th>
							<th>IATA</th>
							<th>Ülke</th>
							<th>Kimle</th>
							<th>Uçuş</th>
							<th>Not</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{rows.map((c) => {
							const flags = cityFlags(c.airportCode);
							const sum = c.airportCode
								? flights?.summaryByAirport[c.airportCode.toUpperCase()]
								: undefined;
							return (
								<tr key={c.id}>
									<td>
										<span className="font-medium">{c.name}</span>
										<span className="block font-mono text-xs text-warm-muted">{c.id}</span>
									</td>
									<td className="font-mono">{c.airportCode ?? "—"}</td>
									<td>
										{c.country}{" "}
										<span className="text-warm-muted text-xs">{c.countryName}</span>
									</td>
									<td>
										{c.visitedWith === "spouse" ? (
											<span className="text-warm-mustard text-xs">♥ Husband</span>
										) : (
											<span className="text-warm-sage text-xs">Solo</span>
										)}
									</td>
									<td>
										{flags.inFlightLog ? (
											<span className="atlas-badge-flight">
												{sum?.sectors ?? "?"} sektör
											</span>
										) : (
											<span className="text-xs text-warm-muted">—</span>
										)}
									</td>
									<td className="max-w-[200px] truncate text-xs text-warm-muted">
										{c.note ?? "—"}
									</td>
									<td className="text-right whitespace-nowrap">
										<button
											type="button"
											className="admin-btn admin-btn-ghost mr-1 text-xs"
											onClick={() => setEditing({ ...c })}
										>
											Düzenle
										</button>
										<button
											type="button"
											className="admin-btn admin-btn-ghost text-xs text-red-300"
											onClick={() => deleteCity(c.id)}
										>
											Sil
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{editing && (
				<CityDrawer
					city={editing}
					countries={map.countries}
					flights={flights}
					onSave={saveCity}
					onClose={() => setEditing(null)}
					notify={notify}
				/>
			)}
		</div>
	);
}
