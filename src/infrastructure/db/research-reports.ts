import { type SQL, sql } from "drizzle-orm";

import type {
	DashboardReport,
	DashboardReportMetric,
	DashboardReportScope,
	PublicRepositoryStats,
	ReportPeriod,
	ReportsRepository,
	StatusBucket,
} from "../../application/reports.ts";
import type { Database } from "./index.ts";

type PublicStatsRow = {
	research_records: number | string;
	publications: number | string;
	researchers: number | string;
	innovations: number | string;
	patents: number | string;
	faculties: number | string;
	departments: number | string;
	last_updated_at: Date | string | null;
};

type MetricRow = {
	research_records: number | string;
	publications: number | string;
	innovations: number | string;
	patents: number | string;
	researchers: number | string;
	recent_activity_count: number | string;
};

type StatusRow = {
	status: StatusBucket["status"];
	count: number | string;
};

export class PostgresReportsRepository implements ReportsRepository {
	constructor(private readonly db: Database) {}

	async getPublicRepositoryStats(): Promise<PublicRepositoryStats> {
		const publicStats = await this.db.execute<PublicStatsRow>(sql`
			select
				(select count(*) from research_records where status = 'published' and access_level = 'public') as research_records,
				(
					select count(*)
					from publications p
					join research_records r on r.id = p.research_record_id
					where r.status = 'published' and r.access_level = 'public'
				) as publications,
				(
					select count(*)
					from users u
					join user_profiles up on up.user_id = u.id
					where u.status = 'active'
				) as researchers,
				(select count(*) from innovations where status = 'published') as innovations,
				(
					select count(*)
					from patents p
					join innovations i on i.id = p.innovation_id
					where i.status = 'published'
				) as patents,
				(select count(*) from faculties) as faculties,
				(select count(*) from departments) as departments,
				(
					select max(updated_at)
					from (
						select updated_at from research_records where status = 'published' and access_level = 'public'
						union all
						select updated_at from innovations where status = 'published'
						union all
						select p.updated_at
						from patents p
						join innovations i on i.id = p.innovation_id
						where i.status = 'published'
					) visible_records
				) as last_updated_at
		`);
		const row = publicStats.rows[0];

		return {
			researchRecords: numberFromRow(row?.research_records),
			publications: numberFromRow(row?.publications),
			researchers: numberFromRow(row?.researchers),
			innovations: numberFromRow(row?.innovations),
			patents: numberFromRow(row?.patents),
			faculties: numberFromRow(row?.faculties),
			departments: numberFromRow(row?.departments),
			lastUpdatedAt: dateFromRow(row?.last_updated_at),
		};
	}

	async getDashboardReport(input: {
		scope: DashboardReportScope;
		period: ReportPeriod | null;
	}): Promise<DashboardReport> {
		const dashboardMetrics = await this.db.execute<MetricRow>(sql`
			select
				(select count(*) from research_records r where true ${researchScopeFilter(input.scope, "r")} ${periodFilter(input.period, "r.created_at")}) as research_records,
				(
					select count(*)
					from publications p
					join research_records r on r.id = p.research_record_id
					where true ${researchScopeFilter(input.scope, "r")} ${periodFilter(input.period, "p.created_at")}
				) as publications,
				(select count(*) from innovations i where true ${nullableScopeFilter(input.scope, "i")} ${periodFilter(input.period, "i.created_at")}) as innovations,
				(
					select count(*)
					from patents p
					join innovations i on i.id = p.innovation_id
					where true ${nullableScopeFilter(input.scope, "i")} ${periodFilter(input.period, "p.created_at")}
				) as patents,
				(
					select count(*)
					from users u
					join user_profiles up on up.user_id = u.id
					where u.status = 'active' ${profileScopeFilter(input.scope)} ${periodFilter(input.period, "u.created_at")}
				) as researchers,
				(
					select count(*)
					from approval_history ah
					join research_records r on r.id = ah.research_record_id
					where true ${researchScopeFilter(input.scope, "r")} ${periodFilter(input.period, "ah.created_at")}
				) as recent_activity_count
		`);
		const metrics = dashboardMetrics.rows[0];

		const statusResult = await this.db.execute<StatusRow>(sql`
			select r.status::text as status, count(*) as count
			from research_records r
			where true ${researchScopeFilter(input.scope, "r")} ${periodFilter(input.period, "r.created_at")}
			group by r.status
			order by r.status
		`);
		const statusRows = statusResult.rows;

		return {
			scope: {
				facultyId: input.scope.facultyId ?? null,
				departmentId: input.scope.departmentId ?? null,
			},
			period: input.period,
			metrics: toDashboardMetrics(metrics),
			researchByStatus: statusRows.map((row) => ({
				status: row.status,
				count: numberFromRow(row.count),
			})),
			recentActivityCount: numberFromRow(metrics?.recent_activity_count),
			generatedAt: new Date(),
		};
	}
}

function toDashboardMetrics(
	row: MetricRow | undefined,
): DashboardReportMetric[] {
	return [
		metric("researchRecords", "Research records", row?.research_records),
		metric("publications", "Publications", row?.publications),
		metric("innovations", "Innovations", row?.innovations),
		metric("patents", "Patents", row?.patents),
		metric("researchers", "Researchers", row?.researchers),
	];
}

function metric(
	key: string,
	label: string,
	value: number | string | undefined,
): DashboardReportMetric {
	return {
		key,
		label,
		value: numberFromRow(value),
		previousValue: null,
		changePercent: null,
	};
}

function researchScopeFilter(
	scope: DashboardReportScope,
	tableAlias: string,
): SQL {
	return sql.join(
		[
			scope.facultyId
				? sql`and ${sql.raw(`${tableAlias}.faculty_id`)} = ${scope.facultyId}`
				: sql``,
			scope.departmentId
				? sql`and ${sql.raw(`${tableAlias}.department_id`)} = ${scope.departmentId}`
				: sql``,
			scope.ownerId
				? sql`and ${sql.raw(`${tableAlias}.owner_id`)} = ${scope.ownerId}`
				: sql``,
		],
		sql` `,
	);
}

function nullableScopeFilter(
	scope: DashboardReportScope,
	tableAlias: string,
): SQL {
	return sql.join(
		[
			scope.facultyId
				? sql`and ${sql.raw(`${tableAlias}.faculty_id`)} = ${scope.facultyId}`
				: sql``,
			scope.departmentId
				? sql`and ${sql.raw(`${tableAlias}.department_id`)} = ${scope.departmentId}`
				: sql``,
		],
		sql` `,
	);
}

function profileScopeFilter(scope: DashboardReportScope): SQL {
	return sql.join(
		[
			scope.facultyId ? sql`and up.faculty_id = ${scope.facultyId}` : sql``,
			scope.departmentId
				? sql`and up.department_id = ${scope.departmentId}`
				: sql``,
		],
		sql` `,
	);
}

function periodFilter(
	period: ReportPeriod | null,
	columnExpression: string,
): SQL {
	if (!period) {
		return sql``;
	}

	return sql`and ${sql.raw(columnExpression)} between ${period.from} and ${period.to}`;
}

function numberFromRow(value: number | string | undefined): number {
	return Number(value ?? 0);
}

function dateFromRow(value: Date | string | null | undefined): Date | null {
	if (!value) {
		return null;
	}

	return value instanceof Date ? value : new Date(value);
}
