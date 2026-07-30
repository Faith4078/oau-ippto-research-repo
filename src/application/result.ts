export type ApplicationError = {
	code: string;
	message: string;
	cause?: unknown;
};

export type Result<T> =
	| {
			ok: true;
			value: T;
	  }
	| {
			ok: false;
			error: ApplicationError;
	  };

export function ok<T>(value: T): Result<T> {
	return { ok: true, value };
}

export function fail(
	code: string,
	message: string,
	cause?: unknown,
): Result<never> {
	return { ok: false, error: { code, message, cause } };
}
