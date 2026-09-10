export default class PgNativeUnavailable {
	constructor() {
		throw new Error(
			"pg-native is unavailable; use node-postgres's default JavaScript driver.",
		);
	}
}
