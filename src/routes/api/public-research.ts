import { createFileRoute } from "@tanstack/react-router";
import { type SQL, sql } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { publicRevalidationHeaders } from "./-helpers.ts";

type Database = ReturnType<typeof createDatabase>;

/** Number of related records returned alongside a research detail record. */
const RELATED_RESEARCH_LIMIT = 4;

type PublicResearchRow = {
	id: string;
	title: string;
	abstract: string;
	research_area: string | null;
	faculty_name: string;
	department_name: string;
	published_year: number | string | null;
	published_date: string | null;
	primary_author: string | null;
	image_file_id: string | null;
	keywords: string[] | null;
};

type PublicResearchDetailRow = PublicResearchRow & {
	authors: string[] | null;
	access_level: string;
	publication_title: string | null;
	publication_type: string | null;
	citation: string | null;
	commercialization_status: string | null;
	funding_info: string | null;
	comment: string | null;
	owner_id: string | null;
	department_id: string;
};

export type PublicResearchItem = {
	id: string;
	title: string;
	meta: string;
	description: string;
	href: string;
	tags: string[];
	/** First listed author, when available, for a compact byline. */
	authorName: string | null;
	/** Human-readable publication date (falls back to the year, or a generic label). */
	publishedDate: string;
	/** Id of an uploaded research image, resolved to a signed URL via `/api/files/signed-download-url`. */
	imageFileId: string | null;
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
	commercializationStatus: string | null;
	fundingInfo: string | null;
	comment: string | null;
	imageFileId: string | null;
	/** The id of the research record owner, usable as a `/researchers/$profileId` link target. */
	ownerId: string | null;
	/** A handful of other public research records sharing the same department or research area. */
	related: PublicResearchItem[];
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
							to_char(coalesce(r.published_at, r.created_at), 'FMDD Mon YYYY') as published_date,
							(
								select a2.name
								from research_authors ra2
								join authors a2 on a2.id = ra2.author_id
								where ra2.research_record_id = r.id
								order by a2.name
								limit 1
							) as primary_author,
							p.title as publication_title,
							p.type::text as publication_type,
							p.citation,
							r.commercialization_status,
							r.funding_info,
							r.comment,
							r.owner_id::text as owner_id,
							r.department_id::text as department_id,
							(
								select img.id::text
								from files img
								where img.research_record_id = r.id
									and img.purpose = 'research_image'
								order by img.created_at desc
								limit 1
							) as image_file_id,
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
							p.citation,
							r.commercialization_status,
							r.funding_info,
							r.comment,
							r.owner_id,
							r.department_id
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

					// Related works: other published, public records that share the same
					// department or research area, excluding the current record.
					const related = await queryPublicResearchItems(database, {
						where: sql`
							r.id != ${recordId}
							and (
								r.department_id = ${row.department_id}
								${row.research_area ? sql`or r.research_area = ${row.research_area}` : sql``}
							)
						`,
						limit: RELATED_RESEARCH_LIMIT,
					});

					return Response.json(
						{ data: toPublicResearchDetail(row, related) },
						{ headers: publicRevalidationHeaders },
					);
				}

				const items = await queryPublicResearchItems(database, {
					where: sql`true`,
					limit: 30,
				});

				return Response.json(
					{ data: items },
					{ headers: publicRevalidationHeaders },
				);
			},
		},
	},
});

/**
 * Runs the shared public-research listing query (published + public records)
 * with a caller-supplied `where` fragment and row limit. Used for both the
 * `/research` collection listing and the "related works" strip on a detail
 * page.
 */
async function queryPublicResearchItems(
	database: Database,
	options: { where: SQL; limit: number },
): Promise<PublicResearchItem[]> {
	const result = await database.execute<PublicResearchRow>(sql`
		select
			r.id::text as id,
			r.title,
			r.abstract,
			r.research_area,
			f.name as faculty_name,
			d.name as department_name,
			extract(year from coalesce(r.published_at, r.created_at))::int as published_year,
			to_char(coalesce(r.published_at, r.created_at), 'FMDD Mon YYYY') as published_date,
			(
				select a2.name
				from research_authors ra2
				join authors a2 on a2.id = ra2.author_id
				where ra2.research_record_id = r.id
				order by a2.name
				limit 1
			) as primary_author,
			(
				select img.id::text
				from files img
				where img.research_record_id = r.id
					and img.purpose = 'research_image'
				order by img.created_at desc
				limit 1
			) as image_file_id,
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
			and (${options.where})
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
		limit ${options.limit}
	`);

	return result.rows.map(toPublicResearchItem);
}

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
		authorName: row.primary_author,
		publishedDate: row.published_date ?? year,
		imageFileId: row.image_file_id,
	};
}

function toPublicResearchDetail(
	row: PublicResearchDetailRow,
	related: PublicResearchItem[],
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
		commercializationStatus: row.commercialization_status,
		fundingInfo: row.funding_info,
		comment: row.comment,
		imageFileId: row.image_file_id,
		ownerId: row.owner_id,
		related,
	};
}
