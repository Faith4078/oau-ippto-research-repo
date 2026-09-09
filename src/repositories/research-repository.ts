import type {
	EntityId,
	Publication,
	RepositoryFile,
	ResearchRecord,
} from "../domain/index.ts";

export type ResearchRepository = {
	findResearchRecordById(id: EntityId): Promise<ResearchRecord | null>;
	listResearchRecordsByDepartment(
		departmentId: EntityId,
	): Promise<ResearchRecord[]>;
	listPublicationsByResearchRecord(
		researchRecordId: EntityId,
	): Promise<Publication[]>;
	listFilesByResearchRecord(
		researchRecordId: EntityId,
	): Promise<RepositoryFile[]>;
	/** Updates the editable content fields of a research record the owner still controls. */
	updateResearchRecord(
		id: EntityId,
		input: Partial<
			Pick<
				ResearchRecord,
				| "title"
				| "abstract"
				| "accessLevel"
				| "facultyId"
				| "departmentId"
				| "researchArea"
				| "startedOn"
				| "completedOn"
				| "commercializationStatus"
				| "fundingInfo"
				| "comment"
			>
		>,
	): Promise<ResearchRecord | null>;
	/** Soft-deletes a research record by transitioning it to the "archived" status. */
	archiveResearchRecord(id: EntityId): Promise<ResearchRecord | null>;
};
