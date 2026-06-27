import { adminFetch } from "../../../api/client";
import { notifyApiError } from "../api-helpers";
import type { TravelMapData } from "../../travel-map-types";

type Props = {
	map: TravelMapData;
	notify: (msg: string) => void;
	onSaved: () => void;
};

export default function AtlasRoutes({ map, notify, onSaved }: Props) {
	const rebuild = async () => {
		const homeId = map.cities.find((c) => c.role === "home")?.id ?? "istanbul";
		const res = await adminFetch("/admin/travel-map/routes/rebuild", {
			method: "POST",
			body: JSON.stringify({ hubId: homeId }),
		});
		if (!res.ok) {
			notifyApiError(res, "Oluşturulamadı", notify);
			return;
		}
		notify("Rotalar yenilendi");
		onSaved();
	};

	const remove = async (i: number) => {
		const res = await adminFetch(`/admin/travel-map/routes/${i}`, { method: "DELETE" });
		if (!res.ok) {
			notifyApiError(res, "Silinemedi", notify);
			return;
		}
		notify("Rota silindi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<header>
				<h1 className="atlas-page-title">Globe Rotaları</h1>
				<p className="atlas-page-sub">Explorer&apos;daki uçuş arkleri · {map.routes?.length ?? 0} rota</p>
			</header>
			<button type="button" className="admin-btn admin-btn-primary" onClick={rebuild}>
				Ev şehrinden otomatik oluştur
			</button>
			<div className="atlas-card overflow-hidden">
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
										onClick={() => remove(i)}
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
