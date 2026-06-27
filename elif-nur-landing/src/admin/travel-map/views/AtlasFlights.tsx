import { useMemo, useState } from "react";
import { adminFetch } from "../../../api/client";
import { notifyApiError } from "../api-helpers";
import type { FlightsPayload } from "../useAtlasData";
import type { TravelMapData } from "../../travel-map-types";

type Props = {
	flights: FlightsPayload | null;
	map: TravelMapData;
	notify: (msg: string) => void;
	onSaved: () => void;
};

export default function AtlasFlights({ flights, map, notify, onSaved }: Props) {
	const [q, setQ] = useState("");
	const [airportFilter, setAirportFilter] = useState("");
	const [form, setForm] = useState({
		flightNumber: "",
		fromIata: "",
		toIata: "",
		blockHrs: "",
		acReg: "",
	});
	const [saving, setSaving] = useState(false);

	const rows = useMemo(() => {
		if (!flights) return [];
		let list = flights.flights;
		if (airportFilter) {
			const a = airportFilter.toUpperCase();
			list = list.filter((f) => f.fromIata === a || f.toIata === a);
		}
		if (q.trim()) {
			const s = q.toUpperCase();
			list = list.filter(
				(f) =>
					f.flightNumber.toUpperCase().includes(s) ||
					f.fromIata.includes(s) ||
					f.toIata.includes(s) ||
					(f.acReg?.toUpperCase().includes(s) ?? false),
			);
		}
		return list;
	}, [flights, q, airportFilter]);

	const onMap = (iata: string) =>
		map.cities.some((c) => c.airportCode?.toUpperCase() === iata);

	const addFlight = async () => {
		if (!form.flightNumber || form.fromIata.length !== 3 || form.toIata.length !== 3) {
			notify("Uçuş no + 3 harfli IATA gerekli");
			return;
		}
		setSaving(true);
		const res = await adminFetch("/admin/travel-map/flights", {
			method: "POST",
			body: JSON.stringify({
				flightNumber: form.flightNumber.toUpperCase(),
				fromIata: form.fromIata.toUpperCase(),
				toIata: form.toIata.toUpperCase(),
				blockHrs: form.blockHrs ? parseFloat(form.blockHrs) : undefined,
				acReg: form.acReg || undefined,
			}),
		});
		setSaving(false);
		if (!res.ok) {
			notifyApiError(res, "Eklenemedi", notify);
			return;
		}
		notify("Uçuş eklendi");
		setForm({ flightNumber: "", fromIata: "", toIata: "", blockHrs: "", acReg: "" });
		onSaved();
	};

	const remove = async (id: number) => {
		if (!confirm("Uçuş silinsin mi?")) return;
		const res = await adminFetch(`/admin/travel-map/flights/${id}`, { method: "DELETE" });
		if (!res.ok) {
			notifyApiError(res, "Silinemedi", notify);
			return;
		}
		notify("Silindi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<header>
				<h1 className="atlas-page-title">Uçuş Kaydı</h1>
				<p className="atlas-page-sub">
					Excel&apos;deki format: <code className="text-warm-mustard">QR245/DOH-IST</code> · Block
					hrs · A/C REG. Toplam {flights?.count ?? 0} kayıt.
				</p>
			</header>

			<div className="atlas-card p-4">
				<p className="atlas-section-title mb-3">Yeni uçuş ekle</p>
				<div className="admin-form-grid">
					<input
						className="admin-input font-mono uppercase"
						placeholder="QR245"
						value={form.flightNumber}
						onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
					/>
					<input
						className="admin-input font-mono uppercase"
						placeholder="DOH"
						maxLength={3}
						value={form.fromIata}
						onChange={(e) => setForm({ ...form, fromIata: e.target.value })}
					/>
					<input
						className="admin-input font-mono uppercase"
						placeholder="IST"
						maxLength={3}
						value={form.toIata}
						onChange={(e) => setForm({ ...form, toIata: e.target.value })}
					/>
					<input
						className="admin-input font-mono"
						placeholder="Block hrs"
						value={form.blockHrs}
						onChange={(e) => setForm({ ...form, blockHrs: e.target.value })}
					/>
					<input
						className="admin-input font-mono uppercase"
						placeholder="A7-BOC"
						value={form.acReg}
						onChange={(e) => setForm({ ...form, acReg: e.target.value })}
					/>
				</div>
				<button
					type="button"
					className="admin-btn admin-btn-primary mt-3"
					onClick={addFlight}
					disabled={saving}
				>
					{saving ? "…" : "Ekle"}
				</button>
			</div>

			<div className="flex flex-wrap gap-2">
				<input
					className="admin-input max-w-sm"
					placeholder="Uçuş, IATA veya A/C ara…"
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
				<input
					className="admin-input max-w-[8rem] font-mono uppercase"
					placeholder="IST"
					maxLength={3}
					value={airportFilter}
					onChange={(e) => setAirportFilter(e.target.value)}
				/>
			</div>

			<div className="atlas-card overflow-x-auto">
				<table className="admin-table w-full">
					<thead>
						<tr className="text-warm-muted">
							<th>Uçuş</th>
							<th>Rota</th>
							<th>Block</th>
							<th>A/C REG</th>
							<th>Harita</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{rows.map((f) => (
							<tr key={f.id}>
								<td className="font-mono font-semibold text-warm-mustard">{f.flightNumber}</td>
								<td className="font-mono">
									{f.fromIata} → {f.toIata}
								</td>
								<td className="font-mono text-xs">
									{f.blockHrs != null ? `${f.blockHrs.toFixed(2)}h` : "—"}
								</td>
								<td className="font-mono text-xs">{f.acReg ?? "—"}</td>
								<td className="text-xs">
									{onMap(f.fromIata) && onMap(f.toIata) ? (
										<span className="text-green-400">✓</span>
									) : (
										<span className="text-amber-400" title="IATA haritada yok">
											!
										</span>
									)}
								</td>
								<td className="text-right">
									<button
										type="button"
										className="admin-btn admin-btn-ghost text-xs text-red-300"
										onClick={() => remove(f.id)}
									>
										Sil
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
