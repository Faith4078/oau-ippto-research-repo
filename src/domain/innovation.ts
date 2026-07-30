import type { EntityId, Metadata, Timestamped } from "./common.ts";

export type InnovationStatus =
	| "draft"
	| "under_review"
	| "approved"
	| "published"
	| "archived";

export type PatentStatus =
	| "idea_disclosure"
	| "prior_art_search"
	| "filed"
	| "pending"
	| "granted"
	| "licensed"
	| "abandoned";

export type CommercializationType =
	| "licensing"
	| "partnership"
	| "spinout"
	| "industry_engagement"
	| "grant"
	| "milestone"
	| "other";

export type IpttoReviewDecision = "approved" | "changes_requested" | "rejected";

export type Innovation = Timestamped & {
	id: EntityId;
	title: string;
	slug: string;
	summary: string;
	status: InnovationStatus;
	facultyId: EntityId | null;
	departmentId: EntityId | null;
	leadResearcherId: EntityId | null;
	researchRecordId: EntityId | null;
	technologyReadinessLevel: number | null;
	industryApplications: string[] | null;
	intellectualPropertyNotes: string | null;
	publishedAt: Date | null;
	metadata: Metadata;
};

export type Inventor = Timestamped & {
	id: EntityId;
	userId: EntityId | null;
	name: string;
	email: string | null;
	affiliation: string | null;
};

export type Patent = Timestamped & {
	id: EntityId;
	innovationId: EntityId | null;
	title: string;
	applicationNumber: string | null;
	patentNumber: string | null;
	jurisdiction: string | null;
	status: PatentStatus;
	filedOn: string | null;
	grantedOn: string | null;
	expiresOn: string | null;
	abstract: string | null;
	claimsSummary: string | null;
	metadata: Metadata;
};

export type CommercializationActivity = Timestamped & {
	id: EntityId;
	innovationId: EntityId | null;
	patentId: EntityId | null;
	type: CommercializationType;
	title: string;
	partnerName: string | null;
	status: string;
	amount: string | null;
	currency: string | null;
	startedOn: string | null;
	completedOn: string | null;
	notes: string | null;
	createdById: EntityId | null;
	metadata: Metadata;
};
