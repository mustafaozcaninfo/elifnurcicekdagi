const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export function analyticsSnippet(token: string): string {
	const payload = JSON.stringify({ token });
	return `<script defer src="${BEACON_SRC}" data-cf-beacon='${payload}'></script>`;
}

export async function injectAnalytics(
	response: Response,
	token?: string,
): Promise<Response> {
	if (!token) return response;

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) return response;

	const html = await response.text();
	if (!html.includes("</body>") || html.includes(BEACON_SRC)) {
		return new Response(html, response);
	}

	const injected = html.replace("</body>", `${analyticsSnippet(token)}</body>`);
	const headers = new Headers(response.headers);
	headers.delete("content-length");
	return new Response(injected, { status: response.status, headers });
}
