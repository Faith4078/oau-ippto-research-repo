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
};
