import { useCallback, useRef, useState } from "react";
import { adminFetch } from "../../../api/client";
import type { LookupResult } from "../../travel-map-types";

export default function PlaceLookup({
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
				notify(res.error ?? "Arama hatası");
				return;
			}
			setResults(res.data?.results ?? []);
			setOpen(true);
		},
		[notify],
	);

	return (
		<div className="admin-lookup">
			<div className="flex flex-wrap gap-2">
				<input
					className="admin-input flex-1"
					placeholder="Şehir veya IATA (Istanbul, IST…)"
					value={q}
					onChange={(e) => {
						setQ(e.target.value);
						clearTimeout(debounce.current);
						debounce.current = setTimeout(() => search(e.target.value, type), 320);
					}}
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
									{r.countryCode ? ` · ${r.countryCode}` : ""}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
