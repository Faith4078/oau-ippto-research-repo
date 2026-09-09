import { type SQL, sql } from "drizzle-orm";

import type {
	DashboardReport,
	DashboardReportMetric,
	DashboardReportScope,
	PublicationAnalytics,
	PublicationAnalyticsGroup,
	PublicationAnalyticsMetric,
	PublicationAnalyticsPeriod,
	PublicationTrendPoint,
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

type PublicationAnalyticsTotalsRow = {
	active_departments: number | string;
	active_faculties: number | string;
	doi_publications: number | string;
	linked_research_records: number | string;
	previous_active_departments: number | string;
	previous_active_faculties: number | string;
	previous_doi_publications: number | string;
	previous_linked_research_records: number | string;
	previous_public_publications: number | string;
	previous_publications: number | string;
	public_publications: number | string;
	publications: number | string;
};

type PublicationTrendRow = {
	count: number | string;
	label: string;
};

type PublicationGroupRow = {
	count: number | string;
	id: string | null;
	label: string | null;
	previous_count: number | string;
	public_count?: number | string;
	secondary_label?: string | null;
};

type PublicationRecentRow = {
	department: string | null;
	doi: string | null;
	faculty: string | null;
	id: string;
	journal: string | null;
	owner: string | null;
	published_on: Date | string | null;
	research_record_id: string;
	status: PublicationAnalytics["recentPublications"][number]["status"];
	title: string;
	type: string;
};

type PublicationScopeLabelRow = {
	department_name?: string | null;
	faculty_name?: string | null;
};

type PublicationScopeLabel = Pick<
	PublicationAnalytics["scope"],
	"label" | "level"
>;

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

	async getPublicationAnalytics(input: {
		period: PublicationAnalyticsPeriod;
		scope: DashboardReportScope;
	}): Promise<PublicationAnalytics> {
		const [
			scopeLabel,
			totalsResult,
			currentTrendResult,
			previousTrendResult,
			facultyResult,
			departmentResult,
			typeResult,
			accessLevelResult,
			statusResult,
			recentResult,
		] = await Promise.all([
			this.publicationScopeLabel(input.scope),
			this.db.execute<PublicationAnalyticsTotalsRow>(sql`
				select
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "current")}) as publications,
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "previous")}) as previous_publications,
					count(distinct r.id) filter (where ${publicationWindowCondition(input.period, "p", "current")}) as linked_research_records,
					count(distinct r.id) filter (where ${publicationWindowCondition(input.period, "p", "previous")}) as previous_linked_research_records,
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_publications,
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "previous")} and r.status = 'published' and r.access_level = 'public') as previous_public_publications,
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "current")} and nullif(trim(p.doi), '') is not null) as doi_publications,
					count(*) filter (where ${publicationWindowCondition(input.period, "p", "previous")} and nullif(trim(p.doi), '') is not null) as previous_doi_publications,
					count(distinct r.faculty_id) filter (where ${publicationWindowCondition(input.period, "p", "current")}) as active_faculties,
					count(distinct r.faculty_id) filter (where ${publicationWindowCondition(input.period, "p", "previous")}) as previous_active_faculties,
					count(distinct r.department_id) filter (where ${publicationWindowCondition(input.period, "p", "current")}) as active_departments,
					count(distinct r.department_id) filter (where ${publicationWindowCondition(input.period, "p", "previous")}) as previous_active_departments
				from publications p
				join research_records r on r.id = p.research_record_id
				where true
					${researchScopeFilter(input.scope, "r")}
					${publicationCombinedPeriodFilter(input.period, "p")}
			`),
			this.publicationTrend(input.scope, input.period, "current"),
			this.publicationTrend(input.scope, input.period, "previous"),
			this.publicationFacultyGroups(input.scope, input.period),
			this.publicationDepartmentGroups(input.scope, input.period),
			this.publicationTypeGroups(input.scope, input.period),
			this.publicationAccessLevelGroups(input.scope, input.period),
			this.publicationStatusGroups(input.scope, input.period),
			this.publicationRecentItems(input.scope, input.period),
		]);
		const totals = totalsResult.rows[0];
		const publicationCount = numberFromRow(totals?.publications);

		return {
			byAccessLevel: toPublicationGroups(
				accessLevelResult.rows,
				publicationCount,
			),
			byDepartment: toPublicationGroups(
				departmentResult.rows,
				publicationCount,
			),
			byFaculty: toPublicationGroups(facultyResult.rows, publicationCount),
			byStatus: toPublicationGroups(statusResult.rows, publicationCount),
			byType: toPublicationGroups(typeResult.rows, publicationCount),
			generatedAt: new Date(),
			metrics: toPublicationAnalyticsMetrics(totals),
			period: input.period,
			recentPublications: recentResult.rows.map(toPublicationRecentItem),
			scope: {
				departmentId: input.scope.departmentId ?? null,
				facultyId: input.scope.facultyId ?? null,
				...scopeLabel,
			},
			trend: toPublicationTrend(
				currentTrendResult.rows,
				previousTrendResult.rows,
			),
		};
	}

	private async publicationScopeLabel(
		scope: DashboardReportScope,
	): Promise<PublicationScopeLabel> {
		if (scope.departmentId) {
			const result = await this.db.execute<PublicationScopeLabelRow>(sql`
				select d.name as department_name, f.name as faculty_name
				from departments d
				left join faculties f on f.id = d.faculty_id
				where d.id = ${scope.departmentId}
				limit 1
			`);
			const row = result.rows[0];

			return {
				label: row?.faculty_name
					? `${row.department_name ?? "Selected department"}, ${row.faculty_name}`
					: (row?.department_name ?? "Selected department"),
				level: "department",
			};
		}

		if (scope.facultyId) {
			const result = await this.db.execute<PublicationScopeLabelRow>(sql`
				select f.name as faculty_name
				from faculties f
				where f.id = ${scope.facultyId}
				limit 1
			`);
			const row = result.rows[0];

			return {
				label: row?.faculty_name ?? "Selected faculty",
				level: "faculty",
			};
		}

		return { label: "University-wide", level: "university" };
	}

	private publicationTrend(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
		window: "current" | "previous",
	) {
		const bucketName = period.bucket;
		const bucketInterval = bucketIntervalForPeriod(period);
		const bucketFormat = period.bucket === "month" ? "Mon YYYY" : "FMDD Mon";
		const from = window === "current" ? period.from : period.previousFrom;
		const to = window === "current" ? period.to : period.previousTo;

		return this.db.execute<PublicationTrendRow>(sql`
			with scoped_publications as (
				select ${publicationEventExpression("p")} as event_at
				from publications p
				join research_records r on r.id = p.research_record_id
				where true
					${researchScopeFilter(scope, "r")}
					and ${publicationEventExpression("p")} between ${from} and ${to}
			), buckets as (
				select generate_series(
					date_trunc(${bucketName}, ${from}::timestamptz),
					date_trunc(${bucketName}, ${to}::timestamptz),
					${bucketInterval}
				) as bucket_start
			)
			select
				to_char(bucket_start, ${bucketFormat}) as label,
				count(scoped_publications.event_at) as count
			from buckets
			left join scoped_publications
				on scoped_publications.event_at >= bucket_start
				and scoped_publications.event_at < bucket_start + ${bucketInterval}
			group by bucket_start
			order by bucket_start
		`);
	}

	private publicationFacultyGroups(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationGroupRow>(sql`
			select
				r.faculty_id::text as id,
				coalesce(f.name, 'Unknown faculty') as label,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) as count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "previous")}) as previous_count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_count,
				(count(distinct r.department_id) filter (where ${publicationWindowCondition(period, "p", "current")}))::text || ' departments active' as secondary_label
			from publications p
			join research_records r on r.id = p.research_record_id
			left join faculties f on f.id = r.faculty_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationCombinedPeriodFilter(period, "p")}
			group by r.faculty_id, f.name
			order by count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) desc, label asc
			limit 8
		`);
	}

	private publicationDepartmentGroups(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationGroupRow>(sql`
			select
				r.department_id::text as id,
				coalesce(d.name, 'Unknown department') as label,
				f.name as secondary_label,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) as count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "previous")}) as previous_count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_count
			from publications p
			join research_records r on r.id = p.research_record_id
			left join departments d on d.id = r.department_id
			left join faculties f on f.id = r.faculty_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationCombinedPeriodFilter(period, "p")}
			group by r.department_id, d.name, f.name
			order by count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) desc, label asc
			limit 10
		`);
	}

	private publicationTypeGroups(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationGroupRow>(sql`
			select
				p.type::text as id,
				p.type::text as label,
				'Publication type' as secondary_label,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) as count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "previous")}) as previous_count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_count
			from publications p
			join research_records r on r.id = p.research_record_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationCombinedPeriodFilter(period, "p")}
			group by p.type
			order by count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) desc, label asc
		`);
	}

	private publicationAccessLevelGroups(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationGroupRow>(sql`
			select
				r.access_level::text as id,
				r.access_level::text as label,
				'Visibility' as secondary_label,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) as count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "previous")}) as previous_count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_count
			from publications p
			join research_records r on r.id = p.research_record_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationCombinedPeriodFilter(period, "p")}
			group by r.access_level
			order by count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) desc, label asc
		`);
	}

	private publicationStatusGroups(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationGroupRow>(sql`
			select
				r.status::text as id,
				r.status::text as label,
				'Research status' as secondary_label,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) as count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "previous")}) as previous_count,
				count(*) filter (where ${publicationWindowCondition(period, "p", "current")} and r.status = 'published' and r.access_level = 'public') as public_count
			from publications p
			join research_records r on r.id = p.research_record_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationCombinedPeriodFilter(period, "p")}
			group by r.status
			order by count(*) filter (where ${publicationWindowCondition(period, "p", "current")}) desc, label asc
		`);
	}

	private publicationRecentItems(
		scope: DashboardReportScope,
		period: PublicationAnalyticsPeriod,
	) {
		return this.db.execute<PublicationRecentRow>(sql`
			select
				p.id::text as id,
				p.title,
				p.type::text as type,
				p.journal,
				p.doi,
				p.published_on,
				r.id::text as research_record_id,
				r.status::text as status,
				f.name as faculty,
				d.name as department,
				u.name as owner
			from publications p
			join research_records r on r.id = p.research_record_id
			left join faculties f on f.id = r.faculty_id
			left join departments d on d.id = r.department_id
			left join users u on u.id = r.owner_id
			where true
				${researchScopeFilter(scope, "r")}
				${publicationWindowFilter(period, "p", "current")}
			order by ${publicationEventExpression("p")} desc, p.created_at desc
			limit 10
		`);
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

function toPublicationAnalyticsMetrics(
	row: PublicationAnalyticsTotalsRow | undefined,
): PublicationAnalyticsMetric[] {
	const publications = numberFromRow(row?.publications);
	const previousPublications = numberFromRow(row?.previous_publications);
	const publicVisibilityRate = percentage(
		numberFromRow(row?.public_publications),
		publications,
	);
	const previousPublicVisibilityRate = percentage(
		numberFromRow(row?.previous_public_publications),
		previousPublications,
	);
	const doiCoverageRate = percentage(
		numberFromRow(row?.doi_publications),
		publications,
	);
	const previousDoiCoverageRate = percentage(
		numberFromRow(row?.previous_doi_publications),
		previousPublications,
	);

	return [
		publicationMetric({
			helpText: "Publication records captured in the selected duration.",
			key: "publications",
			label: "Total publications",
			previousValue: previousPublications,
			unit: "count",
			value: publications,
		}),
		publicationMetric({
			helpText: "Share attached to published, public research records.",
			key: "publicVisibilityRate",
			label: "Public visibility",
			previousValue: previousPublicVisibilityRate,
			unit: "percent",
			value: publicVisibilityRate,
		}),
		publicationMetric({
			helpText: "Share of publications with DOI metadata recorded.",
			key: "doiCoverageRate",
			label: "DOI coverage",
			previousValue: previousDoiCoverageRate,
			unit: "percent",
			value: doiCoverageRate,
		}),
		publicationMetric({
			helpText: "Distinct faculties represented by publication activity.",
			key: "activeFaculties",
			label: "Active faculties",
			previousValue: numberFromRow(row?.previous_active_faculties),
			unit: "count",
			value: numberFromRow(row?.active_faculties),
		}),
		publicationMetric({
			helpText: "Distinct departments represented by publication activity.",
			key: "activeDepartments",
			label: "Active departments",
			previousValue: numberFromRow(row?.previous_active_departments),
			unit: "count",
			value: numberFromRow(row?.active_departments),
		}),
		publicationMetric({
			helpText: "Research records with at least one publication attached.",
			key: "linkedResearchRecords",
			label: "Linked research",
			previousValue: numberFromRow(row?.previous_linked_research_records),
			unit: "count",
			value: numberFromRow(row?.linked_research_records),
		}),
	];
}

function publicationMetric(
	input: Omit<PublicationAnalyticsMetric, "changePercent">,
): PublicationAnalyticsMetric {
	return {
		...input,
		changePercent: percentageChange(input.value, input.previousValue),
	};
}

function toPublicationTrend(
	currentRows: PublicationTrendRow[],
	previousRows: PublicationTrendRow[],
): PublicationTrendPoint[] {
	return currentRows.map((row, index) => ({
		count: numberFromRow(row.count),
		label: row.label,
		previousCount: numberFromRow(previousRows[index]?.count),
	}));
}

function toPublicationGroups(
	rows: PublicationGroupRow[],
	totalPublications: number,
): PublicationAnalyticsGroup[] {
	return rows.map((row) => {
		const count = numberFromRow(row.count);
		const previousCount = numberFromRow(row.previous_count);

		return {
			changePercent: percentageChange(count, previousCount),
			count,
			id: row.id,
			label: readableLabel(row.label ?? "Unknown"),
			previousCount,
			publicCount:
				row.public_count === undefined
					? undefined
					: numberFromRow(row.public_count),
			secondaryLabel: row.secondary_label,
			sharePercent: percentage(count, totalPublications),
		};
	});
}

function toPublicationRecentItem(
	row: PublicationRecentRow,
): PublicationAnalytics["recentPublications"][number] {
	return {
		department: row.department,
		doi: row.doi,
		faculty: row.faculty,
		id: row.id,
		journal: row.journal,
		owner: row.owner,
		publishedOn: dateFromRow(row.published_on),
		researchRecordId: row.research_record_id,
		status: row.status,
		title: row.title,
		type: row.type,
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

function publicationCombinedPeriodFilter(
	period: PublicationAnalyticsPeriod,
	tableAlias: string,
): SQL {
	return sql`and ${publicationEventExpression(tableAlias)} between ${period.previousFrom} and ${period.to}`;
}

function publicationWindowFilter(
	period: PublicationAnalyticsPeriod,
	tableAlias: string,
	window: "current" | "previous",
): SQL {
	return sql`and ${publicationWindowCondition(period, tableAlias, window)}`;
}

function publicationWindowCondition(
	period: PublicationAnalyticsPeriod,
	tableAlias: string,
	window: "current" | "previous",
): SQL {
	const from = window === "current" ? period.from : period.previousFrom;
	const to = window === "current" ? period.to : period.previousTo;

	return sql`${publicationEventExpression(tableAlias)} between ${from} and ${to}`;
}

function publicationEventExpression(tableAlias: string): SQL {
	return sql`coalesce(${sql.raw(`${tableAlias}.published_on`)}::timestamptz, ${sql.raw(`${tableAlias}.created_at`)})`;
}

function bucketIntervalForPeriod(period: PublicationAnalyticsPeriod): SQL {
	return period.bucket === "month"
		? sql`interval '1 month'`
		: sql`interval '1 week'`;
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

function percentage(value: number, total: number): number {
	if (total <= 0) {
		return 0;
	}

	return roundToOne((value / total) * 100);
}

function percentageChange(
	value: number,
	previousValue: number | null,
): number | null {
	if (previousValue === null) {
		return null;
	}

	if (previousValue === 0) {
		return value === 0 ? 0 : null;
	}

	return roundToOne(((value - previousValue) / previousValue) * 100);
}

function roundToOne(value: number): number {
	return Math.round(value * 10) / 10;
}

function readableLabel(value: string): string {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}
