import type { EntityId } from "../domain/common.ts";
import type { RecordStatus } from "../domain/index.ts";
import { permissions } from "../domain/permissions.ts";
import {
	type AuthenticatedActor,
	type AuthorizationScope,
	requireAnyPermission,
} from "./authorization.ts";
import { fail, ok, type Result } from "./result.ts";

export type ReportPeriod = {
	from: Date;
	to: Date;
};

export type PublicRepositoryStats = {
	researchRecords: number;
	publications: number;
	researchers: number;
	innovations: number;
	patents: number;
	faculties: number;
	departments: number;
	lastUpdatedAt: Date | null;
};

export type DashboardReportScope = AuthorizationScope & {
	facultyId?: EntityId | null;
	departmentId?: EntityId | null;
};

export type DashboardReportRequest = {
	scope?: DashboardReportScope;
	period?: ReportPeriod;
};

export type DashboardReportMetric = {
	key: string;
	label: string;
	value: number;
	previousValue: number | null;
	changePercent: number | null;
};

export type StatusBucket = {
	status: RecordStatus | "innovation_published" | "patent_granted";
	count: number;
};

export type DashboardReport = {
	scope: Required<Pick<DashboardReportScope, "facultyId" | "departmentId">>;
	period: ReportPeriod | null;
	metrics: readonly DashboardReportMetric[];
	researchByStatus: readonly StatusBucket[];
	recentActivityCount: number;
	generatedAt: Date;
};

export type ReportsRepository = {
	getPublicRepositoryStats(): Promise<PublicRepositoryStats>;
	getDashboardReport(input: {
		scope: DashboardReportScope;
		period: ReportPeriod | null;
	}): Promise<DashboardReport>;
};

export type ReportsService = ReturnType<typeof createReportsService>;

export function createReportsService(dependencies: {
	reportsRepository: ReportsRepository;
	now?: () => Date;
}) {
	const now = dependencies.now ?? (() => new Date());

	return {
		async getPublicRepositoryStats(): Promise<Result<PublicRepositoryStats>> {
			const stats =
				await dependencies.reportsRepository.getPublicRepositoryStats();

			return ok({
				researchRecords: clampPublicCount(stats.researchRecords),
				publications: clampPublicCount(stats.publications),
				researchers: clampPublicCount(stats.researchers),
				innovations: clampPublicCount(stats.innovations),
				patents: clampPublicCount(stats.patents),
				faculties: clampPublicCount(stats.faculties),
				departments: clampPublicCount(stats.departments),
				lastUpdatedAt: stats.lastUpdatedAt,
			});
		},

		async getDashboardReport(
			actor: AuthenticatedActor | null | undefined,
			request: DashboardReportRequest = {},
		): Promise<Result<DashboardReport>> {
			const scope = normalizeDashboardScope(request.scope);
			const authorization = requireAnyPermission(
				actor,
				[
					permissions.reviewDepartmentResearch,
					permissions.reviewFacultyResearch,
					permissions.reviewIpttoResearch,
					permissions.manageUsers,
				],
				scope,
			);

			if (!authorization.ok) {
				return authorization;
			}

			const period = normalizePeriod(request.period);

			if (!period.ok) {
				return period;
			}

			const report = await dependencies.reportsRepository.getDashboardReport({
				scope,
				period: period.value,
			});

			return ok({
				...report,
				generatedAt: report.generatedAt ?? now(),
			});
		},
	};
}

export function normalizeDashboardScope(
	scope: DashboardReportScope | undefined,
): DashboardReportScope {
	return {
		facultyId: scope?.facultyId ?? null,
		departmentId: scope?.departmentId ?? null,
		ownerId: scope?.ownerId ?? null,
	};
}

export function normalizePeriod(
	period: ReportPeriod | undefined,
): Result<ReportPeriod | null> {
	if (!period) {
		return ok(null);
	}

	if (
		Number.isNaN(period.from.getTime()) ||
		Number.isNaN(period.to.getTime())
	) {
		return fail("INVALID_REPORT_PERIOD", "Report period dates must be valid.");
	}

	if (period.from > period.to) {
		return fail(
			"INVALID_REPORT_PERIOD",
			"Report period start date must be before the end date.",
		);
	}

	return ok(period);
}

function clampPublicCount(value: number) {
	return Math.max(0, Math.floor(value));
}
