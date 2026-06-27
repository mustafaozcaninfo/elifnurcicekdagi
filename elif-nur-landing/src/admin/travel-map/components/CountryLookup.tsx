import { useCallback, useRef, useState } from "react";
import { adminFetch } from "../../../api/client";
import type { CountryLookupResult } from "../../travel-map-types";

export default function CountryLookup({
	onSelect,
	notify,
	placeholder = "Ülke ara (Germany, DE, Türkiye…)",
}: {
	onSelect: (r: CountryLookupResult) => void;
	notify: (msg: string) => void;
	placeholder?: string;
}) {
	const [q, setQ] = useState("");
	const [results, setResults] = useState<CountryLookupResult[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounce = useRef<ReturnType<typeof setTimeout>>();

	const search = useCallback(
		async (query: string) => {
			if (query.trim().length < 2) {
				setResults([]);
				return;
			}
			setLoading(true);
			const res = await adminFetch<{ results: CountryLookupResult[] }>(
				`/admin/travel-map/lookup?q=${encodeURIComponent(query)}&type=country`,
			);
			setLoading(false);
			if (!res.ok) {
				notify(res.error ?? "Ülke araması başarısız");
				return;
			}
			setResults(res.data?.results ?? []);
			setOpen(true);
		},
		[notify],
	);

	return (
		<div className="admin-lookup">
			<input
				className="admin-input w-full"
				placeholder={placeholder}
				value={q}
				onChange={(e) => {
					setQ(e.target.value);
					clearTimeout(debounce.current);
					debounce.current = setTimeout(() => search(e.target.value), 280);
				}}
				onFocus={() => results.length && setOpen(true)}
			/>
			{loading && <p className="mt-1 text-xs text-warm-muted">Ülkeler aranıyor…</p>}
			{open && results.length > 0 && (
				<ul className="admin-lookup-list">
					{results.map((r) => (
						<li key={r.iso2}>
							<button
								type="button"
								className="admin-lookup-item"
								onClick={() => {
									onSelect(r);
									setOpen(false);
									setQ(`${r.name} (${r.iso2})`);
								}}
							>
								<span className="font-medium">{r.name}</span>
								<span className="admin-badge ml-2 bg-white/10 font-mono">{r.iso2}</span>
								<span className="block text-xs text-warm-muted">
									{r.continentName ?? r.region}
									{r.subregion ? ` · ${r.subregion}` : ""}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
