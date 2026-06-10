export function renderHealthDashboard(): string {
	return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Operasyon Paneli — elifnurcicekdagi.com</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/health/dashboard.css" />
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
  <script src="/health/dashboard.js" defer></script>
</body>
</html>`;
}
