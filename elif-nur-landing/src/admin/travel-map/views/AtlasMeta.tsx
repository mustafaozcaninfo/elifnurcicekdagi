import { useState } from "react";
import { adminFetch } from "../../../api/client";
import { notifyApiError } from "../api-helpers";
import type { TravelMapData } from "../../travel-map-types";

type Props = {
	map: TravelMapData;
	notify: (msg: string) => void;
	onSaved: () => void;
};

export default function AtlasMeta({ map, notify, onSaved }: Props) {
	const [draft, setDraft] = useState({
		title: map.title,
		subtitle: map.subtitle,
		globe: map.globe ?? {},
	});

	const save = async () => {
		const res = await adminFetch("/admin/travel-map/meta", {
			method: "PATCH",
			body: JSON.stringify(draft),
		});
		if (!res.ok) {
			notifyApiError(res, "Kayıt hatası", notify);
			return;
		}
		notify("Ayarlar kaydedildi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<header>
				<h1 className="atlas-page-title">Harita Ayarları</h1>
				<p className="atlas-page-sub">Explorer başlığı ve globe renkleri</p>
			</header>
			<div className="atlas-card space-y-3 p-5">
				<label className="block text-xs text-warm-muted">
					Başlık
					<input
						className="admin-input mt-1"
						value={draft.title}
						onChange={(e) => setDraft({ ...draft, title: e.target.value })}
					/>
				</label>
				<label className="block text-xs text-warm-muted">
					Alt başlık
					<input
						className="admin-input mt-1"
						value={draft.subtitle}
						onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
					/>
				</label>
				<div className="admin-form-grid">
					{(["atmosphereColor", "pointColor", "arcColor"] as const).map((key) => (
						<label key={key} className="text-xs text-warm-muted">
							{key}
							<input
								type="color"
								className="admin-input mt-1 h-10"
								value={(draft.globe as Record<string, string>)?.[key] ?? "#C25B3F"}
								onChange={(e) =>
									setDraft({
										...draft,
										globe: { ...draft.globe, [key]: e.target.value },
									})
								}
							/>
						</label>
					))}
				</div>
				<button type="button" className="admin-btn admin-btn-primary" onClick={save}>
					Kaydet
				</button>
			</div>
		</div>
	);
}
