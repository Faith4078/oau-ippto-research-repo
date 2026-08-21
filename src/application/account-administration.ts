import {
	type ReviewableAccountStatus,
	validateAccountStatusTransition,
} from "#/domain/account-status.ts";
import type { EntityId } from "#/domain/common.ts";
import type { UserStatus } from "#/domain/organization.ts";
import { permissions } from "#/domain/permissions.ts";

import { type AuthenticatedActor, requirePermission } from "./authorization.ts";
import { fail, ok, type Result } from "./result.ts";

export type AccountSummary = {
	id: EntityId;
	staffId: string;
	name: string;
	email: string;
	status: UserStatus;
	createdAt: Date;
	facultyId: EntityId | null;
	departmentId: EntityId | null;
};

export type AccountAdministrationRepository = {
	listPending(): Promise<readonly AccountSummary[]>;
	findById(userId: EntityId): Promise<AccountSummary | null>;
	applyStatusTransition(input: {
		actorId: EntityId;
		userId: EntityId;
		expectedStatus: UserStatus;
		status: ReviewableAccountStatus;
		reason: string | null;
		ipAddress: string | null;
		userAgent: string | null;
	}): Promise<boolean>;
};

export type AccountNotificationSender = {
	sendStatus(input: {
		to: string;
		status: ReviewableAccountStatus;
		reason: string | null;
	}): Promise<void>;
};

export function createAccountAdministrationService(dependencies: {
	repository: AccountAdministrationRepository;
	notifications: AccountNotificationSender;
}) {
	return {
		async listPending(actor: AuthenticatedActor | null) {
			const authorization = requirePermission(actor, permissions.manageUsers);
			if (!authorization.ok) return authorization;
			return ok(await dependencies.repository.listPending());
		},

		async review(
			actor: AuthenticatedActor | null,
			input: {
				userId: EntityId;
				status: ReviewableAccountStatus;
				reason: string | null;
				ipAddress: string | null;
				userAgent: string | null;
			},
		): Promise<Result<{ userId: EntityId; status: ReviewableAccountStatus }>> {
			const authorization = requirePermission(actor, permissions.manageUsers);
			if (!authorization.ok) return authorization;
			const account = await dependencies.repository.findById(input.userId);
			if (!account) return fail("ACCOUNT_NOT_FOUND", "Account was not found.");
			const transition = validateAccountStatusTransition(
				account.status,
				input.status,
				input.reason,
			);
			if (!transition.ok)
				return fail("INVALID_ACCOUNT_TRANSITION", transition.message);
			const updated = await dependencies.repository.applyStatusTransition({
				...input,
				actorId: authorization.value.userId,
				expectedStatus: account.status,
			});
			if (!updated)
				return fail(
					"ACCOUNT_STATUS_CONFLICT",
					"The account changed while it was being reviewed. Refresh and try again.",
				);
			try {
				await dependencies.notifications.sendStatus({
					to: account.email,
					status: input.status,
					reason: input.reason,
				});
			} catch {
				return fail(
					"ACCOUNT_NOTIFICATION_FAILED",
					"The account was updated, but its status email could not be delivered.",
				);
			}
			return ok({ userId: account.id, status: input.status });
		},
	};
}

export type AccountAdministrationService = ReturnType<
	typeof createAccountAdministrationService
>;
