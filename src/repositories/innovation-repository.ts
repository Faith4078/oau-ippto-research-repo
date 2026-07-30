import type {
	CommercializationActivity,
	EntityId,
	Innovation,
	Patent,
} from "../domain/index.ts";

export type InnovationRepository = {
	findInnovationById(id: EntityId): Promise<Innovation | null>;
	findPatentById(id: EntityId): Promise<Patent | null>;
	listInnovationsByDepartment(departmentId: EntityId): Promise<Innovation[]>;
	listPatentsByInnovation(innovationId: EntityId): Promise<Patent[]>;
	listCommercializationActivities(
		target: { innovationId: EntityId } | { patentId: EntityId },
	): Promise<CommercializationActivity[]>;
};
