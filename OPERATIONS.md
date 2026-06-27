# elifnurcicekdagi.com — Operations Runbook

> **Amaç:** Altyapı, anahtarlar, servisler ve yapılan işlerin tek kaynağı.  
> Chat geçmişi okumadan buradan devam edin.  
> **Son güncelleme:** 2026-06-10

---

## Mimari özeti

```mermaid
flowchart TB
  subgraph visitors [Ziyaretçiler]
    Browser[Web tarayıcı]
    MailClient[Mail istemcisi]
  end

  subgraph cloudflare [Cloudflare]
    Worker[elif-nur-worker]
    D1[(D1 elif-nur-db)]
    KV[(KV RATE_LIMIT)]
    DNS[DNS / DNSSEC]
  end

  subgraph brevo [Brevo]
    BrevoAPI[Transactional API]
    BrevoRelay[SMTP Relay smtp-relay.brevo.com]
  end

  subgraph hostinger [Hostinger VPS 2.25.147.42]
    Hestia[HestiaCP 1.9.6]
    Exim[Exim4]
    Dovecot[Dovecot]
    Roundcube[Roundcube]
  end

  Browser -->|HTTPS site + form| Worker
  Worker --> D1
  Worker --> KV
  Worker -->|POST /api/contact| BrevoAPI
  BrevoAPI -->|bildirim| info@

  MailClient -->|IMAP 993 / webmail| Dovecot
  Browser -->|webmail HTTPS| Roundcube
  MailClient -->|gelen MX| Exim
  Exim --> Dovecot
  Exim -->|giden smarthost| BrevoRelay
  BrevoRelay --> MailClient

  DNS --> Worker
  DNS --> Exim
```

| Katman | Rol |
|--------|-----|
| **Cloudflare Worker** | Statik site, `/api/contact`, güvenlik başlıkları, analytics beacon |
| **Hestia (VPS)** | `info@` mailbox, IMAP, webmail, gelen mail, giden mail (Exim) |
| **Brevo** | (1) Form bildirimi API, (2) sunucu geneli SMTP relay |

---

## Repo yapısı

| Yol | Açıklama |
|-----|----------|
| `elif-nur-worker/` | Cloudflare Worker kaynak kodu |
| `elif-nur-landing/` | React + Vite ana sayfa (build → `public/`) |
| `elif-nur-worker/public/` | Build çıktısı + iletişim / gizlilik HTML |
| `elif-nur-worker/scripts/` | DNS, Brevo, UptimeRobot, expiry araçları |
| `OPERATIONS.md` | Bu dosya |
| `all.env` | **Yerel gizliler** (gitignore) |
| `new-hostinger.md` | VPS SSH notları (gitignore — commit etme) |

**GitHub:** `mustafaozcaninfo/elifnurcicekdagi` — branch `main`, push → otomatik deploy.

---

## Gizliler ve anahtarlar

**Asla repoya commit etmeyin.** Değerler `all.env` (lokal) veya Cloudflare/Brevo panellerinde.

### `all.env` (lokal, gitignore)

| Değişken | Ne işe yarar |
|----------|----------------|
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler / API scriptleri |
| `CLOUDFLARE_ZONE_ID` | DNS scriptleri (`elifnurcicekdagi.com` zone) |
| `CLOUDFLARE_API_TOKEN` | Zone DNS, D1, deploy API |
| `CF_WEB_ANALYTICS_TOKEN` | Web Analytics beacon (Worker secret ile eşlenir) |
| `UPTIMEROBOT_API_KEY` | `npm run uptimerobot:setup` |
| `BREVO_API_KEY` | `verify-brevo-mail`, `apply-brevo-secret`, API testleri |
| `ALERT_EMAIL` | (opsiyonel) Worker hata uyarıları |

Kullanım:

```bash
set -a && source all.env && set +a
cd elif-nur-worker
```

### Cloudflare Worker secrets (`wrangler secret list`)

| Secret | Açıklama |
|--------|----------|
| `TURNSTILE_SECRET_KEY` | İletişim formu Turnstile doğrulama |
| `BREVO_API_KEY` | Form gönderilince Brevo transactional mail |
| `CF_WEB_ANALYTICS_TOKEN` | Analytics script token |
| `ADMIN_API_KEY` | API v1 admin yazma (`Bearer` veya `X-Admin-Key`) |

Public env (`wrangler.jsonc` → `vars`):

| Değişken | Değer |
|----------|--------|
| `TURNSTILE_SITE_KEY` | Turnstile site key (public) |
| `CONTACT_NOTIFY_EMAIL` | `info@elifnurcicekdagi.com` |

### GitHub Actions secrets

| Secret | Workflow |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | deploy, expiry-check, contact-digest (manuel) |
| `CLOUDFLARE_ACCOUNT_ID` | aynı |

### Brevo

| Öğe | Detay |
|-----|--------|
| Hesap | `mst4fa@gmail.com` |
| Domain | `elifnurcicekdagi.com` — **verified + authenticated** |
| Sender’lar | `info@`, `noreply@` |
| SMTP relay (sunucu) | `smtp-relay.brevo.com:587` — tüm VPS giden maili (Exim smarthost) |
| IP kısıtlaması | **Kapalı** (Worker + scriptler için gerekli) |

### Mail hesabı (Hestia)

| Alan | Değer |
|------|--------|
| Adres | `info@elifnurcicekdagi.com` |
| Parola | Hestia’da; **2026-06-10 rotasyonu** — değer password manager’da, repoda yok |
| Parola değiştirme | `v-change-mail-account-password admin elifnurcicekdagi.com info 'YENİ'` |

### VPS erişim

SSH ve root notları: **`new-hostinger.md`** (lokal, gitignore).  
Sunucu: `2.25.147.42`, hostname `web.typecalendar.com`, Hestia **1.9.6**.

---

## Cloudflare (site)

| Kaynak | ID / not |
|--------|----------|
| Worker | `elif-nur-worker` |
| D1 | `elif-nur-db` — `453e2db6-d161-4a3a-86a9-55ad036097c1` |
| KV | `RATE_LIMIT` — `bb1ce06a5dd7457581a52bf584bde252` |
| Routes | `elifnurcicekdagi.com/*`, `www` → apex |
| DNSSEC | Aktif (Spaceship DS) |

**Site DNS:** apex/www → Worker (proxied).  
**Mail DNS:** `mail`, `webmail` → `2.25.147.42` (**DNS only**, grey cloud).

### İletişim formu akışı

1. `POST /api/contact` → Turnstile + rate limit (KV, 3/saat/IP)
2. Kayıt → D1 `contact_submissions`
3. Brevo API → `info@elifnurcicekdagi.com` (gönderici: `info@`)
4. Saatlik GitHub digest **kapatıldı** (Brevo canlı bildirim); yedek: Actions → Contact Form Digest → manuel

---

## Mail (Hestia + Brevo)

### Hestia mail domainleri (aynı VPS)

| Domain | Webmail alias |
|--------|----------------|
| `web.typecalendar.com` | `webmail.web.typecalendar.com` |
| `elifnurcicekdagi.com` | `webmail.elifnurcicekdagi.com` |

### İstemci ayarları (elifnur)

| | |
|--|--|
| Webmail | https://webmail.elifnurcicekdagi.com |
| IMAP | `mail.elifnurcicekdagi.com:993` SSL |
| SMTP | `mail.elifnurcicekdagi.com:587` STARTTLS veya `:465` SSL |

### DNS (Cloudflare — mail)

| Tip | Name | Değer |
|-----|------|--------|
| A | `mail` | `2.25.147.42` |
| A | `webmail` | `2.25.147.42` |
| MX | `@` | `mail.elifnurcicekdagi.com` (10) |
| TXT | `@` SPF | `v=spf1 mx a:mail.elifnurcicekdagi.com ip4:2.25.147.42 include:spf.brevo.com ~all` |
| TXT | `@` | `brevo-code:...` (Brevo panel) |
| CNAME | `brevo1._domainkey` | Brevo panel |
| CNAME | `brevo2._domainkey` | Brevo panel |
| TXT | `mail._domainkey` | Hestia/Exim DKIM |
| TXT | `_dmarc` | `p=quarantine; rua=mailto:info@elifnurcicekdagi.com; ...` |

Script (idempotent): `npm run dns:email` → `scripts/setup-hestia-mail-dns.mjs`  
(`brevo-code` ve Brevo CNAME’leri panelelden; script SPF/DKIM Hestia + DMARC günceller.)

### PTR (reverse DNS)

| | |
|--|--|
| IP | `2.25.147.42` |
| PTR | `web.typecalendar.com` (paylaşımlı VPS — Hostinger hPanel) |
| Not | `mail.elifnurcicekdagi.com` PTR **kullanılmıyor** (sunucu typecalendar + elifnur paylaşımlı) |

### Giden mail yolları

| Kaynak | Yol |
|--------|-----|
| `info@` mailbox → dışarı | Exim → Brevo relay → internet |
| İletişim formu | Worker → Brevo API → `info@` |

---

## NPM scriptleri

`cd elif-nur-worker` + `source ../../all.env`:

| Komut | İşlev |
|-------|--------|
| `npm run deploy` | Worker deploy |
| `npm run dns:email` | Hestia mail DNS (Cloudflare) |
| `npm run brevo:verify` | Brevo domain + sender kontrolü |
| `npm run brevo:apply-secret` | `BREVO_API_KEY` → Worker secret |
| `npm run analytics:apply` | Analytics token secret + deploy |
| `npm run expiry:check` | Domain + SSL süre kontrolü |
| `npm run uptimerobot:setup` | Health monitor keyword + alert |
| `npm run contacts:check` | D1’de yeni form kayıtları |
| `npm run zone:configure` | Ücretsiz zone ayarları |

---

## GitHub Actions

| Workflow | Tetik | Görev |
|----------|-------|--------|
| `ci.yml` | PR / push | test, lint |
| `deploy.yml` | push `main` | D1 migrate + `wrangler deploy` |
| `expiry-check.yml` | haftalık | domain/SSL < 30 gün → GitHub issue |
| `contact-digest.yml` | **sadece manuel** | Brevo yedek digest (issue) |

---

## UptimeRobot

| Monitor | Durum |
|---------|--------|
| Health `https://elifnurcicekdagi.com/health` | ✅ keyword `"ok":true`, e-posta `mst4fa@gmail.com` |
| SSL / ana sayfa HTTPS | ⚠️ **Manuel** — free plan API `newMonitor` engelli; dashboard’dan ekle |

---

## Hestia CLI (sık kullanılan)

```bash
export PATH=/usr/local/hestia/bin:$PATH

v-list-mail-domains admin
v-list-mail-account admin elifnurcicekdagi.com info
v-list-mail-domain-dkim-dns admin elifnurcicekdagi.com
v-change-mail-account-password admin elifnurcicekdagi.com info 'YENİ_PAROLA'
v-add-letsencrypt-domain admin elifnurcicekdagi.com webmail.elifnurcicekdagi.com,mail.elifnurcicekdagi.com yes
```

---

## Yapılanlar kronolojisi

| Tarih | Ne yapıldı |
|-------|------------|
| 2026-06 | Worker sitesi: D1, KV, Turnstile, contact API, CI/CD, DNSSEC, analytics |
| 2026-06-10 | Hestia’da `elifnurcicekdagi.com` mail domain + `info@` |
| 2026-06-10 | Cloudflare mail DNS (MX, SPF, DKIM, DMARC, mail/webmail A) |
| 2026-06-10 | Brevo domain auth (brevo-code, brevo1/2 DKIM) |
| 2026-06-10 | Webmail Let’s Encrypt (`mail` + `webmail` SAN) |
| 2026-06-10 | Worker `BREVO_API_KEY` secret; form → Brevo → `info@` |
| 2026-06-10 | PTR → `web.typecalendar.com` (Hostinger) |
| 2026-06-10 | `info@` parola rotasyonu |
| 2026-06-10 | Eski `setup-email-dns.mjs` (Zoho) silindi → `setup-hestia-mail-dns.mjs` |
| 2026-06-10 | Saatlik `contact-digest` kapatıldı; `new-hostinger.md` gitignore |
| 2026-06-10 | Git `36edaed` — mail tooling + contact sender fix push |
| 2026-06-10 | `OPERATIONS.md` runbook eklendi |
| 2026-06-10 | GitHub Actions → Node 24 (`checkout@v5`, `setup-node@v5`, `wrangler-action@v4`, `github-script@v8`) |
| 2026-06-10 | `/health` genişletildi + `/health/dashboard` operasyon paneli |
| 2026-06-10 | Dinamik `robots.txt`, `sitemap.xml`, `llms.txt` + özel `404` sayfası |
| 2026-06-10 | Favicon/OG düzeltmesi — UTF-8 `ğı`, `og-image.png`, `apple-touch-icon.png` |
| 2026-06-10 | API v1 — içerik (pages/projects), admin key, rate limit, audit log, CORS |
| 2026-06-10 | Premium landing page — React/Vite/Tailwind/Framer (`elif-nur-landing/`) |

---

## Ana sayfa (landing)

Kaynak: `elif-nur-landing/` — React 18, TypeScript, Vite, Tailwind, Framer Motion, Lucide.

Bölümler (sıra): Hero → Marquee → About → Experiences → Journeys → Footer.

```bash
cd elif-nur-landing && npm ci && npm run build
# çıktı: elif-nur-worker/public/index.html + assets/
cd ../elif-nur-worker && npm run deploy
```

- Ana sayfa `GET /api/v1/site` ile dinamik (hero, about, journeys, nav)
- Admin UI: **https://elifnurcicekdagi.com/admin/** — key yalnızca girişte; oturum HttpOnly çerez (JS erişemez)
- Görseller: Unsplash fallback; `landing.hero.portraitUrl` veya proje `meta.images` ile değiştir

---

## SEO ve keşif dosyaları (Worker — dinamik)

| URL | Kaynak | Not |
|-----|--------|-----|
| `/robots.txt` | `src/seo/robots.ts` | `/api/`, `/health` disallow |
| `/sitemap.xml` | `src/seo/sitemap.ts` | `PUBLIC_ROUTES` listesinden üretilir |
| `/llms.txt` | `src/seo/llms.ts` | LLM özet / sayfa linkleri |
| `404` | `public/404.html` | Bilinmeyen HTML yolları |

Yeni sayfa eklerken: `src/seo/site-routes.ts` → `PUBLIC_ROUTES` güncelle (sitemap + llms otomatik).

---

## API v1 (içerik — güvenlik öncelikli)

| Katman | Uygulama |
|--------|----------|
| Routing | `GET/POST/PATCH/DELETE` → `/api/v1/*` (`src/api/v1/router.ts`) |
| Yanıt | `{ ok, data\|error, meta }` — `requestId` her istekte |
| CORS | Yalnızca `https://elifnurcicekdagi.com` ve `www` — wildcard yok |
| Rate limit | KV: okuma 120/dk/IP, admin 30/dk/IP |
| Public | Yalnızca `GET`; D1 `status = 'published'` |
| Admin | `ADMIN_API_KEY` (curl/script) veya **HttpOnly oturum çerezi** (tarayıcı UI, 8 saat, KV) |
| Legacy | `POST /api/contact` ayrı (Turnstile) — değiştirilmedi |

### Endpoint özeti

| Yöntem | Yol | Kimlik |
|--------|-----|--------|
| GET | `/api/v1` | Keşif / şema |
| GET | `/api/v1/site` | Tüm public veri (pages, projects, nav, settings) |
| GET | `/api/v1/resolve?path=/hakkimda` | Path → içerik |
| GET | `/api/v1/pages`, `/pages/:slug`, `/pages/by-path/...` | Yayınlanmış |
| GET | `/api/v1/pages?type=blog` | Blog filtresi |
| GET | `/api/v1/projects` | Yayınlanmış projeler |
| GET | `/api/v1/admin/pages` | Tüm sayfalar (draft dahil) |
| GET/POST/PATCH/DELETE | `/api/v1/admin/pages/:slug` | Admin CRUD |
| GET/POST/PATCH/DELETE | `/api/v1/admin/projects/:slug` | Admin CRUD |
| GET/PUT/PATCH/DELETE | `/api/v1/admin/settings/:key` | Site ayarları (JSON) |
| GET | `/api/v1/admin/audit?limit=50` | Audit log |

Dinamik HTML: D1’de `published` + `page_type != landing` olan path’ler Worker tarafından render edilir (`/hakkimda` vb.). Statik dosyalar (`/iletisim`) önceliklidir.

### D1 tabloları

- `content_pages` — slug, **path**, page_type, meta_json, SEO, nav, status
- `content_projects` — journeys; meta_json, SEO
- `site_settings` — `landing.*`, `site.*` JSON blob’ları
- `api_audit_log` — admin işlemleri (IP hash)

Migration: `0003_content_api.sql`, `0004_dynamic_cms.sql`

### Kurulum (ilk kez veya yeni migration)

```bash
set -a && source all.env && set +a
cd elif-nur-worker
npx wrangler d1 migrations apply elif-nur-db --remote
openssl rand -hex 32   # ADMIN_API_KEY üret → all.env
npm run admin:apply-secret
npm run content:seed
npm run deploy
```

Örnek admin isteği:

```bash
curl -sS -X POST "https://elifnurcicekdagi.com/api/v1/admin/pages" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug":"hakkimda","title":"Hakkımda","bodyMd":"...","status":"published"}'
```

`robots.txt` tüm `/api/` yolunu disallow eder (admin dahil).

---

## Operasyon paneli

| URL | Açıklama |
|-----|----------|
| `GET /health` | JSON — bindings, secrets (bool), D1 istatistik, probe’lar, infra özeti, API listesi |
| `GET /health/dashboard` | HTML panel — canlı durum, 60s otomatik yenileme, `noindex` |

UptimeRobot hâlâ `/health` + `"ok":true` ile çalışır (`ok` = D1 erişilebilir).

---

## Açık / isteğe bağlı işler

- [ ] UptimeRobot SSL monitörü (dashboard, manuel)
- [ ] DMARC `p=quarantine` → izleme sonrası sıkılaştırma
- [ ] Exim frozen kuyruk mesajları (eski `root@` — düşük öncelik)

---

## Sorun giderme

| Belirti | Kontrol |
|---------|---------|
| Form 503 | `TURNSTILE_SECRET_KEY` secret var mı |
| Form OK, mail yok | Brevo domain/sender; `npm run brevo:verify` |
| IMAP auth fail | Hestia parola; `doveadm auth test info@...` (sunucuda) |
| Giden mail fail | Exim log `/var/log/exim4/mainlog`; Brevo relay |
| Webmail SSL | `v-list-mail-domain admin elifnurcicekdagi.com` → SSL yes |
| DNS | `dig MX/TXT mail._domainkey elifnurcicekdagi.com @1.1.1.1` |
| PTR | `dig -x 2.25.147.42 @1.1.1.1` |

---

## Bu dosyayı güncelleme kuralı

Altyapıda değişiklik yaptıktan sonra **bu dosyayı aynı PR/commit’te güncelle:**

- Yeni secret / env adı
- DNS veya servis değişikliği
- Kronoloji tablosuna satır
- Açık işler listesi

Parolaları ve API key **değerlerini** buraya yazma — sadece ad ve nerede saklandığı.
