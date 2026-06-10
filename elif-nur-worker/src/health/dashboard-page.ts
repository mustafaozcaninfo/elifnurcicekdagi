export function renderHealthDashboard(): string {
	return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Operasyon Paneli — elifnurcicekdagi.com</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <style>
    :root {
      --bg: #f5ebe3;
      --card: rgba(255,255,255,0.9);
      --text: #2a1f1c;
      --muted: #7a635c;
      --accent: #b07d6a;
      --ok: #2d6a4f;
      --warn: #b8860b;
      --bad: #9b2226;
      --border: rgba(61,44,41,0.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(145deg, #fdf6f0 0%, #f5e6dc 40%, #e8d5c4 100%);
      color: var(--text);
      min-height: 100vh;
      padding: 1.5rem;
      line-height: 1.5;
    }
    .wrap { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-family: Georgia, serif;
      font-weight: 400;
      font-size: 1.75rem;
    }
    .sub { color: var(--muted); font-size: 0.9rem; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .pill.ok { background: #d8f3dc; color: var(--ok); }
    .pill.warn { background: #fff3cd; color: var(--warn); }
    .pill.bad { background: #f8d7da; color: var(--bad); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 8px 30px rgba(61,44,41,0.06);
    }
    .card h2 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 0.85rem;
    }
    dl { display: grid; gap: 0.5rem; }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.88rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.45rem;
    }
    .row:last-child { border-bottom: none; padding-bottom: 0; }
    .row dt { color: var(--muted); flex-shrink: 0; }
    .row dd { text-align: right; word-break: break-word; font-variant-numeric: tabular-nums; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge.ok { background: #d8f3dc; color: var(--ok); }
    .badge.no { background: #f1f1f1; color: #666; }
    .badge.bad { background: #f8d7da; color: var(--bad); }
    ul.api { list-style: none; font-size: 0.88rem; }
    ul.api li { padding: 0.35rem 0; border-bottom: 1px solid var(--border); }
    ul.api li:last-child { border-bottom: none; }
    code {
      font-size: 0.8rem;
      background: #fdf0eb;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    a { color: var(--accent); }
    .toolbar {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    button, .btn {
      font: inherit;
      cursor: pointer;
      border: 1px solid var(--border);
      background: white;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      color: var(--text);
      text-decoration: none;
      font-size: 0.85rem;
    }
    button:hover, .btn:hover { border-color: var(--accent); }
    #loading { color: var(--muted); padding: 2rem; text-align: center; }
    #error { color: var(--bad); padding: 1rem; display: none; }
    .wide { grid-column: 1 / -1; }
    .planned { color: var(--muted); font-size: 0.85rem; }
    .planned li { list-style: disc; margin-left: 1.2rem; margin-top: 0.25rem; }
    footer {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Operasyon Paneli</h1>
        <p class="sub">elifnurcicekdagi.com — altyapı özeti</p>
      </div>
      <div id="status-pill" class="pill warn"><span class="dot"></span> Yükleniyor…</div>
    </header>
    <p id="error"></p>
    <div id="loading">Durum alınıyor…</div>
    <div id="content" class="grid" hidden></div>
    <footer>
      <p>JSON: <a href="/health">/health</a> · <span id="ts"></span></p>
    </footer>
  </div>
  <script>
    function badge(ok, yes = "Aktif", no = "Kapalı") {
      const c = ok ? "ok" : "no";
      return '<span class="badge ' + c + '">' + (ok ? yes : no) + '</span>';
    }
    function probeBadge(p) {
      if (!p) return badge(false);
      const label = p.ok ? "OK " + (p.latencyMs != null ? p.latencyMs + "ms" : "") : (p.error || "Hata");
      return '<span class="badge ' + (p.ok ? "ok" : "bad") + '">' + label + '</span>';
    }
    function row(label, value) {
      return '<div class="row"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    }
    function card(title, html) {
      return '<section class="card"><h2>' + title + '</h2>' + html + '</section>';
    }

    async function load() {
      const pill = document.getElementById("status-pill");
      const content = document.getElementById("content");
      const loading = document.getElementById("loading");
      const errEl = document.getElementById("error");
      try {
        const res = await fetch("/health", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        loading.hidden = true;
        content.hidden = false;
        errEl.style.display = "none";

        const healthy = d.ok && d.status === "healthy";
        pill.className = "pill " + (healthy ? "ok" : d.ok ? "warn" : "bad");
        pill.innerHTML = '<span class="dot"></span> ' + (healthy ? "Sağlıklı" : d.ok ? "Kısıtlı" : "Sorunlu");

        document.getElementById("ts").textContent = "Güncelleme: " + new Date(d.timestamp).toLocaleString("tr-TR");

        let html = "";
        html += card("Worker", '<dl>' +
          row("Durum", badge(d.ok, "Çalışıyor", "Hata")) +
          row("Site", d.site) +
          row("Colo", d.worker.colo || "—") +
          row("CF-Ray", d.worker.cfRay || "—") +
          '</dl>');

        html += card("Bağlantılar", '<dl>' +
          row("D1 " + d.bindings.d1.name, badge(d.bindings.d1.ok) + (d.bindings.d1.error ? " " + d.bindings.d1.error : "")) +
          row("KV " + d.bindings.kv.name, badge(d.bindings.kv.ok)) +
          row("Assets", badge(d.bindings.assets)) +
          '</dl>');

        html += card("Gizliler (yapılandırıldı mı?)", '<dl>' +
          row("Turnstile secret", badge(d.secrets.turnstile)) +
          row("Brevo API", badge(d.secrets.brevo)) +
          row("Web Analytics", badge(d.secrets.analytics)) +
          '</dl>');

        html += card("İletişim formu", '<dl>' +
          row("Bildirim", d.config.contactNotifyEmail) +
          row("Toplam kayıt", String(d.contact.total)) +
          row("Son 24 saat", String(d.contact.last24h)) +
          row("Son mesaj", d.contact.latestAt ? new Date(d.contact.latestAt + "Z").toLocaleString("tr-TR") : "—") +
          '</dl>');

        html += card("Dış kontroller", '<dl>' +
          row("Site (favicon)", probeBadge(d.probes.site)) +
          row("Webmail", probeBadge(d.probes.webmail)) +
          '</dl>');

        const m = d.infra.mail;
        html += card("Mail (Hestia)", '<dl>' +
          row("Hesap", '<a href="mailto:' + m.account + '">' + m.account + "</a>") +
          row("Webmail", '<a href="' + m.webmail + '" target="_blank" rel="noopener">Aç</a>') +
          row("MX", m.mx) +
          row("IMAP", m.imap) +
          row("SMTP", m.smtp) +
          row("Sunucu IP", m.serverIp) +
          '</dl>');

        html += card("Cloudflare kaynakları", '<dl>' +
          row("Worker", d.infra.worker) +
          row("D1", d.infra.d1.name) +
          row("D1 ID", '<code>' + d.infra.d1.id.slice(0,8) + "…</code>") +
          row("KV", d.infra.kv.name) +
          '</dl>');

        html += card("VPS", '<dl>' +
          row("Hostname", d.infra.vps.hostname) +
          row("Panel", d.infra.vps.panel) +
          row("Brevo relay", d.infra.brevo.relay) +
          '</dl>');

        let apis = '<ul class="api">';
        for (const a of d.apis.live) {
          apis += "<li><code>" + a.method + " " + a.path + "</code> — " + a.description + "</li>";
        }
        apis += '</ul><p class="planned" style="margin-top:0.75rem"><strong>Planlanan API</strong></p><ul class="planned">';
        for (const p of d.apis.planned) apis += "<li>" + p + "</li>";
        apis += "</ul>";
        html += '<section class="card wide"><h2>API</h2>' + apis +
          '<div class="toolbar"><a class="btn" href="/health" target="_blank" rel="noopener">JSON export</a>' +
          '<button type="button" id="refresh">Yenile</button></div></section>';

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
  </script>
</body>
</html>`;
}
