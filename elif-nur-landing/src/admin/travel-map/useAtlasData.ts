import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../../api/client";
import type { AirportFlightSummary, TravelFlightRecord } from "../../data/travel-map-types";
import type { AdminTravelMapResponse, TravelMapData } from "../travel-map-types";

export type FlightsPayload = {
	flights: TravelFlightRecord[];
	count: number;
	summaryByAirport: Record<string, AirportFlightSummary>;
};

export function useAtlasData(notify: (msg: string) => void) {
	const [map, setMap] = useState<TravelMapData | null>(null);
	const [flights, setFlights] = useState<FlightsPayload | null>(null);
	const [errors, setErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	const reload = useCallback(async () => {
		setLoading(true);
		const [mapRes, flightRes] = await Promise.all([
			adminFetch<AdminTravelMapResponse>("/admin/travel-map"),
			adminFetch<FlightsPayload>("/admin/travel-map/flights"),
		]);
		setLoading(false);
		if (!mapRes.ok || !mapRes.data) {
			notify(mapRes.error ?? "Harita yüklenemedi");
			return;
		}
		setMap(mapRes.data.map);
		setErrors(mapRes.data.errors ?? []);
		if (flightRes.ok && flightRes.data) setFlights(flightRes.data);
	}, [notify]);

	useEffect(() => {
		reload();
	}, [reload]);

	const flightAirports = new Set(Object.keys(flights?.summaryByAirport ?? {}));

	const cityFlags = (airportCode?: string) => {
		const iata = (airportCode ?? "").toUpperCase();
		return {
			inFlightLog: iata.length === 3 && flightAirports.has(iata),
			hasIata: iata.length >= 3,
		};
	};

	return { map, flights, errors, loading, reload, flightAirports, cityFlags };
}
