import { createApplicationServices } from "#/application/composition.ts";
import { createRateLimiterService } from "#/application/rate-limit.ts";
import { requireDatabaseUrl } from "#/db/env.ts";

import { DrizzleResearchWorkflowAuditRepository } from "./db/audit-repository.ts";
import { createDatabase } from "./db/index.ts";
import { DrizzleInnovationManagementRepository } from "./db/innovation-management-repository.ts";
import { PostgresJobQueueRepository } from "./db/postgres-job-queue.ts";
import { PostgresRateLimitStore } from "./db/postgres-rate-limit-store.ts";
import { PostgresReportsRepository } from "./db/research-reports.ts";
import { DrizzleResearchWorkflowRepository } from "./db/research-workflow-repository.ts";
import { createR2ObjectStorageSigner } from "./storage/r2-signer.ts";

const runtimeDatabase = createDatabase(requireDatabaseUrl());
const runtimeJobQueueRepository = new PostgresJobQueueRepository(
	runtimeDatabase,
);
const runtimeRateLimitStore = new PostgresRateLimitStore(runtimeDatabase);

export function createRuntimeRateLimiter() {
	return createRateLimiterService({
		store: runtimeRateLimitStore,
	});
}

export function createRuntimeApplicationServices() {
	return createApplicationServices({
		researchRepository: new DrizzleResearchWorkflowRepository(runtimeDatabase),
		auditRepository: new DrizzleResearchWorkflowAuditRepository(
			runtimeDatabase,
		),
		storageSigner: createR2ObjectStorageSigner(),
		jobQueueRepository: runtimeJobQueueRepository,
		rateLimitStore: runtimeRateLimitStore,
		innovationRepository: new DrizzleInnovationManagementRepository(
			runtimeDatabase,
		),
		reportsRepository: new PostgresReportsRepository(runtimeDatabase),
	});
}
