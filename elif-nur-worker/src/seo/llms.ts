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
- Güvenlik: ${SITE_ORIGIN}/.well-known/security.txt

## API (geliştirme aşamasında)

- Durum: ${SITE_ORIGIN}/health
- İletişim API: POST ${SITE_ORIGIN}/api/contact
`;
}
