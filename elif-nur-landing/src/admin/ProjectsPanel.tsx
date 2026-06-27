import { useState } from "react";
import { adminFetch } from "../api/client";
import type { AdminProject } from "../api/types";

type Props = {
	projects: AdminProject[];
	onSaved: () => void;
	notify: (msg: string) => void;
};

export default function ProjectsPanel({ projects, onSaved, notify }: Props) {
	const [editing, setEditing] = useState<Partial<AdminProject> & { slug: string } | null>(null);

	const save = async () => {
		if (!editing?.slug || !editing.title) {
			notify("slug ve title zorunlu");
			return;
		}
		const isNew = !projects.some((p) => p.slug === editing.slug);
		const body = {
			slug: editing.slug,
			title: editing.title,
			summary: editing.summary,
			bodyMd: editing.bodyMd,
			status: editing.status ?? "draft",
			sortOrder: editing.sortOrder ?? 0,
			meta: editing.meta ?? {},
		};
		const res = isNew
			? await adminFetch("/admin/projects", { method: "POST", body: JSON.stringify(body) })
			: await adminFetch(`/admin/projects/${editing.slug}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			notify(res.error ?? "Kayıt hatası");
			return;
		}
		notify("Proje kaydedildi");
		setEditing(null);
		onSaved();
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<button
					type="button"
					className="admin-btn admin-btn-primary"
					onClick={() => setEditing({ slug: "", title: "", status: "draft", sortOrder: 0, meta: {} })}
				>
					+ Yeni proje
				</button>
			</div>

			<div className="admin-card overflow-hidden">
				<table className="admin-table w-full">
					<thead>
						<tr className="text-warm-muted">
							<th>Başlık</th>
							<th>Slug</th>
							<th>Durum</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{projects.map((p) => (
							<tr key={p.slug}>
								<td>{p.title}</td>
								<td className="text-warm-muted">{p.slug}</td>
								<td>
									<span
										className={`admin-badge ${p.status === "published" ? "admin-badge-published" : "admin-badge-draft"}`}
									>
										{p.status}
									</span>
								</td>
								<td className="text-right">
									<button
										type="button"
										className="admin-btn admin-btn-ghost"
										onClick={() => setEditing({ ...p })}
									>
										Düzenle
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{editing && (
				<div className="admin-card p-6">
					<h2 className="font-kanit text-lg font-semibold">Proje</h2>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						<label className="text-xs text-warm-muted">
							Slug
							<input
								className="admin-input mt-1"
								value={editing.slug}
								onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Başlık
							<input
								className="admin-input mt-1"
								value={editing.title ?? ""}
								onChange={(e) => setEditing({ ...editing, title: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted md:col-span-2">
							Özet
							<input
								className="admin-input mt-1"
								value={editing.summary ?? ""}
								onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Kategori (meta)
							<input
								className="admin-input mt-1"
								value={String(editing.meta?.category ?? "")}
								onChange={(e) =>
									setEditing({
										...editing,
										meta: { ...editing.meta, category: e.target.value },
									})
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Lokasyon (meta)
							<input
								className="admin-input mt-1"
								value={String(editing.meta?.location ?? "")}
								onChange={(e) =>
									setEditing({
										...editing,
										meta: { ...editing.meta, location: e.target.value },
									})
								}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Durum
							<select
								className="admin-input mt-1"
								value={editing.status ?? "draft"}
								onChange={(e) =>
									setEditing({
										...editing,
										status: e.target.value as "draft" | "published",
									})
								}
							>
								<option value="draft">draft</option>
								<option value="published">published</option>
							</select>
						</label>
					</div>
					<div className="mt-4 flex gap-2">
						<button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>
							İptal
						</button>
						<button type="button" className="admin-btn admin-btn-primary" onClick={save}>
							Kaydet
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
