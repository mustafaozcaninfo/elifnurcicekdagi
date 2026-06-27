import { hashIp } from "./request";

export async function logApiAudit(
	db: D1Database,
	params: {
		actor: string;
		action: string;
		resource: string;
		resourceId?: string;
		ip: string;
	},
): Promise<void> {
	try {
		await db
			.prepare(
				`INSERT INTO api_audit_log (actor, action, resource, resource_id, ip_hash)
         VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(
				params.actor,
				params.action,
				params.resource,
				params.resourceId ?? null,
				await hashIp(params.ip),
			)
			.run();
	} catch (e) {
		console.error("audit_log_failed", String(e));
	}
}
