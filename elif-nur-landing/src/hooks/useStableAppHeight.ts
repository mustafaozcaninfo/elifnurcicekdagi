import { useEffect } from "react";

/** Lock --app-h to layout viewport height; ignore iOS keyboard shrink. */
export function useStableAppHeight(enabled: boolean) {
	useEffect(() => {
		if (!enabled || typeof window === "undefined") return;

		const apply = () => {
			document.documentElement.style.setProperty("--app-h", `${window.innerHeight}px`);
		};

		apply();
		window.addEventListener("orientationchange", apply);
		const t = window.setTimeout(apply, 150);

		return () => {
			window.clearTimeout(t);
			window.removeEventListener("orientationchange", apply);
			document.documentElement.style.removeProperty("--app-h");
		};
	}, [enabled]);
}
