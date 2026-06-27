import { useEffect, useState } from "react";

const MOBILE_MAX = 767;

export function useIsMobile(): boolean {
	const [mobile, setMobile] = useState(() =>
		typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false,
	);

	useEffect(() => {
		const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
		const sync = () => setMobile(mq.matches);
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	return mobile;
}
