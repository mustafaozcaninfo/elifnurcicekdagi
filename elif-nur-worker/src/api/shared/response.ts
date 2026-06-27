export type ApiErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "METHOD_NOT_ALLOWED"
	| "PAYLOAD_TOO_LARGE"
	| "RATE_LIMITED"
	| "INTERNAL_ERROR";

export type ApiMeta = {
	version: "1";
	requestId: string;
};

export type ApiSuccess<T> = {
	ok: true;
	data: T;
	meta: ApiMeta;
};

export type ApiFailure = {
	ok: false;
	error: {
		code: ApiErrorCode;
		message: string;
	};
	meta: ApiMeta;
};

export function createRequestId(): string {
	return crypto.randomUUID();
}

export function jsonOk<T>(
	data: T,
	meta: ApiMeta,
	init: ResponseInit = {},
): Response {
	return Response.json(
		{ ok: true, data, meta } satisfies ApiSuccess<T>,
		{
			...init,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store",
				...init.headers,
			},
		},
	);
}

export function jsonError(
	code: ApiErrorCode,
	message: string,
	meta: ApiMeta,
	status: number,
): Response {
	return Response.json(
		{ ok: false, error: { code, message }, meta } satisfies ApiFailure,
		{
			status,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store",
			},
		},
	);
}

export const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	PAYLOAD_TOO_LARGE: 413,
	RATE_LIMITED: 429,
	INTERNAL_ERROR: 500,
};
