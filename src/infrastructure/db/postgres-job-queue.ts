import { desc, eq, sql } from "drizzle-orm";

import {
	type BackgroundJob,
	type EnqueueJobInput,
	isJobType,
	type JobFailureSummary,
	type JobPriority,
	type JobQueueRepository,
	type JobStatus,
} from "#/application/jobs.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class PostgresJobQueueRepository implements JobQueueRepository {
	constructor(private readonly database: Database) {}

	async enqueue(
		input: EnqueueJobInput & { queuedAt: Date },
	): Promise<BackgroundJob> {
		const [job] = await this.database
			.insert(schema.backgroundJobs)
			.values({
				type: input.type,
				status: "queued",
				payload: input.payload,
				priority: input.priority ?? "normal",
				attempts: 0,
				maxAttempts: input.maxAttempts ?? 3,
				queuedAt: input.queuedAt,
				updatedAt: input.queuedAt,
			})
			.returning();

		if (!job) {
			throw new Error("Background job could not be queued.");
		}

		return mapJob(job);
	}

	async markCompleted(
		jobId: string,
		completedAt: Date,
	): Promise<BackgroundJob | null> {
		const [job] = await this.database
			.update(schema.backgroundJobs)
			.set({
				status: "completed",
				errorMessage: null,
				updatedAt: completedAt,
				completedAt,
				failedAt: null,
			})
			.where(eq(schema.backgroundJobs.id, jobId))
			.returning();

		return job ? mapJob(job) : null;
	}

	async markFailed(
		jobId: string,
		input: { errorMessage: string; failedAt: Date },
	): Promise<BackgroundJob | null> {
		const [job] = await this.database
			.update(schema.backgroundJobs)
			.set({
				status: "failed",
				attempts: sql`${schema.backgroundJobs.attempts} + 1`,
				errorMessage: input.errorMessage,
				updatedAt: input.failedAt,
				failedAt: input.failedAt,
			})
			.where(eq(schema.backgroundJobs.id, jobId))
			.returning();

		return job ? mapJob(job) : null;
	}

	async retryFailed(
		jobId: string,
		retriedAt: Date,
	): Promise<BackgroundJob | null> {
		const [job] = await this.database
			.update(schema.backgroundJobs)
			.set({
				status: "retried",
				errorMessage: null,
				updatedAt: retriedAt,
				failedAt: null,
			})
			.where(sql`
				${schema.backgroundJobs.id} = ${jobId}
				and ${schema.backgroundJobs.status} = 'failed'
				and ${schema.backgroundJobs.attempts} < ${schema.backgroundJobs.maxAttempts}
			`)
			.returning();

		return job ? mapJob(job) : null;
	}

	async listFailedJobs(input: {
		limit: number;
		offset: number;
	}): Promise<readonly JobFailureSummary[]> {
		const rows = await this.database
			.select()
			.from(schema.backgroundJobs)
			.where(eq(schema.backgroundJobs.status, "failed"))
			.orderBy(desc(schema.backgroundJobs.updatedAt))
			.limit(input.limit)
			.offset(input.offset);

		return rows.map((row) => {
			const job = mapJob(row);

			return {
				id: job.id,
				type: job.type,
				payload: job.payload,
				attempts: job.attempts,
				maxAttempts: job.maxAttempts,
				errorMessage: job.errorMessage,
				queuedAt: job.queuedAt,
				failedAt: job.failedAt,
				updatedAt: job.updatedAt,
			};
		});
	}
}

function mapJob(row: typeof schema.backgroundJobs.$inferSelect): BackgroundJob {
	if (!isJobType(row.type)) {
		throw new Error(`Unsupported persisted background job type: ${row.type}`);
	}

	return {
		id: row.id,
		type: row.type,
		status: normalizeJobStatus(row.status),
		payload: row.payload,
		priority: normalizeJobPriority(row.priority),
		attempts: row.attempts,
		maxAttempts: row.maxAttempts,
		errorMessage: row.errorMessage,
		queuedAt: row.queuedAt,
		updatedAt: row.updatedAt,
		completedAt: row.completedAt,
		failedAt: row.failedAt,
	};
}

function normalizeJobStatus(value: string): JobStatus {
	if (
		value === "queued" ||
		value === "retried" ||
		value === "completed" ||
		value === "failed"
	) {
		return value;
	}

	throw new Error(`Unsupported persisted background job status: ${value}`);
}

function normalizeJobPriority(value: string): JobPriority {
	if (value === "normal" || value === "high") {
		return value;
	}

	throw new Error(`Unsupported persisted background job priority: ${value}`);
}
