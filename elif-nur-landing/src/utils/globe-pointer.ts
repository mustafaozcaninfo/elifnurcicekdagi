/** Let orbit drag pass through arcs, labels, and country polygons — only city dots capture clicks. */
export function globePointerEventsFilter(obj: unknown, data: unknown): boolean {
	if (!data || typeof data !== "object") return false;

	const row = data as Record<string, unknown>;

	if ("startLat" in row && "endLat" in row) return false;
	if (row.type === "Feature") return false;

	if ("id" in row && "lat" in row && "name" in row) {
		const mesh = obj as { type?: string; isPoints?: boolean };
		return mesh.type === "Points" || mesh.isPoints === true;
	}

	return false;
}
