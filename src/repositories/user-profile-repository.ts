import type { EntityId, UserProfile } from "../domain/index.ts";

export type UserProfileUpsertInput = Partial<
	Pick<
		UserProfile,
		| "title"
		| "bio"
		| "researchInterests"
		| "orcid"
		| "phone"
		| "publicEmail"
		| "recoveryEmail"
		| "avatarFileId"
	>
>;

export type UserProfileRepository = {
	findByUserId(userId: EntityId): Promise<UserProfile | null>;
	/** Creates the profile row for a user if it does not exist yet, otherwise merges the given fields into it. */
	upsertForUser(
		userId: EntityId,
		input: UserProfileUpsertInput,
	): Promise<UserProfile>;
};
