import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { requireDatabaseUrl } from "#/db/env.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { createDatabase, schema } from "#/infrastructure/db/index.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	auditContextFromRequest,
	jsonResult,
	readJsonBody,
} from "../-helpers.ts";

export const Route = createFileRoute("/api/research/submissions")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);

				if (session.status !== "authenticated") {
					return Response.json(
						{
							error: {
								code: "AUTHENTICATION_REQUIRED",
								message: "Sign in to view your submissions.",
							},
						},
						{ status: 401 },
					);
				}

				const database = createDatabase(requireDatabaseUrl());
				const rows = await database
					.select({
						id: schema.researchRecords.id,
						title: schema.researchRecords.title,
						status: schema.researchRecords.status,
						accessLevel: schema.researchRecords.accessLevel,
						department: schema.departments.name,
						createdAt: schema.researchRecords.createdAt,
						publishedAt: schema.researchRecords.publishedAt,
						researchArea: schema.researchRecords.researchArea,
					})
					.from(schema.researchRecords)
					.leftJoin(
						schema.departments,
						eq(schema.departments.id, schema.researchRecords.departmentId),
					)
					.where(eq(schema.researchRecords.ownerId, session.session.user.id))
					.orderBy(desc(schema.researchRecords.createdAt))
					.limit(25);

				return Response.json({
					data: rows.map((row) => ({
						id: row.id,
						title: row.title,
						status: row.status,
						statusLabel: toStatusLabel(row.status),
						accessLevel: row.accessLevel,
						department: row.department ?? "Unassigned department",
						date: formatDate(row.publishedAt ?? row.createdAt),
						type: row.researchArea ?? "Research Output",
						published: row.status === "published",
					})),
				});
			},
			POST: async ({ request }: { request: Request }) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				const result = await services.researchWorkflow.createSubmission(
					actorFromSession(session),
					payload,
					auditContextFromRequest(request),
				);

				if (result.ok) {
					await services.backgroundJobs.enqueue({
						type: "ai_summary",
						payload: {
							researchRecordId: result.value.id,
						},
					});
					await services.backgroundJobs.enqueue({
						type: "search_indexing",
						payload: {
							researchRecordId: result.value.id,
							status: result.value.status,
						},
					});
				}

				return jsonResult(result);
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

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}
