import { and, eq, inArray, or } from "drizzle-orm";

import type {
	CommercializationRecordInput,
	InnovationManagementRepository,
	InnovationRecordInput,
	InnovationRecordUpdate,
	PatentRecordInput,
	PatentRecordUpdate,
	PublicRelatedRecords,
} from "#/application/innovation-management.ts";
import type {
	CommercializationActivity,
	EntityId,
	Innovation,
	Patent,
} from "#/domain/index.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

export class DrizzleInnovationManagementRepository
	implements InnovationManagementRepository
{
	constructor(private readonly database: Database) {}

	async createInnovation(input: InnovationRecordInput): Promise<Innovation> {
		const [innovation] = await this.database
			.insert(schema.innovations)
			.values({
				title: input.title,
				slug: createSlug(input.title),
				summary: input.summary,
				status: "under_review",
				facultyId: input.facultyId ?? null,
				departmentId: input.departmentId ?? null,
				leadResearcherId: input.leadResearcherId ?? input.createdById,
				researchRecordId: input.researchRecordId ?? null,
				technologyReadinessLevel: input.technologyReadinessLevel ?? null,
				industryApplications: input.industryApplications ?? null,
				intellectualPropertyNotes: input.intellectualPropertyNotes ?? null,
				metadata: input.metadata,
			})
			.returning();

		if (!innovation) {
			throw new Error("Innovation record could not be created.");
		}

		await this.replaceInnovationInventors(innovation.id, input.inventors);
		await this.replaceSupportingFiles({
			innovationId: innovation.id,
			patentId: null,
			files: input.supportingFiles,
		});

		return mapInnovation(innovation);
	}

	async updateInnovation(
		id: EntityId,
		input: InnovationRecordUpdate,
	): Promise<Innovation | null> {
		const values = removeUndefined({
			title: input.title,
			slug: input.title ? createSlug(input.title) : undefined,
			summary: input.summary,
			status: input.status,
			facultyId: input.facultyId,
			departmentId: input.departmentId,
			leadResearcherId: input.leadResearcherId,
			researchRecordId: input.researchRecordId,
			technologyReadinessLevel: input.technologyReadinessLevel,
			industryApplications: input.industryApplications,
			intellectualPropertyNotes: input.intellectualPropertyNotes,
			metadata: input.metadata,
			updatedAt: new Date(),
		});

		const [innovation] = await this.database
			.update(schema.innovations)
			.set(values)
			.where(eq(schema.innovations.id, id))
			.returning();

		if (!innovation) {
			return null;
		}

		if (input.inventors) {
			await this.replaceInnovationInventors(id, input.inventors);
		}

		if (input.supportingFiles) {
			await this.replaceSupportingFiles({
				innovationId: id,
				patentId: null,
				files: input.supportingFiles,
			});
		}

		return mapInnovation(innovation);
	}

	async findInnovationById(id: EntityId): Promise<Innovation | null> {
		const [innovation] = await this.database
			.select()
			.from(schema.innovations)
			.where(eq(schema.innovations.id, id));

		return innovation ? mapInnovation(innovation) : null;
	}

	async appendInnovationReview(input: {
		innovationId: EntityId;
		reviewerId: EntityId;
		decision: "approved" | "changes_requested" | "rejected";
		notes: string | null;
	}): Promise<unknown> {
		const [review] = await this.database
			.insert(schema.ipttoReviews)
			.values({
				innovationId: input.innovationId,
				reviewerId: input.reviewerId,
				decision: input.decision,
				notes: input.notes,
			})
			.returning({ id: schema.ipttoReviews.id });

		return review;
	}

	async updateInnovationStatus(
		id: EntityId,
		status: Innovation["status"],
	): Promise<Innovation | null> {
		const [innovation] = await this.database
			.update(schema.innovations)
			.set({
				status,
				publishedAt: status === "published" ? new Date() : null,
				updatedAt: new Date(),
			})
			.where(eq(schema.innovations.id, id))
			.returning();

		return innovation ? mapInnovation(innovation) : null;
	}

	async createPatent(input: PatentRecordInput): Promise<Patent> {
		const [patent] = await this.database
			.insert(schema.patents)
			.values({
				innovationId: input.innovationId ?? null,
				title: input.title,
				applicationNumber: input.applicationNumber ?? null,
				patentNumber: input.patentNumber ?? null,
				jurisdiction: input.jurisdiction ?? null,
				status: input.status,
				filedOn: input.filedOn ?? null,
				grantedOn: input.grantedOn ?? null,
				expiresOn: input.expiresOn ?? null,
				abstract: input.abstract ?? null,
				claimsSummary: input.claimsSummary ?? null,
				metadata: input.metadata,
			})
			.returning();

		if (!patent) {
			throw new Error("Patent record could not be created.");
		}

		await this.replacePatentInventors(patent.id, input.inventors);
		await this.replaceSupportingFiles({
			innovationId: null,
			patentId: patent.id,
			files: input.supportingFiles,
		});

		return mapPatent(patent);
	}

	async updatePatent(
		id: EntityId,
		input: PatentRecordUpdate,
	): Promise<Patent | null> {
		const values = removeUndefined({
			innovationId: input.innovationId,
			title: input.title,
			applicationNumber: input.applicationNumber,
			patentNumber: input.patentNumber,
			jurisdiction: input.jurisdiction,
			status: input.status,
			filedOn: input.filedOn,
			grantedOn: input.grantedOn,
			expiresOn: input.expiresOn,
			abstract: input.abstract,
			claimsSummary: input.claimsSummary,
			metadata: input.metadata,
			updatedAt: new Date(),
		});

		const [patent] = await this.database
			.update(schema.patents)
			.set(values)
			.where(eq(schema.patents.id, id))
			.returning();

		if (!patent) {
			return null;
		}

		if (input.inventors) {
			await this.replacePatentInventors(id, input.inventors);
		}

		if (input.supportingFiles) {
			await this.replaceSupportingFiles({
				innovationId: null,
				patentId: id,
				files: input.supportingFiles,
			});
		}

		return mapPatent(patent);
	}

	async findPatentById(id: EntityId): Promise<Patent | null> {
		const [patent] = await this.database
			.select()
			.from(schema.patents)
			.where(eq(schema.patents.id, id));

		return patent ? mapPatent(patent) : null;
	}

	async createCommercializationActivity(
		input: CommercializationRecordInput,
	): Promise<CommercializationActivity> {
		const [activity] = await this.database
			.insert(schema.commercializationActivities)
			.values({
				innovationId: input.innovationId ?? null,
				patentId: input.patentId ?? null,
				type: input.type,
				title: input.title,
				partnerName: input.partnerName ?? null,
				status: input.status,
				amount: input.amount ?? null,
				currency: input.currency ?? null,
				startedOn: input.startedOn ?? null,
				completedOn: input.completedOn ?? null,
				notes: input.notes ?? null,
				createdById: input.createdById,
				metadata: input.metadata,
			})
			.returning();

		if (!activity) {
			throw new Error("Commercialization activity could not be created.");
		}

		return mapCommercializationActivity(activity);
	}

	async listPublicRelatedRecords(input: {
		researchRecordId?: EntityId | null;
		innovationId?: EntityId | null;
		patentId?: EntityId | null;
	}): Promise<PublicRelatedRecords> {
		const innovationFilters = [
			eq(schema.innovations.status, "published"),
			input.researchRecordId
				? eq(schema.innovations.researchRecordId, input.researchRecordId)
				: undefined,
			input.innovationId
				? eq(schema.innovations.id, input.innovationId)
				: undefined,
		].filter(Boolean);

		const innovations =
			innovationFilters.length > 1 || input.innovationId
				? await this.database
						.select()
						.from(schema.innovations)
						.where(and(...innovationFilters))
				: [];

		const innovationIds = innovations.map((innovation) => innovation.id);
		const patentFilters = [
			input.patentId ? eq(schema.patents.id, input.patentId) : undefined,
			innovationIds.length > 0
				? inArray(schema.patents.innovationId, innovationIds)
				: undefined,
			input.innovationId
				? eq(schema.patents.innovationId, input.innovationId)
				: undefined,
		].filter(Boolean);

		const patents =
			patentFilters.length > 0
				? await this.database
						.select()
						.from(schema.patents)
						.where(or(...patentFilters))
				: [];

		const publicPatentIds = patents.map((patent) => patent.id);
		const activityFilters = [
			innovationIds.length > 0
				? inArray(
						schema.commercializationActivities.innovationId,
						innovationIds,
					)
				: undefined,
			publicPatentIds.length > 0
				? inArray(schema.commercializationActivities.patentId, publicPatentIds)
				: undefined,
		].filter(Boolean);

		const commercializationActivities =
			activityFilters.length > 0
				? await this.database
						.select()
						.from(schema.commercializationActivities)
						.where(or(...activityFilters))
				: [];

		return {
			innovations: innovations.map(mapInnovation),
			patents: patents.map(mapPatent),
			commercializationActivities: commercializationActivities.map(
				mapCommercializationActivity,
			),
		};
	}

	private async replaceInnovationInventors(
		innovationId: EntityId,
		inventors: PatentRecordInput["inventors"],
	) {
		await this.database
			.delete(schema.innovationInventors)
			.where(eq(schema.innovationInventors.innovationId, innovationId));

		await this.insertInventorLinks({
			target: "innovation",
			targetId: innovationId,
			inventors,
		});
	}

	private async replacePatentInventors(
		patentId: EntityId,
		inventors: PatentRecordInput["inventors"],
	) {
		await this.database
			.delete(schema.patentInventors)
			.where(eq(schema.patentInventors.patentId, patentId));

		await this.insertInventorLinks({
			target: "patent",
			targetId: patentId,
			inventors,
		});
	}

	private async insertInventorLinks(input: {
		target: "innovation" | "patent";
		targetId: EntityId;
		inventors: Array<{
			userId?: EntityId | null;
			name: string;
			email?: string | null;
			affiliation?: string | null;
		}>;
	}) {
		for (const [position, inventor] of input.inventors.entries()) {
			const [createdInventor] = await this.database
				.insert(schema.inventors)
				.values({
					userId: inventor.userId ?? null,
					name: inventor.name,
					email: inventor.email ?? null,
					affiliation: inventor.affiliation ?? null,
				})
				.returning({ id: schema.inventors.id });

			if (!createdInventor) {
				continue;
			}

			if (input.target === "innovation") {
				await this.database.insert(schema.innovationInventors).values({
					innovationId: input.targetId,
					inventorId: createdInventor.id,
					position,
				});
				continue;
			}

			await this.database.insert(schema.patentInventors).values({
				patentId: input.targetId,
				inventorId: createdInventor.id,
				position,
			});
		}
	}

	private async replaceSupportingFiles(input: {
		innovationId: EntityId | null;
		patentId: EntityId | null;
		files: Array<{ fileId: EntityId; label?: string | null }>;
	}) {
		if (input.innovationId) {
			await this.database
				.delete(schema.supportingFiles)
				.where(eq(schema.supportingFiles.innovationId, input.innovationId));
		}

		if (input.patentId) {
			await this.database
				.delete(schema.supportingFiles)
				.where(eq(schema.supportingFiles.patentId, input.patentId));
		}

		for (const file of input.files) {
			await this.database
				.insert(schema.supportingFiles)
				.values({
					fileId: file.fileId,
					innovationId: input.innovationId,
					patentId: input.patentId,
					label: file.label ?? null,
				})
				.onConflictDoUpdate({
					target: schema.supportingFiles.fileId,
					set: {
						innovationId: input.innovationId,
						patentId: input.patentId,
						label: file.label ?? null,
					},
				});
		}
	}
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
	return Object.fromEntries(
		Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
	) as Partial<T>;
}

function createSlug(title: string): string {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 480);

	return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapInnovation(
	innovation: typeof schema.innovations.$inferSelect,
): Innovation {
	return {
		id: innovation.id,
		title: innovation.title,
		slug: innovation.slug,
		summary: innovation.summary,
		status: innovation.status,
		facultyId: innovation.facultyId,
		departmentId: innovation.departmentId,
		leadResearcherId: innovation.leadResearcherId,
		researchRecordId: innovation.researchRecordId,
		technologyReadinessLevel: innovation.technologyReadinessLevel,
		industryApplications: innovation.industryApplications,
		intellectualPropertyNotes: innovation.intellectualPropertyNotes,
		publishedAt: innovation.publishedAt,
		metadata: innovation.metadata,
		createdAt: innovation.createdAt,
		updatedAt: innovation.updatedAt,
	};
}

function mapPatent(patent: typeof schema.patents.$inferSelect): Patent {
	return {
		id: patent.id,
		innovationId: patent.innovationId,
		title: patent.title,
		applicationNumber: patent.applicationNumber,
		patentNumber: patent.patentNumber,
		jurisdiction: patent.jurisdiction,
		status: patent.status,
		filedOn: patent.filedOn,
		grantedOn: patent.grantedOn,
		expiresOn: patent.expiresOn,
		abstract: patent.abstract,
		claimsSummary: patent.claimsSummary,
		metadata: patent.metadata,
		createdAt: patent.createdAt,
		updatedAt: patent.updatedAt,
	};
}

function mapCommercializationActivity(
	activity: typeof schema.commercializationActivities.$inferSelect,
): CommercializationActivity {
	return {
		id: activity.id,
		innovationId: activity.innovationId,
		patentId: activity.patentId,
		type: activity.type,
		title: activity.title,
		partnerName: activity.partnerName,
		status: activity.status,
		amount: activity.amount,
		currency: activity.currency,
		startedOn: activity.startedOn,
		completedOn: activity.completedOn,
		notes: activity.notes,
		createdById: activity.createdById,
		metadata: activity.metadata,
		createdAt: activity.createdAt,
		updatedAt: activity.updatedAt,
	};
}
