import {
	bigint,
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
	"invited",
	"active",
	"suspended",
	"deactivated",
]);

export const authUser = pgTable(
	"auth_user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		image: text("image"),
		username: varchar("username", { length: 64 }),
		displayUsername: varchar("display_username", { length: 64 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		emailIdx: uniqueIndex("auth_user_email_idx").on(table.email),
		usernameIdx: uniqueIndex("auth_user_username_idx").on(table.username),
	}),
);

export const authSession = pgTable(
	"auth_session",
	{
		id: text("id").primaryKey(),
		token: text("token").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		tokenIdx: uniqueIndex("auth_session_token_idx").on(table.token),
		userIdx: index("auth_session_user_id_idx").on(table.userId),
	}),
);

export const authAccount = pgTable(
	"auth_account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdx: index("auth_account_user_id_idx").on(table.userId),
		providerAccountIdx: uniqueIndex("auth_account_provider_account_idx").on(
			table.providerId,
			table.accountId,
		),
	}),
);

export const authVerification = pgTable(
	"auth_verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => ({
		identifierIdx: index("auth_verification_identifier_idx").on(
			table.identifier,
		),
	}),
);

export const publicationTypeEnum = pgEnum("publication_type", [
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

export const recordStatusEnum = pgEnum("record_status", [
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

export const accessLevelEnum = pgEnum("access_level", [
	"public",
	"restricted",
	"private",
]);

export const filePurposeEnum = pgEnum("file_purpose", [
	"research_document",
	"publication",
	"innovation_support",
	"patent_support",
	"profile_image",
	"other",
]);

export const innovationStatusEnum = pgEnum("innovation_status", [
	"draft",
	"under_review",
	"approved",
	"published",
	"archived",
]);

export const patentStatusEnum = pgEnum("patent_status", [
	"idea_disclosure",
	"prior_art_search",
	"filed",
	"pending",
	"granted",
	"licensed",
	"abandoned",
]);

export const commercializationTypeEnum = pgEnum("commercialization_type", [
	"licensing",
	"partnership",
	"spinout",
	"industry_engagement",
	"grant",
	"milestone",
	"other",
]);

export const reviewDecisionEnum = pgEnum("review_decision", [
	"approved",
	"changes_requested",
	"rejected",
]);

export const approvalActionEnum = pgEnum("approval_action", [
	"submitted",
	"approved",
	"rejected",
	"changes_requested",
	"published",
	"archived",
]);

export const faculties = pgTable(
	"faculties",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		code: varchar("code", { length: 32 }),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		slugIdx: uniqueIndex("faculties_slug_idx").on(table.slug),
		codeIdx: uniqueIndex("faculties_code_idx").on(table.code),
	}),
);

export const departments = pgTable(
	"departments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		facultyId: uuid("faculty_id")
			.notNull()
			.references(() => faculties.id, { onDelete: "restrict" }),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		code: varchar("code", { length: 32 }),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		facultyIdx: index("departments_faculty_id_idx").on(table.facultyId),
		slugIdx: uniqueIndex("departments_slug_idx").on(table.slug),
		codeIdx: uniqueIndex("departments_code_idx").on(table.code),
	}),
);

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		staffId: varchar("staff_id", { length: 64 }).notNull(),
		email: varchar("email", { length: 320 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		status: userStatusEnum("status").default("invited").notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		lastSignedInAt: timestamp("last_signed_in_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		staffIdIdx: uniqueIndex("users_staff_id_idx").on(table.staffId),
		emailIdx: uniqueIndex("users_email_idx").on(table.email),
		statusIdx: index("users_status_idx").on(table.status),
	}),
);

export const userProfiles = pgTable(
	"user_profiles",
	{
		userId: uuid("user_id")
			.primaryKey()
			.references(() => users.id, { onDelete: "cascade" }),
		facultyId: uuid("faculty_id").references(() => faculties.id, {
			onDelete: "set null",
		}),
		departmentId: uuid("department_id").references(() => departments.id, {
			onDelete: "set null",
		}),
		title: varchar("title", { length: 64 }),
		bio: text("bio"),
		researchInterests: text("research_interests").array(),
		orcid: varchar("orcid", { length: 32 }),
		phone: varchar("phone", { length: 64 }),
		publicEmail: varchar("public_email", { length: 320 }),
		avatarFileId: uuid("avatar_file_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		facultyIdx: index("user_profiles_faculty_id_idx").on(table.facultyId),
		departmentIdx: index("user_profiles_department_id_idx").on(
			table.departmentId,
		),
	}),
);

export const roles = pgTable(
	"roles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		key: varchar("key", { length: 96 }).notNull(),
		name: varchar("name", { length: 160 }).notNull(),
		description: text("description"),
		isSystem: boolean("is_system").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		keyIdx: uniqueIndex("roles_key_idx").on(table.key),
	}),
);

export const permissions = pgTable(
	"permissions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		key: varchar("key", { length: 160 }).notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		keyIdx: uniqueIndex("permissions_key_idx").on(table.key),
	}),
);

export const rolePermissions = pgTable(
	"role_permissions",
	{
		roleId: uuid("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permissionId: uuid("permission_id")
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
	}),
);

export const userRoles = pgTable(
	"user_roles",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: uuid("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		facultyId: uuid("faculty_id").references(() => faculties.id, {
			onDelete: "cascade",
		}),
		departmentId: uuid("department_id").references(() => departments.id, {
			onDelete: "cascade",
		}),
		assignedById: uuid("assigned_by_id").references(() => users.id, {
			onDelete: "set null",
		}),
		assignedAt: timestamp("assigned_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.roleId] }),
		roleIdx: index("user_roles_role_id_idx").on(table.roleId),
		scopeIdx: index("user_roles_scope_idx").on(
			table.facultyId,
			table.departmentId,
		),
	}),
);

export const backgroundJobs = pgTable(
	"background_jobs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: varchar("type", { length: 80 }).notNull(),
		status: varchar("status", { length: 32 }).default("queued").notNull(),
		payload: jsonb("payload")
			.$type<
				Record<string, string | number | boolean | null | readonly string[]>
			>()
			.default({})
			.notNull(),
		priority: varchar("priority", { length: 20 }).default("normal").notNull(),
		attempts: integer("attempts").default(0).notNull(),
		maxAttempts: integer("max_attempts").default(3).notNull(),
		errorMessage: text("error_message"),
		queuedAt: timestamp("queued_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		failedAt: timestamp("failed_at", { withTimezone: true }),
	},
	(table) => ({
		statusIdx: index("background_jobs_status_idx").on(table.status),
		typeIdx: index("background_jobs_type_idx").on(table.type),
		updatedAtIdx: index("background_jobs_updated_at_idx").on(table.updatedAt),
	}),
);

export const rateLimitWindows = pgTable(
	"rate_limit_windows",
	{
		key: text("key").primaryKey(),
		bucket: varchar("bucket", { length: 80 }).notNull(),
		identity: text("identity").notNull(),
		count: integer("count").default(0).notNull(),
		resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		bucketResetIdx: index("rate_limit_windows_bucket_reset_idx").on(
			table.bucket,
			table.resetAt,
		),
	}),
);

export const researchRecords = pgTable(
	"research_records",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		title: varchar("title", { length: 500 }).notNull(),
		slug: varchar("slug", { length: 520 }).notNull(),
		abstract: text("abstract").notNull(),
		status: recordStatusEnum("status").default("draft").notNull(),
		accessLevel: accessLevelEnum("access_level").default("public").notNull(),
		facultyId: uuid("faculty_id")
			.notNull()
			.references(() => faculties.id, { onDelete: "restrict" }),
		departmentId: uuid("department_id")
			.notNull()
			.references(() => departments.id, { onDelete: "restrict" }),
		ownerId: uuid("owner_id").references(() => users.id, {
			onDelete: "set null",
		}),
		researchArea: varchar("research_area", { length: 255 }),
		startedOn: date("started_on"),
		completedOn: date("completed_on"),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		slugIdx: uniqueIndex("research_records_slug_idx").on(table.slug),
		statusIdx: index("research_records_status_idx").on(table.status),
		departmentIdx: index("research_records_department_id_idx").on(
			table.departmentId,
		),
		facultyIdx: index("research_records_faculty_id_idx").on(table.facultyId),
	}),
);

export const authors = pgTable(
	"authors",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		email: varchar("email", { length: 320 }),
		affiliation: varchar("affiliation", { length: 255 }),
		orcid: varchar("orcid", { length: 32 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdx: index("authors_user_id_idx").on(table.userId),
		emailIdx: index("authors_email_idx").on(table.email),
	}),
);

export const researchAuthors = pgTable(
	"research_authors",
	{
		researchRecordId: uuid("research_record_id")
			.notNull()
			.references(() => researchRecords.id, { onDelete: "cascade" }),
		authorId: uuid("author_id")
			.notNull()
			.references(() => authors.id, { onDelete: "cascade" }),
		position: integer("position").default(0).notNull(),
		isCorresponding: boolean("is_corresponding").default(false).notNull(),
		contribution: text("contribution"),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.researchRecordId, table.authorId] }),
		authorIdx: index("research_authors_author_id_idx").on(table.authorId),
	}),
);

export const keywords = pgTable(
	"keywords",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		value: varchar("value", { length: 120 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		valueIdx: uniqueIndex("keywords_value_idx").on(table.value),
	}),
);

export const researchKeywords = pgTable(
	"research_keywords",
	{
		researchRecordId: uuid("research_record_id")
			.notNull()
			.references(() => researchRecords.id, { onDelete: "cascade" }),
		keywordId: uuid("keyword_id")
			.notNull()
			.references(() => keywords.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.researchRecordId, table.keywordId] }),
	}),
);

export const publications = pgTable(
	"publications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		researchRecordId: uuid("research_record_id").references(
			() => researchRecords.id,
			{
				onDelete: "set null",
			},
		),
		title: varchar("title", { length: 500 }).notNull(),
		type: publicationTypeEnum("type").notNull(),
		publisher: varchar("publisher", { length: 255 }),
		journal: varchar("journal", { length: 255 }),
		volume: varchar("volume", { length: 64 }),
		issue: varchar("issue", { length: 64 }),
		pages: varchar("pages", { length: 64 }),
		doi: varchar("doi", { length: 255 }),
		isbn: varchar("isbn", { length: 64 }),
		url: text("url"),
		publishedOn: date("published_on"),
		citation: text("citation"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		researchIdx: index("publications_research_record_id_idx").on(
			table.researchRecordId,
		),
		doiIdx: uniqueIndex("publications_doi_idx").on(table.doi),
		typeIdx: index("publications_type_idx").on(table.type),
	}),
);

export const files = pgTable(
	"files",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		objectKey: text("object_key").notNull(),
		bucket: varchar("bucket", { length: 255 }).notNull(),
		filename: varchar("filename", { length: 255 }).notNull(),
		mimeType: varchar("mime_type", { length: 255 }).notNull(),
		fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
		checksum: varchar("checksum", { length: 255 }),
		accessLevel: accessLevelEnum("access_level").default("private").notNull(),
		purpose: filePurposeEnum("purpose").default("other").notNull(),
		uploaderId: uuid("uploader_id").references(() => users.id, {
			onDelete: "set null",
		}),
		researchRecordId: uuid("research_record_id").references(
			() => researchRecords.id,
			{
				onDelete: "cascade",
			},
		),
		publicationId: uuid("publication_id").references(() => publications.id, {
			onDelete: "cascade",
		}),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		objectKeyIdx: uniqueIndex("files_object_key_idx").on(table.objectKey),
		uploaderIdx: index("files_uploader_id_idx").on(table.uploaderId),
		researchIdx: index("files_research_record_id_idx").on(
			table.researchRecordId,
		),
		publicationIdx: index("files_publication_id_idx").on(table.publicationId),
	}),
);

export const innovations = pgTable(
	"innovations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		title: varchar("title", { length: 500 }).notNull(),
		slug: varchar("slug", { length: 520 }).notNull(),
		summary: text("summary").notNull(),
		status: innovationStatusEnum("status").default("draft").notNull(),
		facultyId: uuid("faculty_id").references(() => faculties.id, {
			onDelete: "set null",
		}),
		departmentId: uuid("department_id").references(() => departments.id, {
			onDelete: "set null",
		}),
		leadResearcherId: uuid("lead_researcher_id").references(() => users.id, {
			onDelete: "set null",
		}),
		researchRecordId: uuid("research_record_id").references(
			() => researchRecords.id,
			{
				onDelete: "set null",
			},
		),
		technologyReadinessLevel: integer("technology_readiness_level"),
		industryApplications: text("industry_applications").array(),
		intellectualPropertyNotes: text("intellectual_property_notes"),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		slugIdx: uniqueIndex("innovations_slug_idx").on(table.slug),
		statusIdx: index("innovations_status_idx").on(table.status),
		departmentIdx: index("innovations_department_id_idx").on(
			table.departmentId,
		),
	}),
);

export const inventors = pgTable(
	"inventors",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		email: varchar("email", { length: 320 }),
		affiliation: varchar("affiliation", { length: 255 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdx: index("inventors_user_id_idx").on(table.userId),
	}),
);

export const innovationInventors = pgTable(
	"innovation_inventors",
	{
		innovationId: uuid("innovation_id")
			.notNull()
			.references(() => innovations.id, { onDelete: "cascade" }),
		inventorId: uuid("inventor_id")
			.notNull()
			.references(() => inventors.id, { onDelete: "cascade" }),
		position: integer("position").default(0).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.innovationId, table.inventorId] }),
	}),
);

export const patents = pgTable(
	"patents",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		innovationId: uuid("innovation_id").references(() => innovations.id, {
			onDelete: "set null",
		}),
		title: varchar("title", { length: 500 }).notNull(),
		applicationNumber: varchar("application_number", { length: 160 }),
		patentNumber: varchar("patent_number", { length: 160 }),
		jurisdiction: varchar("jurisdiction", { length: 120 }),
		status: patentStatusEnum("status").default("idea_disclosure").notNull(),
		filedOn: date("filed_on"),
		grantedOn: date("granted_on"),
		expiresOn: date("expires_on"),
		abstract: text("abstract"),
		claimsSummary: text("claims_summary"),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		innovationIdx: index("patents_innovation_id_idx").on(table.innovationId),
		applicationIdx: uniqueIndex("patents_application_number_idx").on(
			table.applicationNumber,
		),
		patentNumberIdx: uniqueIndex("patents_patent_number_idx").on(
			table.patentNumber,
		),
		statusIdx: index("patents_status_idx").on(table.status),
	}),
);

export const patentInventors = pgTable(
	"patent_inventors",
	{
		patentId: uuid("patent_id")
			.notNull()
			.references(() => patents.id, { onDelete: "cascade" }),
		inventorId: uuid("inventor_id")
			.notNull()
			.references(() => inventors.id, { onDelete: "cascade" }),
		position: integer("position").default(0).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.patentId, table.inventorId] }),
	}),
);

export const commercializationActivities = pgTable(
	"commercialization_activities",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		innovationId: uuid("innovation_id").references(() => innovations.id, {
			onDelete: "cascade",
		}),
		patentId: uuid("patent_id").references(() => patents.id, {
			onDelete: "cascade",
		}),
		type: commercializationTypeEnum("type").notNull(),
		title: varchar("title", { length: 255 }).notNull(),
		partnerName: varchar("partner_name", { length: 255 }),
		status: varchar("status", { length: 120 }).notNull(),
		amount: numeric("amount", { precision: 14, scale: 2 }),
		currency: varchar("currency", { length: 3 }),
		startedOn: date("started_on"),
		completedOn: date("completed_on"),
		notes: text("notes"),
		createdById: uuid("created_by_id").references(() => users.id, {
			onDelete: "set null",
		}),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		innovationIdx: index("commercialization_innovation_id_idx").on(
			table.innovationId,
		),
		patentIdx: index("commercialization_patent_id_idx").on(table.patentId),
		typeIdx: index("commercialization_type_idx").on(table.type),
	}),
);

export const ipttoReviews = pgTable(
	"iptto_reviews",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		innovationId: uuid("innovation_id").references(() => innovations.id, {
			onDelete: "cascade",
		}),
		patentId: uuid("patent_id").references(() => patents.id, {
			onDelete: "cascade",
		}),
		reviewerId: uuid("reviewer_id").references(() => users.id, {
			onDelete: "set null",
		}),
		decision: reviewDecisionEnum("decision").notNull(),
		notes: text("notes"),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		innovationIdx: index("iptto_reviews_innovation_id_idx").on(
			table.innovationId,
		),
		patentIdx: index("iptto_reviews_patent_id_idx").on(table.patentId),
		reviewerIdx: index("iptto_reviews_reviewer_id_idx").on(table.reviewerId),
	}),
);

export const supportingFiles = pgTable(
	"supporting_files",
	{
		fileId: uuid("file_id")
			.notNull()
			.references(() => files.id, { onDelete: "cascade" }),
		innovationId: uuid("innovation_id").references(() => innovations.id, {
			onDelete: "cascade",
		}),
		patentId: uuid("patent_id").references(() => patents.id, {
			onDelete: "cascade",
		}),
		label: varchar("label", { length: 255 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.fileId] }),
		innovationIdx: index("supporting_files_innovation_id_idx").on(
			table.innovationId,
		),
		patentIdx: index("supporting_files_patent_id_idx").on(table.patentId),
	}),
);

export const approvalHistory = pgTable(
	"approval_history",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		researchRecordId: uuid("research_record_id").references(
			() => researchRecords.id,
			{
				onDelete: "cascade",
			},
		),
		innovationId: uuid("innovation_id").references(() => innovations.id, {
			onDelete: "cascade",
		}),
		patentId: uuid("patent_id").references(() => patents.id, {
			onDelete: "cascade",
		}),
		action: approvalActionEnum("action").notNull(),
		fromStatus: varchar("from_status", { length: 120 }),
		toStatus: varchar("to_status", { length: 120 }),
		actorId: uuid("actor_id").references(() => users.id, {
			onDelete: "set null",
		}),
		comment: text("comment"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		researchIdx: index("approval_history_research_record_id_idx").on(
			table.researchRecordId,
		),
		innovationIdx: index("approval_history_innovation_id_idx").on(
			table.innovationId,
		),
		patentIdx: index("approval_history_patent_id_idx").on(table.patentId),
		actorIdx: index("approval_history_actor_id_idx").on(table.actorId),
	}),
);

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		actorId: uuid("actor_id").references(() => users.id, {
			onDelete: "set null",
		}),
		action: varchar("action", { length: 160 }).notNull(),
		targetType: varchar("target_type", { length: 160 }).notNull(),
		targetId: uuid("target_id"),
		ipAddress: varchar("ip_address", { length: 64 }),
		userAgent: text("user_agent"),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		actorIdx: index("audit_logs_actor_id_idx").on(table.actorId),
		targetIdx: index("audit_logs_target_idx").on(
			table.targetType,
			table.targetId,
		),
		actionIdx: index("audit_logs_action_idx").on(table.action),
		createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
	}),
);
