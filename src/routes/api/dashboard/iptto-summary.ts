import { createFileRoute } from "@tanstack/react-router";
import { desc, sql } from "drizzle-orm";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase, schema } from "#/infrastructure/db/index.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

export const Route = createFileRoute("/api/dashboard/iptto-summary")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);

				if (
					session.status !== "authenticated" ||
					!(
						session.session.user.roles.includes("iptto_officer") ||
						session.session.user.roles.includes("super_administrator")
					)
				) {
					return Response.json(
						{
							error: {
								code: "AUTHORIZATION_REQUIRED",
								message: "Sign in as IPTTO staff to view this dashboard.",
							},
						},
						{ status: 403 },
					);
				}

				const database = createDatabase(requireDatabaseUrl());

				const [
					[innovationCount],
					[patentCount],
					[commercializationCount],
					[reviewCount],
				] = await Promise.all([
					database
						.select({ value: sql<number>`count(*)::int` })
						.from(schema.innovations),
					database
						.select({ value: sql<number>`count(*)::int` })
						.from(schema.patents),
					database
						.select({ value: sql<number>`count(*)::int` })
						.from(schema.commercializationActivities),
					database
						.select({ value: sql<number>`count(*)::int` })
						.from(schema.ipttoReviews),
				]);

				const innovationRows = await database
					.select({
						id: schema.innovations.id,
						title: schema.innovations.title,
						status: schema.innovations.status,
						department: schema.departments.name,
						createdAt: schema.innovations.createdAt,
						type: sql<string>`'Innovation'`,
						owner: schema.users.name,
					})
					.from(schema.innovations)
					.leftJoin(
						schema.departments,
						sql`${schema.departments.id} = ${schema.innovations.departmentId}`,
					)
					.leftJoin(
						schema.users,
						sql`${schema.users.id} = ${schema.innovations.leadResearcherId}`,
					)
					.orderBy(desc(schema.innovations.createdAt))
					.limit(8);

				const patentRows = await database
					.select({
						id: schema.patents.id,
						title: schema.patents.title,
						status: schema.patents.status,
						department: sql<string | null>`null`,
						createdAt: schema.patents.createdAt,
						type: sql<string>`'Patent'`,
						owner: sql<string | null>`null`,
					})
					.from(schema.patents)
					.orderBy(desc(schema.patents.createdAt))
					.limit(8);

				const commercializationRows = await database
					.select({
						id: schema.commercializationActivities.id,
						title: schema.commercializationActivities.title,
						status: schema.commercializationActivities.status,
						department: sql<string | null>`null`,
						createdAt: schema.commercializationActivities.createdAt,
						type: sql<string>`'Commercialization'`,
						owner: schema.commercializationActivities.partnerName,
					})
					.from(schema.commercializationActivities)
					.orderBy(desc(schema.commercializationActivities.createdAt))
					.limit(8);

				const rows = [
					...innovationRows,
					...patentRows,
					...commercializationRows,
				]
					.sort(
						(left, right) =>
							right.createdAt.getTime() - left.createdAt.getTime(),
					)
					.slice(0, 12);

				return Response.json({
					data: {
						stats: {
							innovations: innovationCount?.value ?? 0,
							patents: patentCount?.value ?? 0,
							commercialization: commercializationCount?.value ?? 0,
							reviews: reviewCount?.value ?? 0,
						},
						rows: rows.map((row) => ({
							id: row.id,
							title: row.title,
							owner: row.owner ?? "Unassigned",
							department: row.department ?? "Institution-wide",
							date: formatDate(row.createdAt),
							type: row.type,
							status: toStatusLabel(row.status),
							tone: toStatusTone(row.status),
						})),
					},
				});
			},
		},
	},
});

function toStatusLabel(status: string) {
	return status
		.split("_")
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function toStatusTone(status: string) {
	if (["published", "granted", "licensed", "approved"].includes(status)) {
		return "success";
	}

	if (["rejected", "expired", "withdrawn"].includes(status)) {
		return "danger";
	}

	if (["under_review", "filed", "negotiation"].includes(status)) {
		return "warning";
	}

	return "info";
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}
