import { useState } from "react";
import { adminFetch } from "../api/client";
import type { SettingItem } from "../api/types";

const FIELD_PRESETS = [
	{
		key: "landing.hero",
		label: "Hero",
		fields: ["heading", "tagline", "intro", "portraitUrl"] as const,
	},
	{
		key: "landing.about",
		label: "About",
		fields: ["heading", "body"] as const,
	},
	{
		key: "site.branding",
		label: "Branding",
		fields: ["siteName", "tagline", "email"] as const,
	},
] as const;

const TRAVEL_MAP_KEY = "landing.travelMap";

type Props = {
	settings: SettingItem[];
	onSaved: () => void;
	notify: (msg: string) => void;
};

export default function SettingsPanel({ settings, onSaved, notify }: Props) {
	const [active, setActive] = useState<string>(FIELD_PRESETS[0].key);
	const [draft, setDraft] = useState<Record<string, string>>({});
	const [mapJson, setMapJson] = useState("");

	const isMap = active === TRAVEL_MAP_KEY;
	const preset = FIELD_PRESETS.find((p) => p.key === active);
	const current = settings.find((s) => s.key === active)?.value ?? {};
	const values = { ...current, ...draft } as Record<string, string>;

	const loadMapEditor = () => {
		const existing = settings.find((s) => s.key === TRAVEL_MAP_KEY)?.value;
		setMapJson(JSON.stringify(existing ?? {}, null, 2));
		setActive(TRAVEL_MAP_KEY);
	};

	const saveFields = async () => {
		if (!preset) return;
		const payload: Record<string, string> = {};
		for (const f of preset.fields) {
			if (values[f] != null) payload[f] = String(values[f]);
		}
		const res = await adminFetch(`/admin/settings/${active}`, {
			method: "PUT",
			body: JSON.stringify({ value: payload }),
		});
		if (!res.ok) {
			notify(res.error ?? "Kayıt hatası");
			return;
		}
		setDraft({});
		notify("Ayar kaydedildi");
		onSaved();
	};

	const saveMap = async () => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(mapJson);
		} catch {
			notify("Geçersiz JSON");
			return;
		}
		const res = await adminFetch(`/admin/settings/${TRAVEL_MAP_KEY}`, {
			method: "PUT",
			body: JSON.stringify({ value: parsed }),
		});
		if (!res.ok) {
			notify(res.error ?? "Kayıt hatası");
			return;
		}
		notify("Travel map güncellendi");
		onSaved();
	};

	return (
		<div className="admin-card p-6">
			<div className="mb-4 flex flex-wrap gap-2">
				{FIELD_PRESETS.map((p) => (
					<button
						key={p.key}
						type="button"
						className={`admin-btn ${active === p.key ? "admin-btn-primary" : "admin-btn-ghost"}`}
						onClick={() => {
							setActive(p.key);
							setDraft({});
						}}
					>
						{p.label}
					</button>
				))}
				<button
					type="button"
					className={`admin-btn ${isMap ? "admin-btn-primary" : "admin-btn-ghost"}`}
					onClick={loadMapEditor}
				>
					Travel Map (JSON)
				</button>
			</div>

			{isMap ? (
				<>
					<p className="mb-3 text-xs text-warm-muted">
						Tüm harita verisi — countries, cities, routes, globe. JSON dosyanızı yapıştırın.
					</p>
					<textarea
						className="admin-input min-h-[420px] font-mono text-xs"
						value={mapJson}
						onChange={(e) => setMapJson(e.target.value)}
						spellCheck={false}
					/>
					<button type="button" className="admin-btn admin-btn-primary mt-4" onClick={saveMap}>
						Harita JSON Kaydet
					</button>
				</>
			) : (
				<>
					<div className="grid gap-3">
						{preset?.fields.map((field) => (
							<label key={field} className="text-xs text-warm-muted">
								{field}
								{field === "body" || field === "intro" ? (
									<textarea
										className="admin-input mt-1 min-h-[120px]"
										value={values[field] ?? ""}
										onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
									/>
								) : (
									<input
										className="admin-input mt-1"
										value={values[field] ?? ""}
										onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
									/>
								)}
							</label>
						))}
					</div>
					<button type="button" className="admin-btn admin-btn-primary mt-6" onClick={saveFields}>
						Kaydet
					</button>
				</>
			)}
		</div>
	);
}
