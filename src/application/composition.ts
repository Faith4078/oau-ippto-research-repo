import {
	createInnovationManagementService,
	type InnovationManagementAuditRepository,
	type InnovationManagementRepository,
	type InnovationManagementService,
} from "./innovation-management.ts";
import {
	type BackgroundJobsService,
	createBackgroundJobsService,
	type JobQueueRepository,
} from "./jobs.ts";
import {
	createRateLimiterService,
	type RateLimiterService,
	type RateLimitStore,
} from "./rate-limit.ts";
import {
	createReportsService,
	type ReportsRepository,
	type ReportsService,
} from "./reports.ts";
import {
	createResearchWorkflowService,
	type ObjectStorageSigner,
	type ResearchWorkflowAuditRepository,
	type ResearchWorkflowRepository,
	type ResearchWorkflowService,
} from "./research-workflow.ts";

export type ApplicationDependencies = {
	researchRepository: ResearchWorkflowRepository;
	auditRepository: ResearchWorkflowAuditRepository;
	storageSigner: ObjectStorageSigner;
	jobQueueRepository: JobQueueRepository;
	rateLimitStore: RateLimitStore;
	innovationRepository: InnovationManagementRepository;
	innovationAuditRepository?: InnovationManagementAuditRepository;
	reportsRepository: ReportsRepository;
};

export type ApplicationServices = {
	backgroundJobs: BackgroundJobsService;
	innovationManagement: InnovationManagementService;
	rateLimiter: RateLimiterService;
	reports: ReportsService;
	researchWorkflow: ResearchWorkflowService;
};

export function createApplicationServices(
	dependencies: ApplicationDependencies,
): ApplicationServices {
	return {
		backgroundJobs: createBackgroundJobsService(dependencies),
		innovationManagement: createInnovationManagementService({
			repository: dependencies.innovationRepository,
			auditRepository:
				dependencies.innovationAuditRepository ?? dependencies.auditRepository,
		}),
		rateLimiter: createRateLimiterService({
			store: dependencies.rateLimitStore,
		}),
		reports: createReportsService({
			reportsRepository: dependencies.reportsRepository,
		}),
		researchWorkflow: createResearchWorkflowService(dependencies),
	};
}
