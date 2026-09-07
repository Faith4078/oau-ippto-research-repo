import { describe, expect, it, vi } from "vitest";

import {
	createAccountAdministrationService,
	type AccountAdministrationRepository,
} from "../../../src/application/account-administration.ts";
import type { AuthenticatedActor } from "../../../src/application/authorization.ts";
import type { EntityId } from "../../../src/domain/common.ts";

const userId = "00000000-0000-4000-8000-000000000501" as EntityId;
const actor: AuthenticatedActor = {
	userId: "00000000-0000-4000-8000-000000000502" as EntityId,
	status: "active",
	roles: [{ role: "super_administrator" }],
};

function createRepository(): AccountAdministrationRepository {
	return {
		listPending: vi.fn(async () => []),
		findById: vi.fn(async () => ({
			id: userId,
			staffId: "AC/1234",
			name: "Amina Adeyemi",
			email: "amina@oauife.edu.ng",
			status: "pending" as const,
			createdAt: new Date("2026-01-01T00:00:00Z"),
			facultyId: null,
			departmentId: null,
		})),
		applyStatusTransition: vi.fn(async () => true),
	};
}

describe("account administration service", () => {
	it("rejects callers without user-management permission", async () => {
		const service = createAccountAdministrationService({
			repository: createRepository(),
			notifications: { sendStatus: vi.fn() },
		});
		const result = await service.listPending(null);
		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.error.code).toBe("AUTHENTICATION_REQUIRED");
	});

	it("persists and notifies an approved pending account", async () => {
		const repository = createRepository();
		const sendStatus = vi.fn(async () => undefined);
		const service = createAccountAdministrationService({
			repository,
			notifications: { sendStatus },
		});
		const result = await service.review(actor, {
			userId,
			status: "active",
			reason: null,
			ipAddress: "127.0.0.1",
			userAgent: "test",
		});
		expect(result).toEqual({ ok: true, value: { userId, status: "active" } });
		expect(repository.applyStatusTransition).toHaveBeenCalledWith(
			expect.objectContaining({ expectedStatus: "pending", actorId: actor.userId }),
		);
		expect(sendStatus).toHaveBeenCalledWith(
			expect.objectContaining({ to: "amina@oauife.edu.ng", status: "active" }),
		);
	});

	it("reports a concurrent status conflict without sending email", async () => {
		const repository = createRepository();
		repository.applyStatusTransition = vi.fn(async () => false);
		const sendStatus = vi.fn(async () => undefined);
		const service = createAccountAdministrationService({ repository, notifications: { sendStatus } });
		const result = await service.review(actor, { userId, status: "active", reason: null, ipAddress: null, userAgent: null });
		expect(result.ok ? null : result.error.code).toBe("ACCOUNT_STATUS_CONFLICT");
		expect(sendStatus).not.toHaveBeenCalled();
	});

	it("keeps a completed account update successful when status email delivery fails", async () => {
		const repository = createRepository();
		const sendStatus = vi.fn(async () => {
			throw new Error("Email provider unavailable");
		});
		const service = createAccountAdministrationService({
			repository,
			notifications: { sendStatus },
		});

		const result = await service.review(actor, {
			userId,
			status: "active",
			reason: null,
			ipAddress: null,
			userAgent: null,
		});

		expect(result).toEqual({
			ok: true,
			value: { userId, status: "active" },
		});
		expect(repository.applyStatusTransition).toHaveBeenCalledOnce();
		expect(sendStatus).toHaveBeenCalledOnce();
	});
});
