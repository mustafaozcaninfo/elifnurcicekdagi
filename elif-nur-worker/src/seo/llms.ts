import { PUBLIC_ROUTES, SITE_ORIGIN, absoluteUrl } from "./site-routes";

export function renderLlmsTxt(): string {
	const pages = PUBLIC_ROUTES.map(
		(r) =>
			`- [${r.title}](${absoluteUrl(r.path)})${r.description ? `: ${r.description}` : ""}`,
	).join("\n");

	return `# Elif Nur Çiçekdağı

> ${SITE_ORIGIN} — resmi web sitesi. İletişim formu Turnstile ve KVKK onayı ile korunur.

## Sayfalar

${pages}

## İletişim

- E-posta: [info@elifnurcicekdagi.com](mailto:info@elifnurcicekdagi.com)
- Form: ${absoluteUrl("/iletisim")}

## Teknik

- Site: Cloudflare Workers
- Site haritası: ${SITE_ORIGIN}/sitemap.xml
- OG görsel: ${SITE_ORIGIN}/og-image.png
- Güvenlik: ${SITE_ORIGIN}/.well-known/security.txt

## API v1

- Keşif: GET ${SITE_ORIGIN}/api/v1
- Site bundle (SPA): GET ${SITE_ORIGIN}/api/v1/site
- İçerik: GET ${SITE_ORIGIN}/api/v1/pages, /api/v1/projects, /api/v1/resolve?path=/...
- Admin yazma: Bearer veya X-Admin-Key (sunucu secret; robots /api/ disallow)
- İletişim (legacy): POST ${SITE_ORIGIN}/api/contact
`;
}
