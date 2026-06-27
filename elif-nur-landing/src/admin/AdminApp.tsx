import { useCallback, useEffect, useState } from "react";
import { adminFetch, adminLogout, adminSessionCheck } from "../api/client";
import type { AdminPage, AdminProject, SettingItem } from "../api/types";
import Login from "./Login";
import PagesPanel from "./PagesPanel";
import ProjectsPanel from "./ProjectsPanel";
import SettingsPanel from "./SettingsPanel";
import TravelMapAdmin from "./travel-map/TravelMapAdmin";

type Tab = "pages" | "projects" | "travel-map" | "settings";

export default function AdminApp() {
	const [authenticated, setAuthenticated] = useState<boolean | null>(null);
	const [tab, setTab] = useState<Tab>("pages");
	const [toast, setToast] = useState<string | null>(null);
	const [pages, setPages] = useState<AdminPage[]>([]);
	const [projects, setProjects] = useState<AdminProject[]>([]);
	const [settings, setSettings] = useState<SettingItem[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		adminSessionCheck().then(setAuthenticated);
	}, []);

	const notify = useCallback((msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(null), 2800);
	}, []);

	const reload = useCallback(async () => {
		setLoading(true);
		const [p, pr, s] = await Promise.all([
			adminFetch<{ items: AdminPage[] }>("/admin/pages"),
			adminFetch<{ items: AdminProject[] }>("/admin/projects"),
			adminFetch<{ items: SettingItem[] }>("/admin/settings"),
		]);
		if (p.status === 401) {
			setAuthenticated(false);
			setLoading(false);
			return;
		}
		if (p.ok && p.data) setPages(p.data.items);
		if (pr.ok && pr.data) setProjects(pr.data.items);
		if (s.ok && s.data) setSettings(s.data.items);
		setLoading(false);
	}, []);

	useEffect(() => {
		if (authenticated) reload();
	}, [authenticated, reload]);

	const onLogin = () => setAuthenticated(true);

	const onLogout = async () => {
		await adminLogout();
		setAuthenticated(false);
	};

	if (authenticated === null) {
		return (
			<div className="admin-shell flex min-h-screen items-center justify-center text-warm-muted">
				Yükleniyor…
			</div>
		);
	}

	if (!authenticated) return <Login onLogin={onLogin} />;

	return (
		<div className="admin-shell">
			<header className="border-b border-white/10 px-6 py-4">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
					<div>
						<h1 className="font-kanit text-xl font-semibold text-warm-light">
							Elif Nur CMS
						</h1>
						<p className="text-xs text-warm-muted">
							HttpOnly oturum · 8 saat · key tarayıcıda saklanmaz
						</p>
					</div>
					<div className="flex gap-2">
						<a href="/" className="admin-btn admin-btn-ghost text-center">
							Site
						</a>
						<button type="button" className="admin-btn admin-btn-ghost" onClick={onLogout}>
							Çıkış
						</button>
					</div>
				</div>
			</header>

			<div className={tab === "travel-map" ? "mx-auto max-w-[90rem] px-4 py-6" : "mx-auto max-w-6xl px-6 py-6"}>
				<nav className="mb-6 flex flex-wrap gap-2">
					{(["pages", "projects", "travel-map", "settings"] as Tab[]).map((t) => (
						<button
							key={t}
							type="button"
							className={`admin-btn ${tab === t ? "admin-btn-primary" : "admin-btn-ghost"}`}
							onClick={() => setTab(t)}
						>
							{t === "pages"
								? "Sayfalar"
								: t === "projects"
									? "Projeler"
									: t === "travel-map"
										? "Atlas Yönetimi"
										: "Ayarlar"}
						</button>
					))}
					<button
						type="button"
						className="admin-btn admin-btn-ghost ml-auto"
						onClick={reload}
						disabled={loading}
					>
						{loading ? "…" : "Yenile"}
					</button>
				</nav>

				{tab === "pages" && (
					<PagesPanel pages={pages} onSaved={reload} notify={notify} />
				)}
				{tab === "projects" && (
					<ProjectsPanel projects={projects} onSaved={reload} notify={notify} />
				)}
				{tab === "travel-map" && <TravelMapAdmin notify={notify} />}
				{tab === "settings" && (
					<SettingsPanel settings={settings} onSaved={reload} notify={notify} />
				)}
			</div>

			{toast && (
				<div className="fixed bottom-6 right-6 rounded-full bg-warm-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-lg">
					{toast}
				</div>
			)}
		</div>
	);
}
