function badge(ok, yes = "Aktif", no = "Kapalı") {
	const c = ok ? "ok" : "no";
	return `<span class="badge ${c}">${ok ? yes : no}</span>`;
}

function probeBadge(p) {
	if (!p) return badge(false);
	const label = p.ok
		? `OK ${p.latencyMs != null ? `${p.latencyMs}ms` : ""}`
		: p.error || "Hata";
	return `<span class="badge ${p.ok ? "ok" : "bad"}">${label}</span>`;
}

function row(label, value) {
	return `<div class="row"><dt>${label}</dt><dd>${value}</dd></div>`;
}

function card(title, html) {
	return `<section class="card"><h2>${title}</h2>${html}</section>`;
}

async function load() {
	const pill = document.getElementById("status-pill");
	const content = document.getElementById("content");
	const loading = document.getElementById("loading");
	const errEl = document.getElementById("error");
	try {
		const res = await fetch("/health", { cache: "no-store" });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const d = await res.json();
		loading.hidden = true;
		content.hidden = false;
		errEl.style.display = "none";

		const healthy = d.ok && d.status === "healthy";
		pill.className = `pill ${healthy ? "ok" : d.ok ? "warn" : "bad"}`;
		pill.innerHTML = `<span class="dot"></span> ${healthy ? "Sağlıklı" : d.ok ? "Kısıtlı" : "Sorunlu"}`;

		document.getElementById("ts").textContent =
			`Güncelleme: ${new Date(d.timestamp).toLocaleString("tr-TR")}`;

		let html = "";
		html += card(
			"Worker",
			`<dl>${row("Durum", badge(d.ok, "Çalışıyor", "Hata"))}${row("Site", d.site)}${row("Colo", d.worker.colo || "—")}${row("CF-Ray", d.worker.cfRay || "—")}</dl>`,
		);

		html += card(
			"Bağlantılar",
			`<dl>${row("D1 " + d.bindings.d1.name, badge(d.bindings.d1.ok) + (d.bindings.d1.error ? ` ${d.bindings.d1.error}` : ""))}${row("KV " + d.bindings.kv.name, badge(d.bindings.kv.ok))}${row("Assets", badge(d.bindings.assets))}</dl>`,
		);

		html += card(
			"Gizliler (yapılandırıldı mı?)",
			`<dl>${row("Turnstile secret", badge(d.secrets.turnstile))}${row("Brevo API", badge(d.secrets.brevo))}${row("Web Analytics", badge(d.secrets.analytics))}</dl>`,
		);

		html += card(
			"İletişim formu",
			`<dl>${row("Bildirim", d.config.contactNotifyEmail)}${row("Toplam kayıt", String(d.contact.total))}${row("Son 24 saat", String(d.contact.last24h))}${row("Son mesaj", d.contact.latestAt ? new Date(`${d.contact.latestAt}Z`).toLocaleString("tr-TR") : "—")}</dl>`,
		);

		html += card(
			"Dış kontroller",
			`<dl>${row("Site (favicon)", probeBadge(d.probes.site))}${row("Webmail", probeBadge(d.probes.webmail))}</dl>`,
		);

		const m = d.infra.mail;
		html += card(
			"Mail (Hestia)",
			`<dl>${row("Hesap", `<a href="mailto:${m.account}">${m.account}</a>`)}${row("Webmail", `<a href="${m.webmail}" target="_blank" rel="noopener">Aç</a>`)}${row("MX", m.mx)}${row("IMAP", m.imap)}${row("SMTP", m.smtp)}${row("Sunucu IP", m.serverIp)}</dl>`,
		);

		html += card(
			"Cloudflare kaynakları",
			`<dl>${row("Worker", d.infra.worker)}${row("D1", d.infra.d1.name)}${row("D1 ID", `<code>${d.infra.d1.id.slice(0, 8)}…</code>`)}${row("KV", d.infra.kv.name)}</dl>`,
		);

		html += card(
			"VPS",
			`<dl>${row("Hostname", d.infra.vps.hostname)}${row("Panel", d.infra.vps.panel)}${row("Brevo relay", d.infra.brevo.relay)}</dl>`,
		);

		let apis = '<ul class="api">';
		for (const a of d.apis.live) {
			apis += `<li><code>${a.method} ${a.path}</code> — ${a.description}</li>`;
		}
		apis +=
			'</ul><p class="planned" style="margin-top:0.75rem"><strong>Planlanan API</strong></p><ul class="planned">';
		for (const p of d.apis.planned) apis += `<li>${p}</li>`;
		apis += "</ul>";
		html += `<section class="card wide"><h2>API</h2>${apis}<div class="toolbar"><a class="btn" href="/health" target="_blank" rel="noopener">JSON export</a><button type="button" id="refresh">Yenile</button></div></section>`;

		content.innerHTML = html;
		document.getElementById("refresh").addEventListener("click", () => location.reload());
	} catch (e) {
		loading.hidden = true;
		pill.className = "pill bad";
		pill.innerHTML = '<span class="dot"></span> Hata';
		errEl.style.display = "block";
		errEl.textContent = e instanceof Error ? e.message : "Yüklenemedi";
	}
}

load();
setInterval(load, 60_000);
