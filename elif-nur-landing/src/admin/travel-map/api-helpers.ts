export function notifyApiError(
	res: { status: number; error?: string },
	fallback: string,
	notify: (msg: string) => void,
) {
	if (res.status === 401) {
		notify("Oturum süresi dolmuş — yeniden giriş yapın");
		return;
	}
	notify(`HTTP ${res.status}: ${res.error ?? fallback}`);
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
