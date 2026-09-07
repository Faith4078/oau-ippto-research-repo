import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { publicRevalidationHeaders } from "./-helpers.ts";

type PublicRecordType =
	| "researcher"
	| "department"
	| "faculty"
	| "innovation"
	| "patent";

export type PublicRecordDetail = {
	title: string;
	eyebrow: string;
	description: string;
	backHref: string;
	backLabel: string;
	facts: Array<{ label: string; value: string }>;
	sections: Array<{ title: string; body: string }>;
	tags: string[];
};

export const Route = createFileRoute("/api/public-record")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const url = new URL(request.url);
				const type = url.searchParams.get("type") as PublicRecordType | null;
				const id = url.searchParams.get("id");

				if (!type || !isPublicRecordType(type) || !id || !isUuid(id)) {
					return errorResponse(
						"INVALID_PUBLIC_RECORD",
						"A valid public record type and identifier are required.",
						400,
					);
				}

				const database = createDatabase(requireDatabaseUrl());
				const detail = await readPublicRecord(database, type, id);

				if (!detail) {
					return errorResponse(
						"PUBLIC_RECORD_NOT_FOUND",
						"This public record was not found or is not published.",
						404,
					);
				}

				return Response.json(
					{ data: detail },
					{ headers: publicRevalidationHeaders },
				);
			},
		},
	},
});

type Database = ReturnType<typeof createDatabase>;

async function readPublicRecord(
	database: Database,
	type: PublicRecordType,
	id: string,
): Promise<PublicRecordDetail | null> {
	switch (type) {
		case "researcher":
			return readResearcher(database, id);
		case "department":
			return readDepartment(database, id);
		case "faculty":
			return readFaculty(database, id);
		case "innovation":
			return readInnovation(database, id);
		case "patent":
			return readPatent(database, id);
	}
}

async function readResearcher(database: Database, id: string) {
	type Row = {
		name: string;
		profile_title: string | null;
		bio: string | null;
		research_interests: string[] | null;
		orcid: string | null;
		public_email: string | null;
		faculty_name: string | null;
		department_name: string | null;
		publication_count: number | string;
	};
	const result = await database.execute<Row>(sql`
		select
			u.name,
			up.title as profile_title,
			up.bio,
			up.research_interests,
			up.orcid,
			up.public_email,
			f.name as faculty_name,
			d.name as department_name,
			count(distinct r.id)::int as publication_count
		from users u
		join user_profiles up on up.user_id = u.id
		left join faculties f on f.id = up.faculty_id
		left join departments d on d.id = up.department_id
		left join research_records r on r.owner_id = u.id
			and r.status = 'published' and r.access_level = 'public'
		where u.id = ${id} and u.status = 'active'
		group by u.id, u.name, up.title, up.bio, up.research_interests,
			up.orcid, up.public_email, f.name, d.name
		limit 1
	`);
	const row = result.rows[0];
	if (!row) return null;
	const interests = row.research_interests ?? [];
	return {
		title: row.name,
		eyebrow: row.profile_title ?? "OAU Researcher",
		description:
			row.bio ??
			"Explore this researcher's public profile and published work at Obafemi Awolowo University.",
		backHref: "/researchers",
		backLabel: "Back to all researchers",
		facts: compactFacts([
			["Title", row.profile_title],
			["Faculty", row.faculty_name],
			["Department", row.department_name],
			["Published research", String(row.publication_count)],
		]),
		sections: [
			{
				title: "Research interests",
				body: interests.length
					? interests.join(", ")
					: "Research interests have not yet been added to this public profile.",
			},
			{
				title: "Research identity",
				body: row.orcid
					? `ORCID: ${row.orcid}`
					: "No ORCID has been published.",
			},
			{
				title: "Public contact",
				body:
					row.public_email ?? "No public contact address has been provided.",
			},
		],
		tags: interests.slice(0, 6),
	} satisfies PublicRecordDetail;
}

async function readDepartment(database: Database, id: string) {
	type Row = {
		name: string;
		description: string | null;
		code: string | null;
		faculty_name: string;
		researcher_count: number | string;
		research_count: number | string;
	};
	const result = await database.execute<Row>(sql`
		select d.name, d.description, d.code, f.name as faculty_name,
			(select count(*) from user_profiles up join users u on u.id = up.user_id
				where up.department_id = d.id and u.status = 'active')::int as researcher_count,
			(select count(*) from research_records r where r.department_id = d.id
				and r.status = 'published' and r.access_level = 'public')::int as research_count
		from departments d
		join faculties f on f.id = d.faculty_id
		where d.id = ${id}
		limit 1
	`);
	const row = result.rows[0];
	if (!row) return null;
	return organizationDetail({
		title: row.name,
		eyebrow: row.faculty_name,
		description: row.description,
		backHref: "/departments",
		backLabel: "Back to all departments",
		code: row.code,
		researcherCount: row.researcher_count,
		researchCount: row.research_count,
		scopeLabel: "department",
	});
}

async function readFaculty(database: Database, id: string) {
	type Row = {
		name: string;
		description: string | null;
		code: string | null;
		department_count: number | string;
		researcher_count: number | string;
		research_count: number | string;
	};
	const result = await database.execute<Row>(sql`
		select f.name, f.description, f.code,
			(select count(*) from departments d where d.faculty_id = f.id)::int as department_count,
			(select count(*) from user_profiles up join users u on u.id = up.user_id
				where up.faculty_id = f.id and u.status = 'active')::int as researcher_count,
			(select count(*) from research_records r where r.faculty_id = f.id
				and r.status = 'published' and r.access_level = 'public')::int as research_count
		from faculties f
		where f.id = ${id}
		limit 1
	`);
	const row = result.rows[0];
	if (!row) return null;
	const detail = organizationDetail({
		title: row.name,
		eyebrow: "OAU Faculty",
		description: row.description,
		backHref: "/faculties",
		backLabel: "Back to all faculties",
		code: row.code,
		researcherCount: row.researcher_count,
		researchCount: row.research_count,
		scopeLabel: "faculty",
	});
	detail.facts.splice(1, 0, {
		label: "Departments",
		value: String(row.department_count),
	});
	return detail;
}

async function readInnovation(database: Database, id: string) {
	type Row = {
		title: string;
		summary: string;
		technology_readiness_level: number | null;
		industry_applications: string[] | null;
		faculty_name: string | null;
		department_name: string | null;
		lead_researcher: string | null;
		inventors: string[] | null;
	};
	const result = await database.execute<Row>(sql`
		select i.title, i.summary, i.technology_readiness_level,
			i.industry_applications, f.name as faculty_name,
			d.name as department_name, u.name as lead_researcher,
			coalesce(array_agg(distinct inv.name) filter (where inv.name is not null), array[]::text[]) as inventors
		from innovations i
		left join faculties f on f.id = i.faculty_id
		left join departments d on d.id = i.department_id
		left join users u on u.id = i.lead_researcher_id
		left join innovation_inventors ii on ii.innovation_id = i.id
		left join inventors inv on inv.id = ii.inventor_id
		where i.id = ${id} and i.status = 'published'
		group by i.id, i.title, i.summary, i.technology_readiness_level,
			i.industry_applications, f.name, d.name, u.name
		limit 1
	`);
	const row = result.rows[0];
	if (!row) return null;
	return {
		title: row.title,
		eyebrow: "Published Innovation",
		description: row.summary,
		backHref: "/innovations",
		backLabel: "Back to all innovations",
		facts: compactFacts([
			[
				"Technology readiness",
				row.technology_readiness_level
					? `TRL ${row.technology_readiness_level}`
					: null,
			],
			["Faculty", row.faculty_name],
			["Department", row.department_name],
			["Lead researcher", row.lead_researcher],
		]),
		sections: [
			{
				title: "Inventors",
				body: row.inventors?.join(", ") || "No inventors are publicly listed.",
			},
			{
				title: "Industry applications",
				body:
					row.industry_applications?.join(", ") ||
					"Applications are being assessed by IPTTO.",
			},
			{
				title: "Work with IPTTO",
				body: "Contact IPTTO to discuss licensing, collaboration, or technology transfer.",
			},
		],
		tags: row.industry_applications ?? [],
	} satisfies PublicRecordDetail;
}

async function readPatent(database: Database, id: string) {
	type Row = {
		title: string;
		abstract: string | null;
		claims_summary: string | null;
		status: string;
		application_number: string | null;
		patent_number: string | null;
		jurisdiction: string | null;
		filed_on: string | null;
		granted_on: string | null;
		innovation_title: string;
		inventors: string[] | null;
	};
	const result = await database.execute<Row>(sql`
		select p.title, p.abstract, p.claims_summary, p.status,
			p.application_number, p.patent_number, p.jurisdiction,
			p.filed_on::text, p.granted_on::text, i.title as innovation_title,
			coalesce(array_agg(distinct inv.name) filter (where inv.name is not null), array[]::text[]) as inventors
		from patents p
		join innovations i on i.id = p.innovation_id and i.status = 'published'
		left join patent_inventors pi on pi.patent_id = p.id
		left join inventors inv on inv.id = pi.inventor_id
		where p.id = ${id}
		group by p.id, p.title, p.abstract, p.claims_summary, p.status,
			p.application_number, p.patent_number, p.jurisdiction,
			p.filed_on, p.granted_on, i.title
		limit 1
	`);
	const row = result.rows[0];
	if (!row) return null;
	return {
		title: row.title,
		eyebrow: "OAU Patent",
		description:
			row.abstract ??
			row.claims_summary ??
			"Public patent information managed by OAU IPTTO.",
		backHref: "/patents",
		backLabel: "Back to all patents",
		facts: compactFacts([
			["Status", row.status.replace(/_/g, " ")],
			["Application number", row.application_number],
			["Patent number", row.patent_number],
			["Jurisdiction", row.jurisdiction],
			["Filed", row.filed_on],
			["Granted", row.granted_on],
		]),
		sections: [
			{ title: "Related innovation", body: row.innovation_title },
			{
				title: "Inventors",
				body: row.inventors?.join(", ") || "No inventors are publicly listed.",
			},
			{
				title: "Claims summary",
				body: row.claims_summary ?? "A public claims summary is not available.",
			},
		],
		tags: [row.status.replace(/_/g, " "), row.jurisdiction].filter(
			(value): value is string => Boolean(value),
		),
	} satisfies PublicRecordDetail;
}

function organizationDetail(input: {
	title: string;
	eyebrow: string;
	description: string | null;
	backHref: string;
	backLabel: string;
	code: string | null;
	researcherCount: number | string;
	researchCount: number | string;
	scopeLabel: "faculty" | "department";
}): PublicRecordDetail {
	return {
		title: input.title,
		eyebrow: input.eyebrow,
		description:
			input.description ??
			`Explore public research and researcher activity in this OAU ${input.scopeLabel}.`,
		backHref: input.backHref,
		backLabel: input.backLabel,
		facts: compactFacts([
			["Code", input.code],
			["Researchers", String(input.researcherCount)],
			["Published research", String(input.researchCount)],
		]),
		sections: [
			{
				title: "Research",
				body: `${input.researchCount} public research records are currently available.`,
			},
			{
				title: "Researchers",
				body: `${input.researcherCount} active researcher profiles are associated with this ${input.scopeLabel}.`,
			},
			{
				title: "Discovery",
				body: "Use repository search to find related publications, researchers, innovations, and patents.",
			},
		],
		tags: [input.scopeLabel === "faculty" ? "Faculty" : "Department"],
	};
}

function compactFacts(
	values: Array<[string, string | null | undefined]>,
): Array<{ label: string; value: string }> {
	return values
		.filter((value): value is [string, string] => Boolean(value[1]))
		.map(([label, value]) => ({ label, value }));
}

function isPublicRecordType(value: string): value is PublicRecordType {
	return [
		"researcher",
		"department",
		"faculty",
		"innovation",
		"patent",
	].includes(value);
}

function isUuid(value: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}

function errorResponse(code: string, message: string, status: number) {
	return Response.json({ error: { code, message } }, { status });
}
