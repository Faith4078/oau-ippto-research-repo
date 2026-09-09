import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { requireDatabaseUrl } from "#/db/env.ts";
import { isOwnerEditableResearchStatus } from "#/domain/approval-workflow.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { createDatabase, schema } from "#/infrastructure/db/index.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	asEntityId,
	auditContextFromRequest,
	jsonResult,
	readJsonBody,
} from "../-helpers.ts";

export const Route = createFileRoute(
	"/api/research/submissions/$researchRecordId",
)({
	server: {
		handlers: {
			GET: async ({
				params,
				request,
			}: {
				params: { researchRecordId: string };
				request: Request;
			}) => {
				const session = await readAuthSession(request);

				if (session.status !== "authenticated") {
					return Response.json(
						{
							error: {
								code: "AUTHENTICATION_REQUIRED",
								message: "Sign in to view this submission.",
							},
						},
						{ status: 401 },
					);
				}

				const database = createDatabase(requireDatabaseUrl());
				const researchRecordId = params.researchRecordId;

				const [record] = await database
					.select()
					.from(schema.researchRecords)
					.where(eq(schema.researchRecords.id, researchRecordId));

				if (!record || record.ownerId !== session.session.user.id) {
					return Response.json(
						{
							error: {
								code: "RESEARCH_NOT_FOUND",
								message: "The research record was not found.",
							},
						},
						{ status: 404 },
					);
				}

				const [authorRows, keywordRows, [publication], fileRows] =
					await Promise.all([
						database
							.select({
								name: schema.authors.name,
								email: schema.authors.email,
								affiliation: schema.authors.affiliation,
								orcid: schema.authors.orcid,
								isCorresponding: schema.researchAuthors.isCorresponding,
								contribution: schema.researchAuthors.contribution,
							})
							.from(schema.researchAuthors)
							.innerJoin(
								schema.authors,
								eq(schema.authors.id, schema.researchAuthors.authorId),
							)
							.where(
								eq(schema.researchAuthors.researchRecordId, researchRecordId),
							)
							.orderBy(schema.researchAuthors.position),
						database
							.select({ value: schema.keywords.value })
							.from(schema.researchKeywords)
							.innerJoin(
								schema.keywords,
								eq(schema.keywords.id, schema.researchKeywords.keywordId),
							)
							.where(
								eq(schema.researchKeywords.researchRecordId, researchRecordId),
							),
						database
							.select()
							.from(schema.publications)
							.where(eq(schema.publications.researchRecordId, researchRecordId))
							.limit(1),
						database
							.select({
								id: schema.files.id,
								filename: schema.files.filename,
								mimeType: schema.files.mimeType,
								purpose: schema.files.purpose,
							})
							.from(schema.files)
							.where(eq(schema.files.researchRecordId, researchRecordId)),
					]);

				return Response.json({
					data: {
						id: record.id,
						title: record.title,
						abstract: record.abstract,
						status: record.status,
						editable: isOwnerEditableResearchStatus(record.status),
						accessLevel: record.accessLevel,
						facultyId: record.facultyId,
						departmentId: record.departmentId,
						researchArea: record.researchArea,
						startedOn: record.startedOn,
						completedOn: record.completedOn,
						requiresIpttoReview: record.metadata?.requiresIpttoReview === true,
						commercializationStatus: record.commercializationStatus,
						fundingInfo: record.fundingInfo,
						comment: record.comment,
						authors: authorRows,
						keywords: keywordRows.map((row) => row.value),
						publication: publication
							? {
									type: publication.type,
									title: publication.title,
									publisher: publication.publisher,
									journal: publication.journal,
									volume: publication.volume,
									issue: publication.issue,
									pages: publication.pages,
									doi: publication.doi,
									isbn: publication.isbn,
									url: publication.url,
									publishedOn: publication.publishedOn,
									citation: publication.citation,
								}
							: null,
						files: fileRows,
					},
				});
			},
			PATCH: async ({
				params,
				request,
			}: {
				params: { researchRecordId: string };
				request: Request;
			}) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);

				return jsonResult(
					await services.researchWorkflow.updateSubmission(
						actorFromSession(session),
						asEntityId(params.researchRecordId),
						payload,
						auditContextFromRequest(request),
					),
				);
			},
			DELETE: async ({
				params,
				request,
			}: {
				params: { researchRecordId: string };
				request: Request;
			}) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);

				return jsonResult(
					await services.researchWorkflow.deleteSubmission(
						actorFromSession(session),
						asEntityId(params.researchRecordId),
						auditContextFromRequest(request),
					),
				);
			},
		},
	},
});
