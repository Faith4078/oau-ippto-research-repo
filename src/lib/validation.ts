import { z } from "zod";
import { fail, ok, type Result } from "../application/result.ts";

const maxResearchFileSizeBytes = 50 * 1024 * 1024;
const entityIdSchema = z
	.string()
	.trim()
	.regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		"Invalid ID format.",
	);

export const accessLevelSchema = z.enum(["public", "restricted", "private"]);

export const publicationTypeSchema = z.enum([
	"journal_article",
	"conference_paper",
	"book",
	"book_chapter",
	"technical_report",
	"thesis",
	"dissertation",
	"working_paper",
	"other",
]);

export const filePurposeSchema = z.enum([
	"research_document",
	"publication",
	"innovation_support",
	"patent_support",
	"profile_image",
	"other",
]);

export const recordStatusSchema = z.enum([
	"draft",
	"submitted",
	"department_review",
	"faculty_review",
	"iptto_review",
	"approved",
	"rejected",
	"published",
	"archived",
]);

export const approvalDecisionSchema = z.enum([
	"submit",
	"approve",
	"reject",
	"request_changes",
	"publish",
	"archive",
]);

export const innovationStatusSchema = z.enum([
	"draft",
	"under_review",
	"approved",
	"published",
	"archived",
]);

export const innovationReviewDecisionSchema = z.enum([
	"approved",
	"changes_requested",
	"rejected",
]);

export const patentStatusSchema = z.enum([
	"idea_disclosure",
	"prior_art_search",
	"filed",
	"pending",
	"granted",
	"licensed",
	"abandoned",
]);

export const commercializationTypeSchema = z.enum([
	"licensing",
	"partnership",
	"spinout",
	"industry_engagement",
	"grant",
	"milestone",
	"other",
]);

const nullableTextSchema = z
	.string()
	.trim()
	.max(500)
	.nullable()
	.optional()
	.transform((value) => (value ? value : null));

export const researchAuthorInputSchema = z.object({
	userId: entityIdSchema.nullable().optional(),
	name: z.string().trim().min(2).max(255),
	email: z.email().nullable().optional(),
	affiliation: z.string().trim().min(2).max(255).nullable().optional(),
	orcid: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i, "Invalid ORCID format.")
		.nullable()
		.optional(),
	isCorresponding: z.boolean().optional().default(false),
	contribution: z.string().trim().max(1000).nullable().optional(),
});

export const publicationMetadataInputSchema = z.object({
	type: publicationTypeSchema,
	title: z.string().trim().min(3).max(500),
	publisher: nullableTextSchema,
	journal: nullableTextSchema,
	volume: nullableTextSchema,
	issue: nullableTextSchema,
	pages: nullableTextSchema,
	doi: nullableTextSchema,
	isbn: nullableTextSchema,
	url: z.url().nullable().optional(),
	publishedOn: z.iso.date().nullable().optional(),
	citation: z.string().trim().max(2000).nullable().optional(),
});

export const researchFileMetadataInputSchema = z.object({
	filename: z.string().trim().min(1).max(255),
	mimeType: z.string().trim().min(3).max(255),
	fileSizeBytes: z.number().int().positive().max(maxResearchFileSizeBytes),
	checksum: z.string().trim().min(16).max(255).nullable().optional(),
	accessLevel: accessLevelSchema,
	purpose: filePurposeSchema.default("research_document"),
});

export const researchSubmissionInputSchema = z.object({
	title: z.string().trim().min(5).max(500),
	abstract: z.string().trim().min(50).max(10000),
	authors: z.array(researchAuthorInputSchema).min(1).max(25),
	departmentId: entityIdSchema,
	facultyId: entityIdSchema,
	keywords: z
		.array(z.string().trim().min(2).max(120))
		.min(1)
		.max(20)
		.transform((keywords) =>
			Array.from(new Set(keywords.map((keyword) => keyword.toLowerCase()))),
		),
	publication: publicationMetadataInputSchema,
	accessLevel: accessLevelSchema,
	files: z.array(researchFileMetadataInputSchema).min(1).max(10),
	researchArea: z.string().trim().min(2).max(255).nullable().optional(),
	startedOn: z.iso.date().nullable().optional(),
	completedOn: z.iso.date().nullable().optional(),
	requiresIpttoReview: z.boolean().optional().default(false),
});

export const researchApprovalTransitionInputSchema = z.object({
	researchRecordId: entityIdSchema,
	fromStatus: recordStatusSchema,
	toStatus: recordStatusSchema,
	decision: approvalDecisionSchema,
	comment: z.string().trim().max(2000).nullable().optional(),
	requiresIpttoReview: z.boolean().optional().default(false),
});

export const signedUploadRequestSchema = z.object({
	researchRecordId: entityIdSchema.nullable().optional(),
	file: researchFileMetadataInputSchema,
});

export const signedDownloadRequestSchema = z.object({
	fileId: entityIdSchema,
	researchRecordId: entityIdSchema.nullable().optional(),
});

const metadataSchema = z.record(z.string(), z.unknown()).optional().default({});

const supportingFileLinkSchema = z.object({
	fileId: z.uuid(),
	label: z.string().trim().min(1).max(255).nullable().optional(),
});

const inventorInputSchema = z.object({
	userId: z.uuid().nullable().optional(),
	name: z.string().trim().min(2).max(255),
	email: z.email().nullable().optional(),
	affiliation: z.string().trim().min(2).max(255).nullable().optional(),
});

export const innovationCreateInputSchema = z.object({
	title: z.string().trim().min(5).max(500),
	summary: z.string().trim().min(20).max(10000),
	facultyId: z.uuid().nullable().optional(),
	departmentId: z.uuid().nullable().optional(),
	leadResearcherId: z.uuid().nullable().optional(),
	researchRecordId: z.uuid().nullable().optional(),
	technologyReadinessLevel: z
		.number()
		.int()
		.min(1)
		.max(9)
		.nullable()
		.optional(),
	industryApplications: z
		.array(z.string().trim().min(2).max(255))
		.max(20)
		.nullable()
		.optional(),
	intellectualPropertyNotes: z.string().trim().max(5000).nullable().optional(),
	inventors: z.array(inventorInputSchema).max(25).optional().default([]),
	supportingFiles: z
		.array(supportingFileLinkSchema)
		.max(20)
		.optional()
		.default([]),
	metadata: metadataSchema,
});

export const innovationUpdateInputSchema = innovationCreateInputSchema
	.partial()
	.extend({
		status: innovationStatusSchema.optional(),
	});

export const innovationReviewInputSchema = z.object({
	decision: innovationReviewDecisionSchema,
	notes: z.string().trim().min(2).max(5000).nullable().optional(),
});

export const patentUpsertInputSchema = z.object({
	innovationId: z.uuid().nullable().optional(),
	title: z.string().trim().min(5).max(500),
	applicationNumber: z.string().trim().min(2).max(160).nullable().optional(),
	patentNumber: z.string().trim().min(2).max(160).nullable().optional(),
	jurisdiction: z.string().trim().min(2).max(120).nullable().optional(),
	status: patentStatusSchema.default("idea_disclosure"),
	filedOn: z.iso.date().nullable().optional(),
	grantedOn: z.iso.date().nullable().optional(),
	expiresOn: z.iso.date().nullable().optional(),
	abstract: z.string().trim().max(10000).nullable().optional(),
	claimsSummary: z.string().trim().max(10000).nullable().optional(),
	inventors: z.array(inventorInputSchema).min(1).max(25),
	supportingFiles: z
		.array(supportingFileLinkSchema)
		.max(20)
		.optional()
		.default([]),
	metadata: metadataSchema,
});

export const patentUpdateInputSchema = patentUpsertInputSchema.partial();

export const commercializationActivityInputSchema = z
	.object({
		innovationId: z.uuid().nullable().optional(),
		patentId: z.uuid().nullable().optional(),
		type: commercializationTypeSchema,
		title: z.string().trim().min(3).max(255),
		partnerName: z.string().trim().min(2).max(255).nullable().optional(),
		status: z.string().trim().min(2).max(120),
		amount: z.string().trim().min(1).max(32).nullable().optional(),
		currency: z.string().trim().length(3).toUpperCase().nullable().optional(),
		startedOn: z.iso.date().nullable().optional(),
		completedOn: z.iso.date().nullable().optional(),
		notes: z.string().trim().max(5000).nullable().optional(),
		metadata: metadataSchema,
	})
	.refine((value) => value.innovationId || value.patentId, {
		message:
			"A commercialization activity must link to an innovation or patent.",
		path: ["innovationId"],
	});

export type ResearchSubmissionInput = z.infer<
	typeof researchSubmissionInputSchema
>;
export type ResearchApprovalTransitionInput = z.infer<
	typeof researchApprovalTransitionInputSchema
>;
export type SignedUploadRequest = z.infer<typeof signedUploadRequestSchema>;
export type SignedDownloadRequest = z.infer<typeof signedDownloadRequestSchema>;
export type InnovationCreateInput = z.infer<typeof innovationCreateInputSchema>;
export type InnovationUpdateInput = z.infer<typeof innovationUpdateInputSchema>;
export type InnovationReviewInput = z.infer<typeof innovationReviewInputSchema>;
export type PatentUpsertInput = z.infer<typeof patentUpsertInputSchema>;
export type PatentUpdateInput = z.infer<typeof patentUpdateInputSchema>;
export type CommercializationActivityInput = z.infer<
	typeof commercializationActivityInputSchema
>;

export function validatePayload<T>(
	schema: z.ZodType<T>,
	payload: unknown,
): Result<T> {
	const parsed = schema.safeParse(payload);

	if (!parsed.success) {
		return fail(
			"VALIDATION_FAILED",
			"The request payload is invalid.",
			parsed.error.flatten(),
		);
	}

	return ok(parsed.data);
}
