import type { EntityId, Timestamped } from "./common.ts";

export type UserStatus =
	| "invited"
	| "pending"
	| "active"
	| "rejected"
	| "suspended"
	| "deactivated";

export type RoleKey =
	| "visitor"
	| "lecturer"
	| "department_administrator"
	| "faculty_administrator"
	| "iptto_officer"
	| "super_administrator";

export type Faculty = Timestamped & {
	id: EntityId;
	name: string;
	slug: string;
	code: string | null;
	description: string | null;
};

export type Department = Timestamped & {
	id: EntityId;
	facultyId: EntityId;
	name: string;
	slug: string;
	code: string | null;
	description: string | null;
};

export type User = Timestamped & {
	id: EntityId;
	staffId: string;
	email: string;
	name: string;
	status: UserStatus;
	emailVerified: boolean;
	lastSignedInAt: Date | null;
};

export type UserProfile = Timestamped & {
	userId: EntityId;
	facultyId: EntityId | null;
	departmentId: EntityId | null;
	title: string | null;
	bio: string | null;
	researchInterests: string[] | null;
	orcid: string | null;
	phone: string | null;
	publicEmail: string | null;
	recoveryEmail: string | null;
	avatarFileId: EntityId | null;
};

export type Role = Timestamped & {
	id: EntityId;
	key: RoleKey | string;
	name: string;
	description: string | null;
	isSystem: boolean;
};

export type Permission = {
	id: EntityId;
	key: string;
	description: string | null;
	createdAt: Date;
};
