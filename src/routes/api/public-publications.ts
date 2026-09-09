import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { publicRevalidationHeaders } from "./-helpers.ts";

type PublicPublicationRow = {
	id: string;
	title: string;
	type: string;
	journal: string | null;
	published_on: string | null;
	created_at: string;
	research_record_id: string;
	primary_author: string | null;
	image_file_id: string | null;
};

export type PublicPublicationItem = {
	id: string;
	title: string;
	type: string;
	journal: string | null;
	publishedDate: string;
	href: string;
	authorName: string | null;
	imageFileId: string | null;
	researchRecordId: string;
};

export const Route = createFileRoute("/api/public-publications")({
	server: {
		handlers: {
			GET: async () => {
				const database = createDatabase(requireDatabaseUrl());

				const result = await database.execute<PublicPublicationRow>(sql`
					select
						p.id::text as id,
						p.title,
						p.type::text as type,
						p.journal,
						to_char(coalesce(p.published_on::timestamp, p.created_at), 'FMDD Mon YYYY') as published_on,
						p.created_at,
						r.id::text as research_record_id,
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
						) as image_file_id
					from publications p
					join research_records r on r.id = p.research_record_id
					where r.status = 'published'
						and r.access_level = 'public'
					order by coalesce(p.published_on::timestamp, p.created_at) desc
					limit 12
				`);

				return Response.json(
					{ data: result.rows.map(toPublicPublicationItem) },
					{ headers: publicRevalidationHeaders },
				);
			},
		},
	},
});

function toPublicPublicationItem(
	row: PublicPublicationRow,
): PublicPublicationItem {
	return {
		id: row.id,
		title: row.title,
		type: row.type,
		journal: row.journal,
		publishedDate: row.published_on ?? "Published",
		href: `/research/${row.research_record_id}`,
		authorName: row.primary_author,
		imageFileId: row.image_file_id,
		researchRecordId: row.research_record_id,
	};
}
