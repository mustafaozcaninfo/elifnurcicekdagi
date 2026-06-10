export const CSP = [
	"default-src 'self'",
	"script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https:",
	"font-src 'self'",
	"connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
	"frame-src https://challenges.cloudflare.com",
	"base-uri 'self'",
	"form-action 'self'",
	"object-src 'none'",
	"upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
	"strict-transport-security": "max-age=31536000; includeSubDomains; preload",
	"x-content-type-options": "nosniff",
	"x-frame-options": "SAMEORIGIN",
	"referrer-policy": "strict-origin-when-cross-origin",
	"permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
	"content-security-policy": CSP,
};

export function applySecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
