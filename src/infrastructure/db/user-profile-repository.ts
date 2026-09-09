import { eq } from "drizzle-orm";

import type { EntityId, UserProfile } from "#/domain/index.ts";
import type {
	UserProfileRepository,
	UserProfileUpsertInput,
} from "#/repositories/user-profile-repository.ts";

import type { Database } from "./index.ts";
import { schema } from "./index.ts";

type UserProfileRow = typeof schema.userProfiles.$inferSelect;

export class DrizzleUserProfileRepository implements UserProfileRepository {
	constructor(private readonly database: Database) {}

	async findByUserId(userId: EntityId): Promise<UserProfile | null> {
		const [row] = await this.database
			.select()
			.from(schema.userProfiles)
			.where(eq(schema.userProfiles.userId, userId));

		return row ? mapUserProfile(row) : null;
	}

	async upsertForUser(
		userId: EntityId,
		input: UserProfileUpsertInput,
	): Promise<UserProfile> {
		const [row] = await this.database
			.insert(schema.userProfiles)
			.values({
				userId,
				...input,
			})
			.onConflictDoUpdate({
				target: schema.userProfiles.userId,
				set: {
					...input,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!row) {
			throw new Error("The profile could not be saved.");
		}

		return mapUserProfile(row);
	}
}

function mapUserProfile(row: UserProfileRow): UserProfile {
	return {
		userId: row.userId as EntityId,
		facultyId: row.facultyId as EntityId | null,
		departmentId: row.departmentId as EntityId | null,
		title: row.title,
		bio: row.bio,
		researchInterests: row.researchInterests,
		orcid: row.orcid,
		phone: row.phone,
		publicEmail: row.publicEmail,
		recoveryEmail: row.recoveryEmail,
		avatarFileId: row.avatarFileId as EntityId | null,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}
