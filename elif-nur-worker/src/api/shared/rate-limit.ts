import { hashIp } from "./request";

export async function consumeRateLimit(
	kv: KVNamespace,
	ip: string,
	bucket: string,
	max: number,
	windowSec: number,
): Promise<boolean> {
	const key = `api:${bucket}:${await hashIp(ip)}`;
	const current = Number((await kv.get(key)) ?? "0");
	if (current >= max) return false;
	await kv.put(key, String(current + 1), { expirationTtl: windowSec });
	return true;
}
