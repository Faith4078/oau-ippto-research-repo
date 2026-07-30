import { type SQL, sql } from "drizzle-orm";

import {
	createSearchPage,
	type NormalizedSearchRequest,
	type SearchIndex,
	type SearchPage,
	type SearchResultItem,
} from "../../application/search.ts";
import type { Database } from "./index.ts";

type SearchRow = {
	id: string;
	entity_type: SearchResultItem["entityType"];
	title: string;
	summary: string | null;
	url: string;
	score: number | string | null;
	matched_fields: string[] | null;
	faculty_id: string | null;
	department_id: string | null;
	year: number | string | null;
	metadata: Record<string, string | number | boolean | null> | null;
	total_count: number | string;
};

export class PostgresResearchSearchIndex implements SearchIndex {
	constructor(private readonly db: Database) {}

	async searchPublic(request: NormalizedSearchRequest): Promise<SearchPage> {
		const result = await this.db.execute<SearchRow>(
			sql`
				with search_query as (
					select
						nullif(${request.keyword}, '') as keyword,
						case
							when nullif(${request.keyword}, '') is null then null
							else websearch_to_tsquery('english', ${request.keyword})
						end as query
				),
				results as (
					${researchSearchQuery(request)}
					union all
					${publicationSearchQuery(request)}
					union all
					${researcherSearchQuery(request)}
					union all
					${innovationSearchQuery(request)}
					union all
					${patentSearchQuery(request)}
				),
				filtered as (
					select *
					from results
					where entity_type = any(${request.filters.entityTypes}::text[])
				),
				counted as (
					select *, count(*) over() as total_count
					from filtered
					order by ${sortExpression(request)}
					limit ${request.pageSize}
					offset ${request.offset}
				)
				select * from counted
			`,
		);

		const rows = result.rows;
		const items = rows.map((row, index) => toSearchItem(row, request, index));
		const totalItems = rows.length > 0 ? Number(rows[0]?.total_count ?? 0) : 0;

		return createSearchPage({
			items,
			page: request.page,
			pageSize: request.pageSize,
			totalItems,
			sort: request.sort,
			appliedFilters: request.filters,
		});
	}
}

function researchSearchQuery(request: NormalizedSearchRequest): SQL {
	return sql`
		select
			r.id::text as id,
			'research' as entity_type,
			r.title,
			r.abstract as summary,
			'/research/' || r.id::text as url,
			case
				when sq.query is null then 0
				else ts_rank_cd(
					to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r.abstract, '') || ' ' || coalesce(r.research_area, '')),
					sq.query
				)
			end as score,
			array_remove(array[
				case when sq.keyword is not null and r.title ilike '%' || sq.keyword || '%' then 'title' end,
				case when sq.keyword is not null and r.abstract ilike '%' || sq.keyword || '%' then 'abstract' end,
				case when sq.keyword is not null and r.research_area ilike '%' || sq.keyword || '%' then 'researchArea' end
			], null) as matched_fields,
			r.faculty_id::text as faculty_id,
			r.department_id::text as department_id,
			extract(year from coalesce(r.published_at, r.completed_on::timestamp, r.created_at))::int as year,
			jsonb_build_object(
				'slug', r.slug,
				'researchArea', r.research_area,
				'status', r.status
			) as metadata
		from research_records r
		cross join search_query sq
		where r.status = 'published'
			and r.access_level = 'public'
			${keywordCondition("r.title", "r.abstract", "r.research_area")}
			${scopeFilters(request, "r")}
			${yearFilter(request, "coalesce(r.published_at, r.completed_on::timestamp, r.created_at)")}
			${researchAreaFilter(request)}
			${keywordListFilter(request)}
	`;
}

function publicationSearchQuery(request: NormalizedSearchRequest): SQL {
	return sql`
		select
			p.id::text as id,
			'publication' as entity_type,
			p.title,
			coalesce(p.citation, r.abstract) as summary,
			'/publications#' || p.id::text as url,
			case
				when sq.query is null then 0
				else ts_rank_cd(
					to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.citation, '') || ' ' || coalesce(p.journal, '')),
					sq.query
				)
			end as score,
			array_remove(array[
				case when sq.keyword is not null and p.title ilike '%' || sq.keyword || '%' then 'title' end,
				case when sq.keyword is not null and p.citation ilike '%' || sq.keyword || '%' then 'citation' end,
				case when sq.keyword is not null and p.journal ilike '%' || sq.keyword || '%' then 'journal' end
			], null) as matched_fields,
			r.faculty_id::text as faculty_id,
			r.department_id::text as department_id,
			extract(year from coalesce(p.published_on::timestamp, p.created_at))::int as year,
			jsonb_build_object(
				'type', p.type,
				'journal', p.journal,
				'doi', p.doi
			) as metadata
		from publications p
		join research_records r on r.id = p.research_record_id
		cross join search_query sq
		where r.status = 'published'
			and r.access_level = 'public'
			${keywordCondition("p.title", "p.citation", "p.journal")}
			${scopeFilters(request, "r")}
			${yearFilter(request, "coalesce(p.published_on::timestamp, p.created_at)")}
			${publicationTypeFilter(request)}
			${keywordListFilter(request)}
	`;
}

function researcherSearchQuery(request: NormalizedSearchRequest): SQL {
	return sql`
		select
			u.id::text as id,
			'researcher' as entity_type,
			u.name as title,
			coalesce(up.bio, array_to_string(up.research_interests, ', '), '') as summary,
			'/researchers/' || u.id::text as url,
			case
				when sq.query is null then 0
				else ts_rank_cd(
					to_tsvector('english', coalesce(u.name, '') || ' ' || coalesce(up.bio, '') || ' ' || coalesce(array_to_string(up.research_interests, ' '), '')),
					sq.query
				)
			end as score,
			array_remove(array[
				case when sq.keyword is not null and u.name ilike '%' || sq.keyword || '%' then 'name' end,
				case when sq.keyword is not null and up.bio ilike '%' || sq.keyword || '%' then 'bio' end,
				case when sq.keyword is not null and array_to_string(up.research_interests, ' ') ilike '%' || sq.keyword || '%' then 'researchInterests' end
			], null) as matched_fields,
			up.faculty_id::text as faculty_id,
			up.department_id::text as department_id,
			null::int as year,
			jsonb_build_object(
				'title', up.title,
				'orcid', up.orcid,
				'publicEmail', up.public_email
			) as metadata
		from users u
		join user_profiles up on up.user_id = u.id
		cross join search_query sq
		where u.status = 'active'
			${keywordCondition("u.name", "up.bio", "array_to_string(up.research_interests, ' ')")}
			${profileScopeFilters(request)}
			${researcherFilter(request, "u.id")}
	`;
}

function innovationSearchQuery(request: NormalizedSearchRequest): SQL {
	return sql`
		select
			i.id::text as id,
			'innovation' as entity_type,
			i.title,
			i.summary,
			'/innovations/' || i.id::text as url,
			case
				when sq.query is null then 0
				else ts_rank_cd(
					to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.summary, '') || ' ' || coalesce(array_to_string(i.industry_applications, ' '), '')),
					sq.query
				)
			end as score,
			array_remove(array[
				case when sq.keyword is not null and i.title ilike '%' || sq.keyword || '%' then 'title' end,
				case when sq.keyword is not null and i.summary ilike '%' || sq.keyword || '%' then 'summary' end,
				case when sq.keyword is not null and array_to_string(i.industry_applications, ' ') ilike '%' || sq.keyword || '%' then 'industryApplications' end
			], null) as matched_fields,
			i.faculty_id::text as faculty_id,
			i.department_id::text as department_id,
			extract(year from coalesce(i.published_at, i.created_at))::int as year,
			jsonb_build_object(
				'slug', i.slug,
				'status', i.status,
				'technologyReadinessLevel', i.technology_readiness_level
			) as metadata
		from innovations i
		cross join search_query sq
		where i.status = 'published'
			${keywordCondition("i.title", "i.summary", "array_to_string(i.industry_applications, ' ')")}
			${scopeFilters(request, "i")}
			${yearFilter(request, "coalesce(i.published_at, i.created_at)")}
			${innovationStatusFilter(request)}
	`;
}

function patentSearchQuery(request: NormalizedSearchRequest): SQL {
	return sql`
		select
			p.id::text as id,
			'patent' as entity_type,
			p.title,
			coalesce(p.abstract, p.claims_summary, '') as summary,
			'/patents/' || p.id::text as url,
			case
				when sq.query is null then 0
				else ts_rank_cd(
					to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.abstract, '') || ' ' || coalesce(p.claims_summary, '')),
					sq.query
				)
			end as score,
			array_remove(array[
				case when sq.keyword is not null and p.title ilike '%' || sq.keyword || '%' then 'title' end,
				case when sq.keyword is not null and p.abstract ilike '%' || sq.keyword || '%' then 'abstract' end,
				case when sq.keyword is not null and p.claims_summary ilike '%' || sq.keyword || '%' then 'claimsSummary' end
			], null) as matched_fields,
			i.faculty_id::text as faculty_id,
			i.department_id::text as department_id,
			extract(year from coalesce(p.granted_on::timestamp, p.filed_on::timestamp, p.created_at))::int as year,
			jsonb_build_object(
				'status', p.status,
				'jurisdiction', p.jurisdiction,
				'patentNumber', p.patent_number
			) as metadata
		from patents p
		join innovations i on i.id = p.innovation_id
		cross join search_query sq
		where i.status = 'published'
			${keywordCondition("p.title", "p.abstract", "p.claims_summary")}
			${scopeFilters(request, "i")}
			${yearFilter(request, "coalesce(p.granted_on::timestamp, p.filed_on::timestamp, p.created_at)")}
			${patentStatusFilter(request)}
	`;
}

function keywordCondition(...columns: string[]): SQL {
	return sql`
		and (
			sq.query is null
			or to_tsvector('english', ${sql.raw(
				columns.map((column) => `coalesce(${column}, '')`).join(" || ' ' || "),
			)}) @@ sq.query
			or ${sql.raw(columns.map((column) => `${column} ilike '%' || sq.keyword || '%'`).join(" or "))}
		)
	`;
}

function scopeFilters(
	request: NormalizedSearchRequest,
	tableAlias: string,
): SQL {
	return sql.join(
		[
			request.filters.facultyId
				? sql`and ${sql.raw(`${tableAlias}.faculty_id`)} = ${request.filters.facultyId}`
				: sql``,
			request.filters.departmentId
				? sql`and ${sql.raw(`${tableAlias}.department_id`)} = ${request.filters.departmentId}`
				: sql``,
		],
		sql` `,
	);
}

function profileScopeFilters(request: NormalizedSearchRequest): SQL {
	return sql.join(
		[
			request.filters.facultyId
				? sql`and up.faculty_id = ${request.filters.facultyId}`
				: sql``,
			request.filters.departmentId
				? sql`and up.department_id = ${request.filters.departmentId}`
				: sql``,
		],
		sql` `,
	);
}

function yearFilter(
	request: NormalizedSearchRequest,
	timestampExpression: string,
): SQL {
	return request.filters.year
		? sql`and extract(year from ${sql.raw(timestampExpression)})::int = ${request.filters.year}`
		: sql``;
}

function researchAreaFilter(request: NormalizedSearchRequest): SQL {
	return request.filters.researchArea
		? sql`and r.research_area = ${request.filters.researchArea}`
		: sql``;
}

function publicationTypeFilter(request: NormalizedSearchRequest): SQL {
	return request.filters.type
		? sql`and p.type = ${request.filters.type}`
		: sql``;
}

function researcherFilter(
	request: NormalizedSearchRequest,
	columnExpression: string,
): SQL {
	return request.filters.researcherId
		? sql`and ${sql.raw(columnExpression)} = ${request.filters.researcherId}`
		: sql``;
}

function innovationStatusFilter(request: NormalizedSearchRequest): SQL {
	if (!request.filters.innovationStatus) {
		return sql``;
	}

	return request.filters.innovationStatus === "published"
		? sql`and i.status = ${request.filters.innovationStatus}`
		: sql`and false`;
}

function patentStatusFilter(request: NormalizedSearchRequest): SQL {
	return request.filters.patentStatus
		? sql`and p.status = ${request.filters.patentStatus}`
		: sql``;
}

function keywordListFilter(request: NormalizedSearchRequest): SQL {
	if (request.filters.keywords.length === 0) {
		return sql``;
	}

	return sql`
		and exists (
			select 1
			from research_keywords rk
			join keywords k on k.id = rk.keyword_id
			where rk.research_record_id = r.id
				and lower(k.value) = any(${request.filters.keywords}::text[])
		)
	`;
}

function sortExpression(request: NormalizedSearchRequest): SQL {
	switch (request.sort) {
		case "newest":
			return sql`year desc nulls last, title asc`;
		case "oldest":
			return sql`year asc nulls last, title asc`;
		case "title":
			return sql`title asc, score desc`;
		case "relevance":
			return sql`score desc, title asc`;
	}
}

function toSearchItem(
	row: SearchRow,
	request: NormalizedSearchRequest,
	index: number,
): SearchResultItem {
	return {
		id: row.id,
		entityType: row.entity_type,
		title: row.title,
		summary: row.summary ?? "",
		url: row.url,
		rank: request.offset + index + 1,
		score: Number(row.score ?? 0),
		matchedFields: row.matched_fields ?? [],
		highlights: [],
		facultyId: row.faculty_id,
		departmentId: row.department_id,
		year: row.year === null ? null : Number(row.year),
		metadata: row.metadata ?? {},
	};
}
