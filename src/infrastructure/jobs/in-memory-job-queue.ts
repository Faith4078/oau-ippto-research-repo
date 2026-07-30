import type {
	BackgroundJob,
	EnqueueJobInput,
	JobFailureSummary,
	JobQueueRepository,
} from "#/application/jobs.ts";

type JobHandler = (job: BackgroundJob) => Promise<void> | void;

export class InMemoryJobQueueRepository implements JobQueueRepository {
	private readonly jobs = new Map<string, BackgroundJob>();
	private sequence = 0;

	async enqueue(
		input: EnqueueJobInput & { queuedAt: Date },
	): Promise<BackgroundJob> {
		const job: BackgroundJob = {
			id: `job_${++this.sequence}`,
			type: input.type,
			status: "queued",
			payload: input.payload,
			priority: input.priority ?? "normal",
			attempts: 0,
			maxAttempts: input.maxAttempts ?? 3,
			errorMessage: null,
			queuedAt: input.queuedAt,
			updatedAt: input.queuedAt,
			completedAt: null,
			failedAt: null,
		};

		this.jobs.set(job.id, job);

		return job;
	}

	async markCompleted(
		jobId: string,
		completedAt: Date,
	): Promise<BackgroundJob | null> {
		const job = this.jobs.get(jobId);

		if (!job) {
			return null;
		}

		return this.save({
			...job,
			status: "completed",
			errorMessage: null,
			updatedAt: completedAt,
			completedAt,
			failedAt: null,
		});
	}

	async markFailed(
		jobId: string,
		input: { errorMessage: string; failedAt: Date },
	): Promise<BackgroundJob | null> {
		const job = this.jobs.get(jobId);

		if (!job) {
			return null;
		}

		return this.save({
			...job,
			status: "failed",
			attempts: job.attempts + 1,
			errorMessage: input.errorMessage,
			updatedAt: input.failedAt,
			failedAt: input.failedAt,
		});
	}

	async retryFailed(
		jobId: string,
		retriedAt: Date,
	): Promise<BackgroundJob | null> {
		const job = this.jobs.get(jobId);

		if (!job || job.status !== "failed" || job.attempts >= job.maxAttempts) {
			return null;
		}

		return this.save({
			...job,
			status: "retried",
			errorMessage: null,
			updatedAt: retriedAt,
			failedAt: null,
		});
	}

	async listFailedJobs(input: {
		limit: number;
		offset: number;
	}): Promise<readonly JobFailureSummary[]> {
		return Array.from(this.jobs.values())
			.filter((job) => job.status === "failed")
			.sort(
				(left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
			)
			.slice(input.offset, input.offset + input.limit)
			.map((job) => ({
				id: job.id,
				type: job.type,
				payload: job.payload,
				attempts: job.attempts,
				maxAttempts: job.maxAttempts,
				errorMessage: job.errorMessage,
				queuedAt: job.queuedAt,
				failedAt: job.failedAt,
				updatedAt: job.updatedAt,
			}));
	}

	getQueuedJobs(): readonly BackgroundJob[] {
		return Array.from(this.jobs.values()).filter(
			(job) => job.status === "queued" || job.status === "retried",
		);
	}

	private save(job: BackgroundJob): BackgroundJob {
		this.jobs.set(job.id, job);
		return job;
	}
}

export class InMemoryBackgroundJobWorker {
	constructor(
		private readonly repository: InMemoryJobQueueRepository,
		private readonly handlers: Partial<
			Record<BackgroundJob["type"], JobHandler>
		>,
		private readonly now: () => Date = () => new Date(),
	) {}

	async drain(limit = 10): Promise<readonly BackgroundJob[]> {
		const processed: BackgroundJob[] = [];
		const jobs = this.repository.getQueuedJobs().slice(0, limit);

		for (const job of jobs) {
			const handler = this.handlers[job.type];

			if (!handler) {
				const failed = await this.repository.markFailed(job.id, {
					errorMessage: `No handler registered for ${job.type}.`,
					failedAt: this.now(),
				});

				if (failed) {
					processed.push(failed);
				}

				continue;
			}

			try {
				await handler(job);
				const completed = await this.repository.markCompleted(
					job.id,
					this.now(),
				);

				if (completed) {
					processed.push(completed);
				}
			} catch (error) {
				const failed = await this.repository.markFailed(job.id, {
					errorMessage:
						error instanceof Error ? error.message : "Background job failed.",
					failedAt: this.now(),
				});

				if (failed) {
					processed.push(failed);
				}
			}
		}

		return processed;
	}
}
