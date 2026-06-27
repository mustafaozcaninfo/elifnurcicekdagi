import { useState } from "react";
import { adminFetch } from "../../../api/client";
import type { TravelMapCountry } from "../../../data/travel-map-types";
import { notifyApiError } from "../api-helpers";
import CountryLookup from "../components/CountryLookup";
import type { CountryLookupResult } from "../../travel-map-types";
import type { TravelMapData } from "../../travel-map-types";

type Props = {
	map: TravelMapData;
	notify: (msg: string) => void;
	onSaved: () => void;
};

export default function AtlasCountries({ map, notify, onSaved }: Props) {
	const [editing, setEditing] = useState<TravelMapCountry | null>(null);
	const [isNew, setIsNew] = useState(false);

	const openNew = () => {
		setEditing({ iso2: "", name: "", visited: true });
		setIsNew(true);
	};

	const applyCountry = (r: CountryLookupResult) => {
		setEditing((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				iso2: r.iso2,
				name: r.name,
				visited: prev.visited ?? true,
				color: prev.color ?? "#C25B3F",
			};
		});
		notify(`${r.name} (${r.iso2}) seçildi`);
	};

	const save = async () => {
		if (!editing?.iso2 || !editing.name) {
			notify("ISO2 ve ad zorunlu");
			return;
		}
		if (!/^[A-Z]{2}$/.test(editing.iso2)) {
			notify("ISO2 iki harf olmalı (ör. DE, TR)");
			return;
		}
		const res = isNew
			? await adminFetch("/admin/travel-map/countries", {
					method: "POST",
					body: JSON.stringify(editing),
				})
			: await adminFetch(`/admin/travel-map/countries/${editing.iso2}`, {
					method: "PATCH",
					body: JSON.stringify(editing),
				});
		if (!res.ok) {
			notifyApiError(res, "Kayıt hatası", notify);
			return;
		}
		notify(isNew ? "Ülke eklendi" : "Güncellendi");
		setEditing(null);
		onSaved();
	};

	const remove = async (iso2: string) => {
		if (!confirm(`${iso2} silinsin mi?`)) return;
		const res = await adminFetch(`/admin/travel-map/countries/${iso2}`, { method: "DELETE" });
		if (!res.ok) {
			notifyApiError(res, "Silinemedi", notify);
			return;
		}
		notify("Silindi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<header className="flex justify-between gap-3">
				<div>
					<h1 className="atlas-page-title">Ülkeler</h1>
					<p className="atlas-page-sub">ISO2 benzersiz · {map.countries.length} kayıt</p>
				</div>
				<button type="button" className="admin-btn admin-btn-primary" onClick={openNew}>
					+ Ülke
				</button>
			</header>

			{editing && (
				<div className="atlas-card p-4">
					{isNew && (
						<label className="mb-4 block text-xs text-warm-muted">
							Ülke ara (ISO2 otomatik dolar)
							<div className="mt-1">
								<CountryLookup onSelect={applyCountry} notify={notify} />
							</div>
						</label>
					)}
					<div className="admin-form-grid">
						<label className="text-xs text-warm-muted">
							ISO2
							<input
								className="admin-input mt-1 font-mono uppercase"
								maxLength={2}
								disabled={!isNew}
								value={editing.iso2}
								onChange={(e) =>
									setEditing({ ...editing, iso2: e.target.value.toUpperCase().slice(0, 2) })
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Ad
							<input
								className="admin-input mt-1"
								value={editing.name}
								onChange={(e) => setEditing({ ...editing, name: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Renk
							<input
								type="color"
								className="admin-input mt-1 h-10"
								value={editing.color ?? "#C25B3F"}
								onChange={(e) => setEditing({ ...editing, color: e.target.value })}
							/>
						</label>
						<label className="flex items-end gap-2 text-xs text-warm-muted">
							<input
								type="checkbox"
								checked={editing.favorite ?? false}
								onChange={(e) => setEditing({ ...editing, favorite: e.target.checked })}
							/>
							Favori ülke
						</label>
					</div>
					<div className="mt-3 flex gap-2">
						<button type="button" className="admin-btn admin-btn-primary" onClick={save}>
							Kaydet
						</button>
						<button
							type="button"
							className="admin-btn admin-btn-ghost"
							onClick={() => setEditing(null)}
						>
							İptal
						</button>
					</div>
				</div>
			)}

			<div className="atlas-card overflow-hidden">
				<table className="admin-table w-full">
					<thead>
						<tr className="text-warm-muted">
							<th>ISO</th>
							<th>Ad</th>
							<th>Şehir</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{map.countries.map((c) => (
							<tr key={c.iso2}>
								<td className="font-mono font-medium">{c.iso2}</td>
								<td>
									<span
										className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
										style={{ background: c.color ?? "#888" }}
									/>
									{c.name}
									{c.favorite && <span className="ml-1 text-warm-mustard">♥</span>}
								</td>
								<td>{map.cities.filter((x) => x.country === c.iso2).length}</td>
								<td className="text-right">
									<button
										type="button"
										className="admin-btn admin-btn-ghost mr-1 text-xs"
										onClick={() => {
											setEditing({ ...c });
											setIsNew(false);
										}}
									>
										Düzenle
									</button>
									<button
										type="button"
										className="admin-btn admin-btn-ghost text-xs text-red-300"
										onClick={() => remove(c.iso2)}
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
