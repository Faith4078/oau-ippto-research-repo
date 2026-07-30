import { describe, expect, it } from "vitest";

import { jobTypes } from "../../../src/application/jobs.ts";
import {
	InMemoryBackgroundJobWorker,
	InMemoryJobQueueRepository,
} from "../../../src/infrastructure/jobs/in-memory-job-queue.ts";

describe("in-memory background job worker", () => {
	it("drains queued jobs through registered handlers", async () => {
		const repository = new InMemoryJobQueueRepository();
		const queued = await repository.enqueue({
			type: jobTypes.searchIndexing,
			payload: { researchRecordId: "research-1" },
			queuedAt: new Date("2026-07-30T10:00:00.000Z"),
		});
		const worker = new InMemoryBackgroundJobWorker(
			repository,
			{
				search_indexing: () => undefined,
			},
			() => new Date("2026-07-30T10:01:00.000Z"),
		);

		const processed = await worker.drain();

		expect(processed).toEqual([
			expect.objectContaining({
				id: queued.id,
				status: "completed",
				completedAt: new Date("2026-07-30T10:01:00.000Z"),
			}),
		]);
	});

	it("marks jobs failed when no handler exists", async () => {
		const repository = new InMemoryJobQueueRepository();
		await repository.enqueue({
			type: jobTypes.keywordExtraction,
			payload: { researchRecordId: "research-1" },
			queuedAt: new Date("2026-07-30T10:00:00.000Z"),
		});
		const worker = new InMemoryBackgroundJobWorker(repository, {});

		const processed = await worker.drain();

		expect(processed).toEqual([
			expect.objectContaining({
				status: "failed",
				errorMessage: "No handler registered for keyword_extraction.",
			}),
		]);
	});
});
