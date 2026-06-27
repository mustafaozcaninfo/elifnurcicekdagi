import type { ContentPageRow } from "../api/v1/content/types";
import { PAGE_SELECT } from "../api/v1/content/types";

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function markdownToHtml(md: string): string {
	return md
		.split(/\n{2,}/)
		.map((block) => {
			const t = block.trim();
			if (!t) return "";
			if (t.startsWith("## ")) {
				return `<h2>${escapeHtml(t.slice(3))}</h2>`;
			}
			if (t.startsWith("# ")) {
				return `<h1>${escapeHtml(t.slice(2))}</h1>`;
			}
			return `<p>${escapeHtml(t).replace(/\n/g, "<br>")}</p>`;
		})
		.filter(Boolean)
		.join("\n");
}

export function renderDynamicPageHtml(page: ContentPageRow): string {
	const title = escapeHtml(page.seo_title ?? page.title);
	const description = escapeHtml(page.seo_description ?? page.excerpt ?? "");
	const body = markdownToHtml(page.body_md);
	const canonical = `https://elifnurcicekdagi.com${page.path === "/" ? "/" : page.path}`;

	return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${description}" />
  <title>${title} — Elif Nur Çiçekdağı</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="https://elifnurcicekdagi.com/og-image.png" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Kanit", system-ui, sans-serif;
      background: #0f0a05;
      color: #f5ede4;
      line-height: 1.7;
      padding: 2rem 1.25rem 4rem;
    }
    .wrap { max-width: 720px; margin: 0 auto; }
    nav { margin-bottom: 2rem; font-size: 0.85rem; }
    nav a { color: #c25b3f; text-decoration: none; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 600; margin-bottom: 1rem; }
    h2 { font-size: 1.35rem; margin: 1.5rem 0 0.75rem; color: #e8d5b8; }
    p { margin-bottom: 1rem; color: #f5ede4cc; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #ffffff15; font-size: 0.8rem; color: #8c7a6b; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav><a href="/">← Ana sayfa</a></nav>
    <main>
      <h1>${escapeHtml(page.title)}</h1>
      ${body}
    </main>
    <footer>
      <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy</a>
    </footer>
  </div>
</body>
</html>`;
}

export async function fetchPublishedPageByPath(
	db: D1Database,
	path: string,
): Promise<ContentPageRow | null> {
	return db
		.prepare(`SELECT ${PAGE_SELECT} FROM content_pages WHERE path = ? AND status = 'published'`)
		.bind(path)
		.first<ContentPageRow>();
}
