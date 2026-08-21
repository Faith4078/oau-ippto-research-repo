import type { UserStatus } from "./organization.ts";

export type ReviewableAccountStatus =
	| "active"
	| "rejected"
	| "suspended"
	| "deactivated";

const transitions: Record<UserStatus, readonly ReviewableAccountStatus[]> = {
	invited: ["active", "deactivated"],
	pending: ["active", "rejected"],
	active: ["suspended", "deactivated"],
	rejected: ["active", "deactivated"],
	suspended: ["active", "deactivated"],
	deactivated: ["active"],
};

export function validateAccountStatusTransition(
	from: UserStatus,
	to: ReviewableAccountStatus,
	reason: string | null,
): { ok: true } | { ok: false; message: string } {
	if (!transitions[from].includes(to)) {
		return {
			ok: false,
			message: `Account status cannot change from ${from} to ${to}.`,
		};
	}

	if (to !== "active" && !reason?.trim()) {
		return {
			ok: false,
			message: "A reason is required for this account action.",
		};
	}

	return { ok: true };
}
