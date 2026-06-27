import { useCallback, useEffect, useState } from "react";
import {
	companionToHash,
	hashToCompanion,
	type CompanionFilter,
} from "../utils/companion-filter";

function readCompanion(): CompanionFilter {
	if (typeof window === "undefined") return "all";
	return hashToCompanion(window.location.hash);
}

export function useCompanionFilter() {
	const [companion, setCompanionState] = useState<CompanionFilter>(readCompanion);

	useEffect(() => {
		const onHash = () => setCompanionState(readCompanion());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	const setCompanion = useCallback((next: CompanionFilter) => {
		const hash = companionToHash(next);
		if (hash) {
			window.location.hash = hash.slice(1);
		} else if (window.location.hash) {
			history.replaceState(null, "", window.location.pathname + window.location.search);
		}
		setCompanionState(next);
	}, []);

	return { companion, setCompanion };
}
