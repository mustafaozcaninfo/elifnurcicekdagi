import type { TravelMapCity } from "../../data/travel-map";
import { isAnchorCity, isWithSpouse } from "../../utils/companion-filter";

export type WaypointMarkerCity = TravelMapCity & {
	selected?: boolean;
	hovered?: boolean;
};

function hubIcon(code: string): string {
	return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#F0C14B" stroke-width="1.5" fill="rgba(240,193,75,0.15)"/>
    <path d="M12 5 L13.5 10 L19 11.5 L13.5 13 L12 18 L10.5 13 L5 11.5 L10.5 10 Z" fill="#F0C14B"/>
    <text x="12" y="22" text-anchor="middle" fill="#F0C14B" font-size="5" font-family="Kanit,sans-serif" font-weight="600">${code}</text>
  </svg>`;
}

function homeIcon(): string {
	return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 11 L12 4 L20 11 V20 H15 V14 H9 V20 H4 Z" fill="rgba(194,91,63,0.35)" stroke="#C25B3F" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
}

function spouseIcon(): string {
	return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="rgba(245,237,228,0.12)" stroke="#F5EDE4" stroke-width="1.2"/>
    <path d="M12 8.5 C10.5 6.5 7.5 7 7.5 9.5 C7.5 12 12 15 12 15 C12 15 16.5 12 16.5 9.5 C16.5 7 13.5 6.5 12 8.5 Z" fill="#F5EDE4"/>
  </svg>`;
}

function soloIcon(): string {
	return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="rgba(133,184,203,0.15)" stroke="#85B8CB" stroke-width="1.2"/>
    <circle cx="12" cy="9.5" r="2.5" fill="#85B8CB"/>
    <path d="M7 18 C7 14.5 9 13 12 13 C15 13 17 14.5 17 18" stroke="#85B8CB" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

function markerSvg(city: WaypointMarkerCity): string {
	if (city.role === "hub") return hubIcon(city.airportCode ?? "DOH");
	if (city.role === "home") return homeIcon();
	if (isWithSpouse(city)) return spouseIcon();
	return soloIcon();
}

function markerClass(city: WaypointMarkerCity): string {
	const parts = ["deck-waypoint"];
	if (city.role === "hub") parts.push("deck-waypoint--hub");
	if (city.role === "home") parts.push("deck-waypoint--home");
	if (isWithSpouse(city)) parts.push("deck-waypoint--spouse");
	else if (!isAnchorCity(city)) parts.push("deck-waypoint--solo");
	if (city.selected) parts.push("deck-waypoint--selected");
	if (city.hovered) parts.push("deck-waypoint--hover");
	return parts.join(" ");
}

export function renderWaypointEl(
	city: WaypointMarkerCity,
	onSelect?: (city: TravelMapCity) => void,
): HTMLDivElement {
	const el = document.createElement("div");
	el.className = markerClass(city);
	el.dataset.cityId = city.id;
	el.innerHTML = markerSvg(city);
	el.title = city.name;

	if (onSelect) {
		el.style.pointerEvents = "auto";
		el.style.cursor = "pointer";
		el.onclick = (e) => {
			e.stopPropagation();
			onSelect(city);
		};
	} else {
		el.style.pointerEvents = "none";
	}

	return el;
}
