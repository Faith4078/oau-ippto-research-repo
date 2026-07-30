import { describe, expect, it } from "vitest";

import type { AuthenticatedActor } from "../../../src/application/authorization.ts";
import {
	createBackgroundJobsService,
	type JobQueueRepository,
	jobTypes,
} from "../../../src/application/jobs.ts";
import { InMemoryJobQueueRepository } from "../../../src/infrastructure/jobs/in-memory-job-queue.ts";

const superAdmin: AuthenticatedActor = {
	userId: "user-1",
	status: "active",
	roles: [
		{
			role: "super_administrator",
		},
	],
};

const lecturer: AuthenticatedActor = {
	userId: "user-2",
	status: "active",
	roles: [
		{
			role: "lecturer",
			facultyId: "faculty-1",
			departmentId: "department-1",
		},
	],
};

describe("background jobs application service", () => {
	it("queues supported AI and processing job types with retry tracking", async () => {
		const repository = new InMemoryJobQueueRepository();
		const service = createBackgroundJobsService({
			jobQueueRepository: repository,
			now: () => new Date("2026-07-30T10:00:00.000Z"),
		});

		const result = await service.enqueue({
			type: jobTypes.aiSummary,
			payload: { researchRecordId: "research-1" },
			maxAttempts: 2,
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value : null).toMatchObject({
			type: "ai_summary",
			status: "queued",
			attempts: 0,
			maxAttempts: 2,
		});

		const failed = await service.fail(
			result.ok ? result.value.id : "missing",
			"AI provider timeout",
		);
		expect(failed.ok ? failed.value.status : null).toBe("failed");

		const retried = await service.retry(result.ok ? result.value.id : "missing");
		expect(retried.ok ? retried.value.status : null).toBe("retried");
	});

	it("exposes failed jobs only to super administrators", async () => {
		const repository = new InMemoryJobQueueRepository();
		const service = createBackgroundJobsService({
			jobQueueRepository: repository,
			now: () => new Date("2026-07-30T10:00:00.000Z"),
		});
		const queued = await service.enqueue({
			type: jobTypes.documentMetadataExtraction,
			payload: { fileId: "file-1" },
		});

		await service.fail(queued.ok ? queued.value.id : "missing", "PDF parse failed");

		expect(await service.listFailedJobs(lecturer)).toEqual({
			ok: false,
			error: {
				code: "FORBIDDEN",
				message: "You do not have permission to perform this action.",
			},
		});

		const failedJobs = await service.listFailedJobs(superAdmin);

		expect(failedJobs.ok).toBe(true);
		expect(failedJobs.ok ? failedJobs.value : []).toEqual([
			expect.objectContaining({
				type: "document_metadata_extraction",
				errorMessage: "PDF parse failed",
			}),
		]);
	});

	it("rejects unsupported job types before hitting the queue", async () => {
		const repository: JobQueueRepository = {
			async enqueue() {
				throw new Error("not used");
			},
			async markCompleted() {
				throw new Error("not used");
			},
			async markFailed() {
				throw new Error("not used");
			},
			async retryFailed() {
				throw new Error("not used");
			},
			async listFailedJobs() {
				throw new Error("not used");
			},
		};
		const service = createBackgroundJobsService({
			jobQueueRepository: repository,
		});

		const result = await service.enqueue({
			type: "unknown" as never,
			payload: {},
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "INVALID_JOB_TYPE",
				message: "The background job type is not supported.",
			},
		});
	});
});
