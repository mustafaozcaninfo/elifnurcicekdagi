import { useState } from "react";
import { adminLogin } from "../api/client";

export default function Login({ onLogin }: { onLogin: () => void }) {
	const [key, setKey] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		const res = await adminLogin(key.trim());
		setLoading(false);
		setKey("");
		if (!res.ok) {
			setError(res.error ?? "Geçersiz anahtar");
			return;
		}
		onLogin();
	};

	return (
		<div className="admin-shell flex min-h-screen items-center justify-center px-6">
			<form onSubmit={submit} className="admin-card w-full max-w-md p-8">
				<h1 className="font-kanit text-2xl font-semibold text-gradient">CMS Giriş</h1>
				<p className="mt-2 text-sm text-warm-muted">
					Anahtar yalnızca giriş isteğinde kullanılır. Sunucu{" "}
					<strong className="text-warm-light">HttpOnly</strong> oturum çerezi verir; JS
					erişemez.
				</p>
				<label className="mt-6 block text-xs font-medium uppercase tracking-wider text-warm-muted">
					Admin API Key
					<input
						type="password"
						className="admin-input mt-2"
						value={key}
						onChange={(e) => setKey(e.target.value)}
						autoComplete="off"
						required
					/>
				</label>
				{error && <p className="mt-3 text-sm text-red-400">{error}</p>}
				<button
					type="submit"
					className="admin-btn admin-btn-primary mt-6 w-full"
					disabled={loading}
				>
					{loading ? "Doğrulanıyor…" : "Giriş"}
				</button>
			</form>
		</div>
	);
}
