import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "../api/client";
import type { CityStory, TravelMapCity, TravelMapCountry } from "../data/travel-map-types";
import type { AdminTravelMapResponse, LookupResult, TravelMapData } from "./travel-map-types";

type Props = {
	notify: (msg: string) => void;
};

type SubTab = "cities" | "countries" | "routes" | "meta" | "json";

const ROLES = ["home", "visited", "layover"] as const;
const VISITED_WITH = ["spouse", "solo"] as const;

const emptyCity = (): Partial<TravelMapCity> & { name: string } => ({
	name: "",
	country: "",
	lat: 0,
	lng: 0,
	role: "visited",
});

const emptyCountry = (): TravelMapCountry => ({
	iso2: "",
	name: "",
	visited: true,
});

function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

type FetchError = { status: number; error?: string };

function formatFetchError(res: FetchError, fallback: string): string {
	const msg = res.error ?? fallback;
	return `HTTP ${res.status}: ${msg}`;
}

function isUnauthorized(res: FetchError): boolean {
	return res.status === 401 || (res.error?.includes("UNAUTHORIZED") ?? false);
}

function notifyFetchError(
	res: FetchError,
	fallback: string,
	notify: (msg: string) => void,
	sessionAware = false,
) {
	if (sessionAware && isUnauthorized(res)) {
		notify("Oturum süresi dolmuş — yeniden giriş yapın");
		return;
	}
	notify(formatFetchError(res, fallback));
}

function PlaceLookup({
	onSelect,
	notify,
}: {
	onSelect: (r: LookupResult) => void;
	notify: (msg: string) => void;
}) {
	const [q, setQ] = useState("");
	const [type, setType] = useState<"auto" | "city" | "airport">("auto");
	const [results, setResults] = useState<LookupResult[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounce = useRef<ReturnType<typeof setTimeout>>();

	const search = useCallback(
		async (query: string, searchType: typeof type) => {
			if (query.trim().length < 2) {
				setResults([]);
				return;
			}
			setLoading(true);
			const res = await adminFetch<{ results: LookupResult[] }>(
				`/admin/travel-map/lookup?q=${encodeURIComponent(query)}&type=${searchType}`,
			);
			setLoading(false);
			if (!res.ok) {
				notifyFetchError(res, "Arama hatası", notify);
				return;
			}
			setResults(res.data?.results ?? []);
			setOpen(true);
		},
		[notify],
	);

	const onChange = (value: string) => {
		setQ(value);
		clearTimeout(debounce.current);
		debounce.current = setTimeout(() => search(value, type), 320);
	};

	return (
		<div className="admin-lookup">
			<div className="flex flex-wrap gap-2">
				<input
					className="admin-input flex-1"
					placeholder="Şehir veya havalimanı ara (Istanbul, IST, DOH…)"
					value={q}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => results.length && setOpen(true)}
				/>
				<select
					className="admin-input w-auto"
					value={type}
					onChange={(e) => {
						const t = e.target.value as typeof type;
						setType(t);
						if (q.length >= 2) search(q, t);
					}}
				>
					<option value="auto">Otomatik</option>
					<option value="city">Şehir</option>
					<option value="airport">Havalimanı</option>
				</select>
			</div>
			{loading && <p className="mt-1 text-xs text-warm-muted">Aranıyor…</p>}
			{open && results.length > 0 && (
				<ul className="admin-lookup-list">
					{results.map((r) => (
						<li key={r.id}>
							<button
								type="button"
								className="admin-lookup-item"
								onClick={() => {
									onSelect(r);
									setOpen(false);
									setQ(r.airportCode ? `${r.name} (${r.airportCode})` : r.name);
								}}
							>
								<span className="font-medium">{r.name}</span>
								{r.airportCode && (
									<span className="admin-badge ml-2 bg-white/10">{r.airportCode}</span>
								)}
								<span className="block text-xs text-warm-muted">
									{r.lat.toFixed(4)}, {r.lng.toFixed(4)}
									{r.countryCode ? ` · ${r.countryCode}` : r.country ? ` · ${r.country}` : ""}
									{r.source === "iata-exact" ? " · IATA" : ""}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function CityEditor({
	city,
	countries,
	onSave,
	onClose,
	notify,
}: {
	city: Partial<TravelMapCity> & { name: string };
	countries: TravelMapCountry[];
	onSave: (c: Partial<TravelMapCity> & { name: string }) => Promise<void>;
	onClose: () => void;
	notify: (msg: string) => void;
}) {
	const [draft, setDraft] = useState(city);
	const [saving, setSaving] = useState(false);
	const [storyJson, setStoryJson] = useState(
		city.story ? JSON.stringify(city.story, null, 2) : "",
	);
	const [showStory, setShowStory] = useState(!!city.story);

	const applyLookup = (r: LookupResult) => {
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
		if (showStory && storyJson.trim()) {
			try {
				draft.story = JSON.parse(storyJson) as CityStory;
			} catch {
				notify("Story JSON geçersiz");
				return;
			}
		} else if (!showStory) {
			draft.story = undefined;
		}
		setSaving(true);
		try {
			await onSave(draft);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="admin-modal-backdrop" onClick={onClose}>
			<div className="admin-modal" onClick={(e) => e.stopPropagation()}>
				<h2 className="font-kanit text-lg font-semibold">
					{city.id ? `Şehir: ${city.name}` : "Yeni şehir"}
				</h2>

				<div className="mt-4 space-y-3">
					<label className="block text-xs text-warm-muted">
						Konum ara (koordinat + IATA)
						<div className="mt-1">
							<PlaceLookup onSelect={applyLookup} notify={notify} />
						</div>
					</label>

					<div className="admin-form-grid">
						<label className="text-xs text-warm-muted">
							ID
							<input
								className="admin-input mt-1"
								value={draft.id ?? ""}
								onChange={(e) => setDraft({ ...draft, id: e.target.value })}
								placeholder={slugify(draft.name || "city")}
								disabled={!!city.id}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Şehir adı
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
							Ülke (ISO2)
							<select
								className="admin-input mt-1"
								value={draft.country ?? ""}
								onChange={(e) => {
									const iso = e.target.value;
									const c = countries.find((x) => x.iso2 === iso);
									setDraft({
										...draft,
										country: iso,
										countryName: c?.name ?? draft.countryName,
									});
								}}
							>
								<option value="">Seçin</option>
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
									setDraft({
										...draft,
										role: e.target.value as TravelMapCity["role"],
									})
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
								value={draft.visitedWith ?? ""}
								onChange={(e) =>
									setDraft({
										...draft,
										visitedWith: (e.target.value || undefined) as TravelMapCity["visitedWith"],
									})
								}
							>
								<option value="">—</option>
								{VISITED_WITH.map((v) => (
									<option key={v} value={v}>
										{v}
									</option>
								))}
							</select>
						</label>
					</div>

					<label className="block text-xs text-warm-muted">
						Not
						<input
							className="admin-input mt-1"
							value={draft.note ?? ""}
							onChange={(e) => setDraft({ ...draft, note: e.target.value })}
						/>
					</label>

					<label className="flex items-center gap-2 text-xs text-warm-muted">
						<input
							type="checkbox"
							checked={showStory}
							onChange={(e) => setShowStory(e.target.checked)}
						/>
						Şehir hikayesi (story JSON)
					</label>
					{showStory && (
						<textarea
							className="admin-input min-h-[160px] font-mono text-xs"
							value={storyJson}
							onChange={(e) => setStoryJson(e.target.value)}
							placeholder='{"tag":"…","headline":"…","sections":[]}'
						/>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-2">
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
				</div>
			</div>
		</div>
	);
}

export default function TravelMapPanel({ notify }: Props) {
	const [sub, setSub] = useState<SubTab>("cities");
	const [map, setMap] = useState<TravelMapData | null>(null);
	const [errors, setErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [cityFilter, setCityFilter] = useState("");
	const [countryFilter, setCountryFilter] = useState("");
	const [editingCity, setEditingCity] = useState<(Partial<TravelMapCity> & { name: string }) | null>(
		null,
	);
	const [editingCountry, setEditingCountry] = useState<TravelMapCountry | null>(null);
	const [isNewCountry, setIsNewCountry] = useState(false);
	const [savingCountry, setSavingCountry] = useState(false);
	const [jsonDraft, setJsonDraft] = useState("");
	const [metaDraft, setMetaDraft] = useState<Partial<TravelMapData>>({});

	const load = useCallback(async () => {
		setLoading(true);
		const res = await adminFetch<AdminTravelMapResponse>("/admin/travel-map");
		setLoading(false);
		if (!res.ok || !res.data) {
			notifyFetchError(res, "Harita yüklenemedi", notify);
			return;
		}
		setMap(res.data.map);
		setErrors(res.data.errors ?? []);
		setMetaDraft({
			title: res.data.map.title,
			subtitle: res.data.map.subtitle,
			homeHub: res.data.map.homeHub,
			opening: res.data.map.opening,
			globe: res.data.map.globe,
		});
	}, [notify]);

	useEffect(() => {
		load();
	}, [load]);

	const filteredCities = useMemo(() => {
		if (!map) return [];
		let list = map.cities;
		if (countryFilter) list = list.filter((c) => c.country === countryFilter);
		if (cityFilter.trim()) {
			const q = cityFilter.toLowerCase();
			list = list.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.id.includes(q) ||
					(c.airportCode?.toLowerCase().includes(q) ?? false),
			);
		}
		return list.sort((a, b) => a.name.localeCompare(b.name));
	}, [map, cityFilter, countryFilter]);

	const saveCity = async (draft: Partial<TravelMapCity> & { name: string }) => {
		if (!draft.name || !draft.country) {
			notify("Ad ve ülke zorunlu");
			return;
		}
		const isNew = !map?.cities.some((c) => c.id === draft.id);
		const body = {
			...draft,
			id: draft.id || slugify(draft.name),
			lat: Number(draft.lat),
			lng: Number(draft.lng),
		};
		const res = isNew
			? await adminFetch("/admin/travel-map/cities", {
					method: "POST",
					body: JSON.stringify(body),
				})
			: await adminFetch(`/admin/travel-map/cities/${draft.id}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			notifyFetchError(res, "Kayıt hatası", notify, true);
			return;
		}
		notify(isNew ? "Şehir eklendi" : "Şehir güncellendi");
		setEditingCity(null);
		load();
	};

	const deleteCity = async (id: string) => {
		if (!confirm(`"${id}" silinsin mi?`)) return;
		const res = await adminFetch(`/admin/travel-map/cities/${id}`, { method: "DELETE" });
		if (!res.ok) {
			notifyFetchError(res, "Silinemedi", notify);
			return;
		}
		notify("Şehir silindi");
		load();
	};

	const saveCountry = async () => {
		if (!editingCountry?.iso2 || !editingCountry.name) {
			notify("ISO2 ve ad zorunlu");
			return;
		}
		setSavingCountry(true);
		const res = isNewCountry
			? await adminFetch("/admin/travel-map/countries", {
					method: "POST",
					body: JSON.stringify(editingCountry),
				})
			: await adminFetch(`/admin/travel-map/countries/${editingCountry.iso2}`, {
					method: "PATCH",
					body: JSON.stringify(editingCountry),
				});
		setSavingCountry(false);
		if (!res.ok) {
			notifyFetchError(res, "Kayıt hatası", notify, true);
			return;
		}
		notify(isNewCountry ? "Ülke eklendi" : "Ülke güncellendi");
		setEditingCountry(null);
		setIsNewCountry(false);
		load();
	};

	const deleteCountry = async (iso2: string) => {
		if (!confirm(`${iso2} silinsin mi?`)) return;
		const res = await adminFetch(`/admin/travel-map/countries/${iso2}`, { method: "DELETE" });
		if (!res.ok) {
			notifyFetchError(res, "Silinemedi", notify);
			return;
		}
		notify("Ülke silindi");
		load();
	};

	const rebuildRoutes = async () => {
		const homeId = map?.cities.find((c) => c.role === "home")?.id ?? "istanbul";
		const res = await adminFetch("/admin/travel-map/routes/rebuild", {
			method: "POST",
			body: JSON.stringify({ hubId: homeId }),
		});
		if (!res.ok) {
			notifyFetchError(res, "Rota oluşturulamadı", notify);
			return;
		}
		notify("Rotalar yeniden oluşturuldu");
		load();
	};

	const saveMeta = async () => {
		const res = await adminFetch("/admin/travel-map/meta", {
			method: "PATCH",
			body: JSON.stringify(metaDraft),
		});
		if (!res.ok) {
			notifyFetchError(res, "Kayıt hatası", notify);
			return;
		}
		notify("Meta kaydedildi");
		load();
	};

	const saveJson = async () => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(jsonDraft);
		} catch {
			notify("Geçersiz JSON");
			return;
		}
		const res = await adminFetch("/admin/travel-map", {
			method: "PUT",
			body: JSON.stringify({ map: parsed }),
		});
		if (!res.ok) {
			notifyFetchError(res, "Kayıt hatası", notify);
			return;
		}
		notify("Harita JSON kaydedildi");
		load();
	};

	const exportJson = () => {
		if (!map) return;
		const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "travel-map.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading && !map) {
		return <p className="text-warm-muted">Harita yükleniyor…</p>;
	}

	if (!map) return <p className="text-warm-muted">Harita verisi yok.</p>;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="font-kanit text-lg font-semibold text-warm-light">Seyahat Haritası</h2>
				<span className="admin-badge bg-white/10">{map.cities.length} şehir</span>
			</div>

			{errors.length > 0 && (
				<div className="admin-card border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
					<strong>Uyarılar:</strong>
					<ul className="mt-1 list-inside list-disc text-xs">
						{errors.map((e) => (
							<li key={e}>{e}</li>
						))}
					</ul>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-2">
				<span className="text-sm text-warm-muted">
					{map.cities.length} şehir · {map.countries.length} ülke · {map.routes?.length ?? 0} rota
				</span>
				<div className="ml-auto flex flex-wrap gap-2">
					{(["cities", "countries", "routes", "meta", "json"] as SubTab[]).map((t) => (
						<button
							key={t}
							type="button"
							className={`admin-btn text-xs ${sub === t ? "admin-btn-primary" : "admin-btn-ghost"}`}
							onClick={() => {
								setSub(t);
								if (t === "json") setJsonDraft(JSON.stringify(map, null, 2));
							}}
						>
							{t === "cities"
								? "Şehirler"
								: t === "countries"
									? "Ülkeler"
									: t === "routes"
										? "Rotalar"
										: t === "meta"
											? "Meta"
											: "JSON"}
						</button>
					))}
				</div>
			</div>

			{sub === "cities" && (
				<>
					<div className="flex flex-wrap gap-2">
						<input
							className="admin-input max-w-xs"
							placeholder="Şehir ara…"
							value={cityFilter}
							onChange={(e) => setCityFilter(e.target.value)}
						/>
						<select
							className="admin-input max-w-xs"
							value={countryFilter}
							onChange={(e) => setCountryFilter(e.target.value)}
						>
							<option value="">Tüm ülkeler</option>
							{map.countries.map((c) => (
								<option key={c.iso2} value={c.iso2}>
									{c.name}
								</option>
							))}
						</select>
						<button
							type="button"
							className="admin-btn admin-btn-primary ml-auto"
							onClick={() => setEditingCity(emptyCity())}
						>
							+ Şehir
						</button>
					</div>
					<div className="admin-card overflow-x-auto">
						<table className="admin-table w-full">
							<thead>
								<tr className="text-warm-muted">
									<th>Şehir</th>
									<th>Ülke</th>
									<th>IATA</th>
									<th>Koordinat</th>
									<th>Rol</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{filteredCities.map((c) => (
									<tr key={c.id}>
										<td>
											<span className="font-medium">{c.name}</span>
											<span className="block font-mono text-xs text-warm-muted">{c.id}</span>
										</td>
										<td>{c.country}</td>
										<td className="font-mono">{c.airportCode ?? "—"}</td>
										<td className="font-mono text-xs">
											{c.lat.toFixed(4)}, {c.lng.toFixed(4)}
										</td>
										<td>
											<span className="admin-badge bg-white/10">{c.role ?? "visited"}</span>
										</td>
										<td className="text-right">
											<button
												type="button"
												className="admin-btn admin-btn-ghost mr-1 text-xs"
												onClick={() => setEditingCity({ ...c })}
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
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{sub === "countries" && (
				<>
					<div className="flex justify-end">
						<button
							type="button"
							className="admin-btn admin-btn-primary"
							onClick={() => {
								setEditingCountry(emptyCountry());
								setIsNewCountry(true);
							}}
						>
							+ Ülke
						</button>
					</div>
					{editingCountry && (
						<div className="admin-card p-4">
							<div className="admin-form-grid">
								<label className="text-xs text-warm-muted">
									ISO2
									<input
										className="admin-input mt-1 font-mono uppercase"
										maxLength={2}
										value={editingCountry.iso2}
										onChange={(e) =>
											setEditingCountry({
												...editingCountry,
												iso2: e.target.value.toUpperCase(),
											})
										}
									/>
								</label>
								<label className="text-xs text-warm-muted">
									Ad
									<input
										className="admin-input mt-1"
										value={editingCountry.name}
										onChange={(e) =>
											setEditingCountry({ ...editingCountry, name: e.target.value })
										}
									/>
								</label>
								<label className="text-xs text-warm-muted">
									Renk
									<input
										type="color"
										className="admin-input mt-1 h-10"
										value={editingCountry.color ?? "#C25B3F"}
										onChange={(e) =>
											setEditingCountry({ ...editingCountry, color: e.target.value })
										}
									/>
								</label>
							</div>
							<label className="mt-2 flex items-center gap-2 text-xs">
								<input
									type="checkbox"
									checked={editingCountry.visited}
									onChange={(e) =>
										setEditingCountry({ ...editingCountry, visited: e.target.checked })
									}
								/>
								Ziyaret edildi
							</label>
							<div className="mt-3 flex gap-2">
								<button
									type="button"
									className="admin-btn admin-btn-primary"
									onClick={saveCountry}
									disabled={savingCountry}
								>
									{savingCountry ? "Kaydediliyor…" : "Kaydet"}
								</button>
								<button
									type="button"
									className="admin-btn admin-btn-ghost"
									onClick={() => {
										setEditingCountry(null);
										setIsNewCountry(false);
									}}
								>
									İptal
								</button>
							</div>
						</div>
					)}
					<div className="admin-card overflow-hidden">
						<table className="admin-table w-full">
							<thead>
								<tr className="text-warm-muted">
									<th>ISO</th>
									<th>Ad</th>
									<th>Şehir sayısı</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{map.countries.map((c) => (
									<tr key={c.iso2}>
										<td className="font-mono">{c.iso2}</td>
										<td>
											<span
												className="mr-2 inline-block h-3 w-3 rounded-full"
												style={{ background: c.color ?? "#888" }}
											/>
											{c.name}
										</td>
										<td>{map.cities.filter((x) => x.country === c.iso2).length}</td>
										<td className="text-right">
											<button
												type="button"
												className="admin-btn admin-btn-ghost mr-1 text-xs"
												onClick={() => {
													setEditingCountry({ ...c });
													setIsNewCountry(false);
												}}
											>
												Düzenle
											</button>
											<button
												type="button"
												className="admin-btn admin-btn-ghost text-xs text-red-300"
												onClick={() => deleteCountry(c.iso2)}
											>
												Sil
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{sub === "routes" && (
				<>
					<div className="flex gap-2">
						<button type="button" className="admin-btn admin-btn-primary" onClick={rebuildRoutes}>
							Rotaları otomatik oluştur
						</button>
						<p className="self-center text-xs text-warm-muted">
							Ev şehrinden (role=home) ülke başına bir rota
						</p>
					</div>
					<div className="admin-card overflow-hidden">
						<table className="admin-table w-full">
							<thead>
								<tr className="text-warm-muted">
									<th>#</th>
									<th>From</th>
									<th>To</th>
									<th>Label</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{(map.routes ?? []).map((r, i) => (
									<tr key={`${r.from}-${r.to}-${i}`}>
										<td>{i}</td>
										<td className="font-mono">{r.from}</td>
										<td className="font-mono">{r.to}</td>
										<td>{r.label ?? "—"}</td>
										<td className="text-right">
											<button
												type="button"
												className="admin-btn admin-btn-ghost text-xs text-red-300"
												onClick={async () => {
													const res = await adminFetch(`/admin/travel-map/routes/${i}`, {
														method: "DELETE",
													});
													if (!res.ok) notifyFetchError(res, "Silinemedi", notify);
													else {
														notify("Rota silindi");
														load();
													}
												}}
											>
												Sil
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{sub === "meta" && (
				<div className="admin-card space-y-3 p-4">
					<label className="block text-xs text-warm-muted">
						Başlık
						<input
							className="admin-input mt-1"
							value={metaDraft.title ?? ""}
							onChange={(e) => setMetaDraft({ ...metaDraft, title: e.target.value })}
						/>
					</label>
					<label className="block text-xs text-warm-muted">
						Alt başlık
						<input
							className="admin-input mt-1"
							value={metaDraft.subtitle ?? ""}
							onChange={(e) => setMetaDraft({ ...metaDraft, subtitle: e.target.value })}
						/>
					</label>
					<div className="admin-form-grid">
						<label className="text-xs text-warm-muted">
							Ev şehir kodu
							<input
								className="admin-input mt-1 font-mono"
								value={(metaDraft.homeHub as { code?: string })?.code ?? ""}
								onChange={(e) =>
									setMetaDraft({
										...metaDraft,
										homeHub: {
											...(metaDraft.homeHub as object),
											code: e.target.value,
										},
									})
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Ev şehir adı
							<input
								className="admin-input mt-1"
								value={(metaDraft.homeHub as { city?: string })?.city ?? ""}
								onChange={(e) =>
									setMetaDraft({
										...metaDraft,
										homeHub: {
											...(metaDraft.homeHub as object),
											city: e.target.value,
										},
									})
								}
							/>
						</label>
					</div>
					<p className="text-xs font-medium text-warm-muted">Globe renkleri</p>
					<div className="admin-form-grid">
						{(["atmosphereColor", "pointColor", "arcColor"] as const).map((key) => (
							<label key={key} className="text-xs text-warm-muted">
								{key}
								<input
									type="color"
									className="admin-input mt-1 h-10"
									value={(metaDraft.globe as Record<string, string>)?.[key] ?? "#C25B3F"}
									onChange={(e) =>
										setMetaDraft({
											...metaDraft,
											globe: { ...(metaDraft.globe as object), [key]: e.target.value },
										})
									}
								/>
							</label>
						))}
						<label className="text-xs text-warm-muted">
							autoRotateSpeed
							<input
								type="number"
								step="0.05"
								className="admin-input mt-1"
								value={(metaDraft.globe as { autoRotateSpeed?: number })?.autoRotateSpeed ?? 0.35}
								onChange={(e) =>
									setMetaDraft({
										...metaDraft,
										globe: {
											...(metaDraft.globe as object),
											autoRotateSpeed: parseFloat(e.target.value),
										},
									})
								}
							/>
						</label>
					</div>
					<button type="button" className="admin-btn admin-btn-primary" onClick={saveMeta}>
						Meta kaydet
					</button>
				</div>
			)}

			{sub === "json" && (
				<div className="admin-card p-4">
					<div className="mb-3 flex gap-2">
						<button type="button" className="admin-btn admin-btn-ghost" onClick={exportJson}>
							Dışa aktar
						</button>
						<label className="admin-btn admin-btn-ghost cursor-pointer">
							İçe aktar
							<input
								type="file"
								accept=".json"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (!f) return;
									f.text().then(setJsonDraft);
								}}
							/>
						</label>
					</div>
					<textarea
						className="admin-input min-h-[400px] font-mono text-xs"
						value={jsonDraft}
						onChange={(e) => setJsonDraft(e.target.value)}
						spellCheck={false}
					/>
					<button type="button" className="admin-btn admin-btn-primary mt-4" onClick={saveJson}>
						Tüm haritayı kaydet (JSON)
					</button>
				</div>
			)}

			{editingCity && (
				<CityEditor
					city={editingCity}
					countries={map.countries}
					onSave={saveCity}
					onClose={() => setEditingCity(null)}
					notify={notify}
				/>
			)}
		</div>
	);
}
