const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle interpolation — t in [0, 1]. */
export function interpolateFlight(
	startLat: number,
	startLng: number,
	endLat: number,
	endLng: number,
	t: number,
): { lat: number; lng: number; bearing: number } {
	const φ1 = toRad(startLat);
	const λ1 = toRad(startLng);
	const φ2 = toRad(endLat);
	const λ2 = toRad(endLng);

	const Δ =
		2 *
		Math.asin(
			Math.sqrt(
				Math.sin((φ2 - φ1) / 2) ** 2 +
					Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
			),
		);

	if (Δ < 1e-10) {
		return { lat: startLat, lng: startLng, bearing: 0 };
	}

	const a = Math.sin((1 - t) * Δ) / Math.sin(Δ);
	const b = Math.sin(t * Δ) / Math.sin(Δ);
	const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
	const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
	const z = a * Math.sin(φ1) + b * Math.sin(φ2);
	const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
	const lng = toDeg(Math.atan2(y, x));

	const θ = Math.atan2(
		Math.sin(λ2 - λ1) * Math.cos(φ2),
		Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1),
	);
	const bearing = (toDeg(θ) + 360) % 360;

	return { lat, lng, bearing };
}

export function flightAltitudeFt(t: number): number {
	const climb = Math.min(t / 0.18, 1);
	const cruise = t < 0.82 ? 1 : 1 - (t - 0.82) / 0.18;
	return Math.round(800 + climb * cruise * 34_200);
}
