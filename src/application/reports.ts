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

export type PublicationAnalyticsRange = "30d" | "90d" | "180d" | "365d";

export type PublicationAnalyticsPeriod = ReportPeriod & {
	bucket: "week" | "month";
	label: string;
	previousFrom: Date;
	previousTo: Date;
	range: PublicationAnalyticsRange;
};

export type PublicationAnalyticsRequest = {
	range?: PublicationAnalyticsRange;
	scope?: DashboardReportScope;
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

export type PublicationAnalyticsMetric = {
	key:
		| "publications"
		| "publicVisibilityRate"
		| "doiCoverageRate"
		| "activeFaculties"
		| "activeDepartments"
		| "linkedResearchRecords";
	label: string;
	value: number;
	previousValue: number | null;
	changePercent: number | null;
	unit: "count" | "percent";
	helpText: string;
};

export type PublicationTrendPoint = {
	count: number;
	label: string;
	previousCount: number;
};

export type PublicationAnalyticsGroup = {
	changePercent: number | null;
	count: number;
	id: EntityId | string | null;
	label: string;
	previousCount: number;
	publicCount?: number;
	secondaryLabel?: string | null;
	sharePercent: number;
};

export type PublicationAnalyticsRecentItem = {
	department: string | null;
	doi: string | null;
	faculty: string | null;
	id: EntityId;
	journal: string | null;
	owner: string | null;
	publishedOn: Date | null;
	researchRecordId: EntityId;
	status: RecordStatus;
	title: string;
	type: string;
};

export type PublicationAnalytics = {
	byAccessLevel: readonly PublicationAnalyticsGroup[];
	byDepartment: readonly PublicationAnalyticsGroup[];
	byFaculty: readonly PublicationAnalyticsGroup[];
	byStatus: readonly PublicationAnalyticsGroup[];
	byType: readonly PublicationAnalyticsGroup[];
	generatedAt: Date;
	metrics: readonly PublicationAnalyticsMetric[];
	period: PublicationAnalyticsPeriod;
	recentPublications: readonly PublicationAnalyticsRecentItem[];
	scope: Required<Pick<DashboardReportScope, "facultyId" | "departmentId">> & {
		label: string;
		level: "department" | "faculty" | "university";
	};
	trend: readonly PublicationTrendPoint[];
};

export type ReportsRepository = {
	getPublicRepositoryStats(): Promise<PublicRepositoryStats>;
	getDashboardReport(input: {
		scope: DashboardReportScope;
		period: ReportPeriod | null;
	}): Promise<DashboardReport>;
	getPublicationAnalytics(input: {
		period: PublicationAnalyticsPeriod;
		scope: DashboardReportScope;
	}): Promise<PublicationAnalytics>;
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

		async getPublicationAnalytics(
			actor: AuthenticatedActor | null | undefined,
			request: PublicationAnalyticsRequest = {},
		): Promise<Result<PublicationAnalytics>> {
			const scope = normalizeDashboardScope(request.scope);
			const authorization = authorizePublicationAnalytics(actor, scope);

			if (!authorization.ok) {
				return authorization;
			}

			const analytics =
				await dependencies.reportsRepository.getPublicationAnalytics({
					period: publicationAnalyticsPeriodForRange(
						request.range ?? "365d",
						now(),
					),
					scope,
				});

			return ok({
				...analytics,
				generatedAt: analytics.generatedAt ?? now(),
			});
		},
	};
}

export function publicationAnalyticsPeriodForRange(
	range: PublicationAnalyticsRange,
	now: Date,
): PublicationAnalyticsPeriod {
	const rangeConfig = publicationAnalyticsRangeConfig[range];
	const to = new Date(now);
	const from = startOfUtcDay(addUtcDays(to, -(rangeConfig.days - 1)));
	const previousTo = new Date(from.getTime() - 1);
	const previousFrom = startOfUtcDay(
		addUtcDays(previousTo, -(rangeConfig.days - 1)),
	);

	return {
		bucket: rangeConfig.bucket,
		from,
		label: rangeConfig.label,
		previousFrom,
		previousTo,
		range,
		to,
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

const publicationAnalyticsRangeConfig: Record<
	PublicationAnalyticsRange,
	{ bucket: PublicationAnalyticsPeriod["bucket"]; days: number; label: string }
> = {
	"30d": { bucket: "week", days: 30, label: "Last 30 days" },
	"90d": { bucket: "week", days: 90, label: "Last 90 days" },
	"180d": { bucket: "month", days: 180, label: "Last 180 days" },
	"365d": { bucket: "month", days: 365, label: "Last 12 months" },
};

function authorizePublicationAnalytics(
	actor: AuthenticatedActor | null | undefined,
	scope: DashboardReportScope,
): Result<AuthenticatedActor> {
	if (!actor) {
		return fail(
			"AUTHENTICATION_REQUIRED",
			"You must be signed in to perform this action.",
		);
	}

	const isSuperAdministrator = actor.roles.some(
		(assignment) => assignment.role === "super_administrator",
	);

	if (!isSuperAdministrator && !scope.facultyId && !scope.departmentId) {
		return fail(
			"FORBIDDEN",
			"You do not have permission to perform this action.",
		);
	}

	return requireAnyPermission(
		actor,
		[
			permissions.manageOrganization,
			permissions.manageUsers,
			permissions.reviewDepartmentResearch,
			permissions.reviewFacultyResearch,
		],
		scope,
	);
}

function addUtcDays(date: Date, days: number): Date {
	const nextDate = new Date(date);
	nextDate.setUTCDate(nextDate.getUTCDate() + days);
	return nextDate;
}

function startOfUtcDay(date: Date): Date {
	const nextDate = new Date(date);
	nextDate.setUTCHours(0, 0, 0, 0);
	return nextDate;
}
