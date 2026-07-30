import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";

type PublicResearchRow = {
	id: string;
	title: string;
	abstract: string;
	research_area: string | null;
	faculty_name: string;
	department_name: string;
	published_year: number | string | null;
	keywords: string[] | null;
};

type PublicResearchDetailRow = PublicResearchRow & {
	authors: string[] | null;
	access_level: string;
	publication_title: string | null;
	publication_type: string | null;
	citation: string | null;
};

export type PublicResearchItem = {
	id: string;
	title: string;
	meta: string;
	description: string;
	href: string;
	tags: string[];
};

export type PublicResearchDetail = PublicResearchItem & {
	abstract: string;
	accessLevel: string;
	authors: string[];
	department: string;
	faculty: string;
	publicationTitle: string | null;
	publicationType: string | null;
	citation: string | null;
	year: string;
};

export const Route = createFileRoute("/api/public-research")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const database = createDatabase(requireDatabaseUrl());
				const recordId = new URL(request.url).searchParams.get("recordId");

				if (recordId) {
					const result = await database.execute<PublicResearchDetailRow>(sql`
						select
							r.id::text as id,
							r.title,
							r.abstract,
							r.research_area,
							r.access_level,
							f.name as faculty_name,
							d.name as department_name,
							extract(year from coalesce(r.published_at, r.created_at))::int as published_year,
							p.title as publication_title,
							p.type::text as publication_type,
							p.citation,
							coalesce(
								array_agg(distinct a.name order by a.name)
									filter (where a.name is not null),
								array[]::text[]
							) as authors,
							coalesce(
								array_agg(distinct k.value order by k.value)
									filter (where k.value is not null),
								array[]::text[]
							) as keywords
						from research_records r
						join faculties f on f.id = r.faculty_id
						join departments d on d.id = r.department_id
						left join publications p on p.research_record_id = r.id
						left join research_authors ra on ra.research_record_id = r.id
						left join authors a on a.id = ra.author_id
						left join research_keywords rk on rk.research_record_id = r.id
						left join keywords k on k.id = rk.keyword_id
						where r.id = ${recordId}
							and r.status = 'published'
							and r.access_level = 'public'
						group by
							r.id,
							r.title,
							r.abstract,
							r.research_area,
							r.access_level,
							f.name,
							d.name,
							r.published_at,
							r.created_at,
							p.title,
							p.type,
							p.citation
						limit 1
					`);
					const row = result.rows[0];

					if (!row) {
						return Response.json(
							{
								error: {
									code: "PUBLIC_RESEARCH_NOT_FOUND",
									message: "Public research record was not found.",
								},
							},
							{ status: 404 },
						);
					}

					return Response.json({
						data: toPublicResearchDetail(row),
					});
				}

				const result = await database.execute<PublicResearchRow>(sql`
					select
						r.id::text as id,
						r.title,
						r.abstract,
						r.research_area,
						f.name as faculty_name,
						d.name as department_name,
						extract(year from coalesce(r.published_at, r.created_at))::int as published_year,
						coalesce(
							array_agg(k.value order by k.value)
								filter (where k.value is not null),
							array[]::text[]
						) as keywords
					from research_records r
					join faculties f on f.id = r.faculty_id
					join departments d on d.id = r.department_id
					left join research_keywords rk on rk.research_record_id = r.id
					left join keywords k on k.id = rk.keyword_id
					where r.status = 'published'
						and r.access_level = 'public'
					group by
						r.id,
						r.title,
						r.abstract,
						r.research_area,
						f.name,
						d.name,
						r.published_at,
						r.created_at
					order by coalesce(r.published_at, r.created_at) desc
					limit 30
				`);

				return Response.json({
					data: result.rows.map(toPublicResearchItem),
				});
			},
		},
	},
});

function toPublicResearchItem(row: PublicResearchRow): PublicResearchItem {
	const year = row.published_year ? String(row.published_year) : "Published";
	const tags = [
		row.research_area,
		...((row.keywords ?? []) as string[]),
		"Live record",
	]
		.filter((tag): tag is string => Boolean(tag))
		.slice(0, 4);

	return {
		id: row.id,
		title: row.title,
		meta: `${row.department_name} | ${row.faculty_name} | ${year}`,
		description: row.abstract,
		href: `/research/${row.id}`,
		tags,
	};
}

function toPublicResearchDetail(
	row: PublicResearchDetailRow,
): PublicResearchDetail {
	const item = toPublicResearchItem(row);
	const year = row.published_year ? String(row.published_year) : "Published";

	return {
		...item,
		abstract: row.abstract,
		accessLevel: row.access_level,
		authors: (row.authors ?? []) as string[],
		department: row.department_name,
		faculty: row.faculty_name,
		publicationTitle: row.publication_title,
		publicationType: row.publication_type,
		citation: row.citation,
		year,
	};
}
