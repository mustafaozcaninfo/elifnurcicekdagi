import { useState } from "react";
import { adminFetch } from "../api/client";
import type { AdminPage } from "../api/types";

type Props = {
	pages: AdminPage[];
	onSaved: () => void;
	notify: (msg: string) => void;
};

const empty = (): Partial<AdminPage> & { slug: string } => ({
	slug: "",
	path: "",
	title: "",
	bodyMd: "",
	pageType: "page",
	status: "draft",
	showInNav: false,
});

export default function PagesPanel({ pages, onSaved, notify }: Props) {
	const [editing, setEditing] = useState<(Partial<AdminPage> & { slug: string }) | null>(null);

	const save = async () => {
		if (!editing?.slug || !editing.title) {
			notify("slug ve title zorunlu");
			return;
		}
		const isNew = !pages.some((p) => p.slug === editing.slug);
		const body = {
			slug: editing.slug,
			path: editing.path || `/${editing.slug}`,
			title: editing.title,
			excerpt: editing.excerpt,
			bodyMd: editing.bodyMd,
			pageType: editing.pageType ?? "page",
			status: editing.status ?? "draft",
			showInNav: editing.showInNav ?? false,
			navLabel: editing.navLabel,
			seoTitle: editing.seo?.title,
			seoDescription: editing.seo?.description,
		};
		const res = isNew
			? await adminFetch<{ slug: string }>("/admin/pages", {
					method: "POST",
					body: JSON.stringify(body),
				})
			: await adminFetch(`/admin/pages/${editing.slug}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			notify(res.error ?? "Kayıt hatası");
			return;
		}
		notify(isNew ? "Sayfa oluşturuldu" : "Sayfa güncellendi");
		setEditing(null);
		onSaved();
	};

	const remove = async (slug: string) => {
		if (!confirm(`"${slug}" silinsin mi?`)) return;
		const res = await adminFetch(`/admin/pages/${slug}`, { method: "DELETE" });
		if (!res.ok) {
			notify(res.error ?? "Silinemedi");
			return;
		}
		notify("Silindi");
		onSaved();
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<button type="button" className="admin-btn admin-btn-primary" onClick={() => setEditing(empty())}>
					+ Yeni sayfa
				</button>
			</div>

			<div className="admin-card overflow-hidden">
				<table className="admin-table w-full">
					<thead>
						<tr className="text-warm-muted">
							<th>Başlık</th>
							<th>Path</th>
							<th>Durum</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{pages.map((p) => (
							<tr key={p.slug}>
								<td className="font-medium">{p.title}</td>
								<td className="text-warm-muted">{p.path}</td>
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
										className="admin-btn admin-btn-ghost mr-2"
										onClick={() => setEditing({ ...p })}
									>
										Düzenle
									</button>
									<button
										type="button"
										className="admin-btn admin-btn-ghost text-red-300"
										onClick={() => remove(p.slug)}
									>
										Sil
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{editing && (
				<div className="admin-card fixed inset-4 z-50 overflow-auto p-6 md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2">
					<h2 className="font-kanit text-lg font-semibold">
						{pages.some((p) => p.slug === editing.slug) ? "Sayfa düzenle" : "Yeni sayfa"}
					</h2>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						<label className="text-xs text-warm-muted">
							Slug
							<input
								className="admin-input mt-1"
								value={editing.slug}
								onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
								disabled={pages.some((p) => p.slug === editing.slug)}
							/>
						</label>
						<label className="text-xs text-warm-muted">
							Path
							<input
								className="admin-input mt-1"
								value={editing.path ?? ""}
								onChange={(e) => setEditing({ ...editing, path: e.target.value })}
							/>
						</label>
						<label className="text-xs text-warm-muted md:col-span-2">
							Başlık
							<input
								className="admin-input mt-1"
								value={editing.title ?? ""}
								onChange={(e) => setEditing({ ...editing, title: e.target.value })}
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
						<label className="text-xs text-warm-muted">
							Tip
							<select
								className="admin-input mt-1"
								value={editing.pageType ?? "page"}
								onChange={(e) => setEditing({ ...editing, pageType: e.target.value })}
							>
								<option value="page">page</option>
								<option value="blog">blog</option>
								<option value="legal">legal</option>
							</select>
						</label>
						<label className="flex items-center gap-2 text-xs text-warm-muted md:col-span-2">
							<input
								type="checkbox"
								checked={editing.showInNav ?? false}
								onChange={(e) => setEditing({ ...editing, showInNav: e.target.checked })}
							/>
							Menüde göster
						</label>
						<label className="text-xs text-warm-muted md:col-span-2">
							İçerik (Markdown)
							<textarea
								className="admin-input mt-1 min-h-[200px] font-mono text-sm"
								value={editing.bodyMd ?? ""}
								onChange={(e) => setEditing({ ...editing, bodyMd: e.target.value })}
							/>
						</label>
					</div>
					<div className="mt-6 flex justify-end gap-2">
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
