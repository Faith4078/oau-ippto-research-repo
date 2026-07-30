import { permissions } from "../domain/permissions.ts";
import { type AuthenticatedActor, requirePermission } from "./authorization.ts";
import { fail, ok, type Result } from "./result.ts";

export const jobTypes = {
	aiSummary: "ai_summary",
	keywordExtraction: "keyword_extraction",
	searchIndexing: "search_indexing",
	documentMetadataExtraction: "document_metadata_extraction",
} as const;

export type JobType = (typeof jobTypes)[keyof typeof jobTypes];

export type JobStatus = "queued" | "retried" | "completed" | "failed";

export type JobPriority = "normal" | "high";

export type JobPayload = Record<
	string,
	string | number | boolean | null | readonly string[]
>;

export type BackgroundJob = {
	id: string;
	type: JobType;
	status: JobStatus;
	payload: JobPayload;
	priority: JobPriority;
	attempts: number;
	maxAttempts: number;
	errorMessage: string | null;
	queuedAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
	failedAt: Date | null;
};

export type EnqueueJobInput = {
	type: JobType;
	payload: JobPayload;
	priority?: JobPriority;
	maxAttempts?: number;
};

export type JobFailureSummary = Pick<
	BackgroundJob,
	| "id"
	| "type"
	| "payload"
	| "attempts"
	| "maxAttempts"
	| "errorMessage"
	| "queuedAt"
	| "failedAt"
	| "updatedAt"
>;

export type JobQueueRepository = {
	enqueue(input: EnqueueJobInput & { queuedAt: Date }): Promise<BackgroundJob>;
	markCompleted(
		jobId: string,
		completedAt: Date,
	): Promise<BackgroundJob | null>;
	markFailed(
		jobId: string,
		input: { errorMessage: string; failedAt: Date },
	): Promise<BackgroundJob | null>;
	retryFailed(jobId: string, retriedAt: Date): Promise<BackgroundJob | null>;
	listFailedJobs(input: {
		limit: number;
		offset: number;
	}): Promise<readonly JobFailureSummary[]>;
};

export type BackgroundJobsService = ReturnType<
	typeof createBackgroundJobsService
>;

export function createBackgroundJobsService(dependencies: {
	jobQueueRepository: JobQueueRepository;
	now?: () => Date;
}) {
	const now = dependencies.now ?? (() => new Date());

	return {
		async enqueue(input: EnqueueJobInput): Promise<Result<BackgroundJob>> {
			if (!isJobType(input.type)) {
				return fail(
					"INVALID_JOB_TYPE",
					"The background job type is not supported.",
				);
			}

			if (input.maxAttempts !== undefined && input.maxAttempts < 1) {
				return fail(
					"INVALID_JOB_ATTEMPTS",
					"Background jobs must allow at least one attempt.",
				);
			}

			return ok(
				await dependencies.jobQueueRepository.enqueue({
					...input,
					priority: input.priority ?? "normal",
					maxAttempts: input.maxAttempts ?? 3,
					queuedAt: now(),
				}),
			);
		},

		async complete(jobId: string): Promise<Result<BackgroundJob>> {
			const job = await dependencies.jobQueueRepository.markCompleted(
				jobId,
				now(),
			);

			if (!job) {
				return fail("JOB_NOT_FOUND", "The background job was not found.");
			}

			return ok(job);
		},

		async fail(
			jobId: string,
			errorMessage: string,
		): Promise<Result<BackgroundJob>> {
			const job = await dependencies.jobQueueRepository.markFailed(jobId, {
				errorMessage: errorMessage.trim() || "Background job failed.",
				failedAt: now(),
			});

			if (!job) {
				return fail("JOB_NOT_FOUND", "The background job was not found.");
			}

			return ok(job);
		},

		async retry(jobId: string): Promise<Result<BackgroundJob>> {
			const job = await dependencies.jobQueueRepository.retryFailed(
				jobId,
				now(),
			);

			if (!job) {
				return fail(
					"JOB_NOT_RETRYABLE",
					"The background job cannot be retried.",
				);
			}

			return ok(job);
		},

		async listFailedJobs(
			actor: AuthenticatedActor | null | undefined,
			input: { page?: number; pageSize?: number } = {},
		): Promise<Result<readonly JobFailureSummary[]>> {
			const authorization = requirePermission(
				actor,
				permissions.manageSystemSettings,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const page = normalizePositiveInteger(input.page, 1);
			const pageSize = Math.min(
				normalizePositiveInteger(input.pageSize, 25),
				100,
			);

			return ok(
				await dependencies.jobQueueRepository.listFailedJobs({
					limit: pageSize,
					offset: (page - 1) * pageSize,
				}),
			);
		},
	};
}

export function isJobType(value: string): value is JobType {
	return Object.values(jobTypes).includes(value as JobType);
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
	if (value === undefined || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(1, Math.floor(value));
}
