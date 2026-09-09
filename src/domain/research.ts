import type {
	AccessLevel,
	EntityId,
	Metadata,
	RecordStatus,
	Timestamped,
} from "./common.ts";

export type PublicationType =
	| "journal_article"
	| "conference_paper"
	| "book"
	| "book_chapter"
	| "technical_report"
	| "thesis"
	| "dissertation"
	| "working_paper"
	| "other";

export type FilePurpose =
	| "research_document"
	| "publication"
	| "innovation_support"
	| "patent_support"
	| "profile_image"
	| "research_image"
	| "other";

export type ResearchRecord = Timestamped & {
	id: EntityId;
	title: string;
	slug: string;
	abstract: string;
	status: RecordStatus;
	accessLevel: AccessLevel;
	facultyId: EntityId;
	departmentId: EntityId;
	ownerId: EntityId | null;
	researchArea: string | null;
	startedOn: string | null;
	completedOn: string | null;
	publishedAt: Date | null;
	/** Patent/prototype/innovation/commercialization status. Optional — may be added later. */
	commercializationStatus?: string | null;
	/** Funding status/needs description. Optional — may be added later. */
	fundingInfo?: string | null;
	/** Free-text note, e.g. a funding solicitation with contact details. Optional. */
	comment?: string | null;
	metadata: Metadata;
};

export type Author = Timestamped & {
	id: EntityId;
	userId: EntityId | null;
	name: string;
	email: string | null;
	affiliation: string | null;
	orcid: string | null;
};

export type Publication = Timestamped & {
	id: EntityId;
	researchRecordId: EntityId | null;
	title: string;
	type: PublicationType;
	publisher: string | null;
	journal: string | null;
	volume: string | null;
	issue: string | null;
	pages: string | null;
	doi: string | null;
	isbn: string | null;
	url: string | null;
	publishedOn: string | null;
	citation: string | null;
};

export type RepositoryFile = Timestamped & {
	id: EntityId;
	objectKey: string;
	bucket: string;
	filename: string;
	mimeType: string;
	fileSizeBytes: number;
	checksum: string | null;
	accessLevel: AccessLevel;
	purpose: FilePurpose;
	uploaderId: EntityId | null;
	researchRecordId: EntityId | null;
	publicationId: EntityId | null;
	metadata: Metadata;
};

export type Keyword = {
	id: EntityId;
	value: string;
	createdAt: Date;
};
