export type GlobeCameraApi = {
	pointOfView: (pov: { lat?: number; lng?: number; altitude?: number }, ms?: number) => void;
	controls: () => GlobeControls | null;
};

export type GlobeControls = {
	autoRotate: boolean;
	autoRotateSpeed: number;
	enableZoom: boolean;
	enableRotate: boolean;
	enablePan: boolean;
	zoomSpeed: number;
	rotateSpeed: number;
	minDistance: number;
	maxDistance: number;
	target?: { set: (x: number, y: number, z: number) => void };
	update?: () => void;
};

export function resetOrbitTarget(ctrl: GlobeControls | null | undefined) {
	if (!ctrl?.target) return;
	ctrl.target.set(0, 0, 0);
	ctrl.update?.();
}

export function flyToCity(
	globe: GlobeCameraApi,
	lat: number,
	lng: number,
	altitude: number,
	durationMs = 900,
) {
	const ctrl = globe.controls();
	resetOrbitTarget(ctrl);
	globe.pointOfView({ lat, lng, altitude }, durationMs);
}

export function recenterOverview(
	globe: GlobeCameraApi,
	lat: number,
	lng: number,
	mobile: boolean,
	durationMs = 700,
) {
	flyToCity(globe, lat, lng, mobile ? 2.15 : 2.05, durationMs);
}
