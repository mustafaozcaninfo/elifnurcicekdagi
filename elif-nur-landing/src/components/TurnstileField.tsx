import { useEffect, useRef } from "react";

/** Public site key — matches wrangler.jsonc TURNSTILE_SITE_KEY */
export const TURNSTILE_SITE_KEY = "0x4AAAAAADh3UKIeub4N8frd";

type TurnstileApi = {
	render: (
		el: HTMLElement,
		options: {
			sitekey: string;
			theme?: "light" | "dark" | "auto";
			callback?: (token: string) => void;
			"expired-callback"?: () => void;
		},
	) => string;
	reset: (widgetId?: string) => void;
	remove: (widgetId: string) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
		onTurnstileLoad?: () => void;
	}
}

type Props = {
	onToken: (token: string) => void;
	onExpire: () => void;
	resetKey?: number;
};

function loadTurnstileScript(): Promise<void> {
	if (window.turnstile) return Promise.resolve();
	return new Promise((resolve) => {
		window.onTurnstileLoad = () => resolve();
		const existing = document.querySelector('script[src*="turnstile"]');
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			return;
		}
		const script = document.createElement("script");
		script.src =
			"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);
	});
}

export default function TurnstileField({ onToken, onExpire, resetKey = 0 }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const mount = async () => {
			await loadTurnstileScript();
			if (cancelled || !containerRef.current || !window.turnstile) return;

			if (widgetIdRef.current) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}

			widgetIdRef.current = window.turnstile.render(containerRef.current, {
				sitekey: TURNSTILE_SITE_KEY,
				theme: "dark",
				callback: onToken,
				"expired-callback": onExpire,
			});
		};

		mount();

		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}
		};
	}, [onToken, onExpire, resetKey]);

	return <div ref={containerRef} className="min-h-[65px]" aria-hidden={false} />;
}
