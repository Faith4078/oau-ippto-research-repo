CREATE TYPE "public"."access_level" AS ENUM('public', 'restricted', 'private');--> statement-breakpoint
CREATE TYPE "public"."approval_action" AS ENUM('submitted', 'approved', 'rejected', 'changes_requested', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."commercialization_type" AS ENUM('licensing', 'partnership', 'spinout', 'industry_engagement', 'grant', 'milestone', 'other');--> statement-breakpoint
CREATE TYPE "public"."file_purpose" AS ENUM('research_document', 'publication', 'innovation_support', 'patent_support', 'profile_image', 'other');--> statement-breakpoint
CREATE TYPE "public"."innovation_status" AS ENUM('draft', 'under_review', 'approved', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."patent_status" AS ENUM('idea_disclosure', 'prior_art_search', 'filed', 'pending', 'granted', 'licensed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."publication_type" AS ENUM('journal_article', 'conference_paper', 'book', 'book_chapter', 'technical_report', 'thesis', 'dissertation', 'working_paper', 'other');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('draft', 'submitted', 'department_review', 'faculty_review', 'iptto_review', 'approved', 'rejected', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'changes_requested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "approval_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_record_id" uuid,
	"innovation_id" uuid,
	"patent_id" uuid,
	"action" "approval_action" NOT NULL,
	"from_status" varchar(120),
	"to_status" varchar(120),
	"actor_id" uuid,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(160) NOT NULL,
	"target_type" varchar(160) NOT NULL,
	"target_id" uuid,
	"ip_address" varchar(64),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" varchar(64),
	"display_username" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"affiliation" varchar(255),
	"orcid" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercialization_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"innovation_id" uuid,
	"patent_id" uuid,
	"type" "commercialization_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"partner_name" varchar(255),
	"status" varchar(120) NOT NULL,
	"amount" numeric(14, 2),
	"currency" varchar(3),
	"started_on" date,
	"completed_on" date,
	"notes" text,
	"created_by_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"code" varchar(32),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"code" varchar(32),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"checksum" varchar(255),
	"access_level" "access_level" DEFAULT 'private' NOT NULL,
	"purpose" "file_purpose" DEFAULT 'other' NOT NULL,
	"uploader_id" uuid,
	"research_record_id" uuid,
	"publication_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "innovation_inventors" (
	"innovation_id" uuid NOT NULL,
	"inventor_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "innovation_inventors_innovation_id_inventor_id_pk" PRIMARY KEY("innovation_id","inventor_id")
);
--> statement-breakpoint
CREATE TABLE "innovations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(520) NOT NULL,
	"summary" text NOT NULL,
	"status" "innovation_status" DEFAULT 'draft' NOT NULL,
	"faculty_id" uuid,
	"department_id" uuid,
	"lead_researcher_id" uuid,
	"research_record_id" uuid,
	"technology_readiness_level" integer,
	"industry_applications" text[],
	"intellectual_property_notes" text,
	"published_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"affiliation" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iptto_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"innovation_id" uuid,
	"patent_id" uuid,
	"reviewer_id" uuid,
	"decision" "review_decision" NOT NULL,
	"notes" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patent_inventors" (
	"patent_id" uuid NOT NULL,
	"inventor_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "patent_inventors_patent_id_inventor_id_pk" PRIMARY KEY("patent_id","inventor_id")
);
--> statement-breakpoint
CREATE TABLE "patents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"innovation_id" uuid,
	"title" varchar(500) NOT NULL,
	"application_number" varchar(160),
	"patent_number" varchar(160),
	"jurisdiction" varchar(120),
	"status" "patent_status" DEFAULT 'idea_disclosure' NOT NULL,
	"filed_on" date,
	"granted_on" date,
	"expires_on" date,
	"abstract" text,
	"claims_summary" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(160) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_record_id" uuid,
	"title" varchar(500) NOT NULL,
	"type" "publication_type" NOT NULL,
	"publisher" varchar(255),
	"journal" varchar(255),
	"volume" varchar(64),
	"issue" varchar(64),
	"pages" varchar(64),
	"doi" varchar(255),
	"isbn" varchar(64),
	"url" text,
	"published_on" date,
	"citation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_authors" (
	"research_record_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_corresponding" boolean DEFAULT false NOT NULL,
	"contribution" text,
	CONSTRAINT "research_authors_research_record_id_author_id_pk" PRIMARY KEY("research_record_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "research_keywords" (
	"research_record_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	CONSTRAINT "research_keywords_research_record_id_keyword_id_pk" PRIMARY KEY("research_record_id","keyword_id")
);
--> statement-breakpoint
CREATE TABLE "research_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(520) NOT NULL,
	"abstract" text NOT NULL,
	"status" "record_status" DEFAULT 'draft' NOT NULL,
	"access_level" "access_level" DEFAULT 'public' NOT NULL,
	"faculty_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"owner_id" uuid,
	"research_area" varchar(255),
	"started_on" date,
	"completed_on" date,
	"published_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(96) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supporting_files" (
	"file_id" uuid NOT NULL,
	"innovation_id" uuid,
	"patent_id" uuid,
	"label" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supporting_files_file_id_pk" PRIMARY KEY("file_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"faculty_id" uuid,
	"department_id" uuid,
	"title" varchar(64),
	"bio" text,
	"research_interests" text[],
	"orcid" varchar(32),
	"phone" varchar(64),
	"public_email" varchar(320),
	"avatar_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"faculty_id" uuid,
	"department_id" uuid,
	"assigned_by_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "user_status" DEFAULT 'invited' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_signed_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercialization_activities" ADD CONSTRAINT "commercialization_activities_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercialization_activities" ADD CONSTRAINT "commercialization_activities_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercialization_activities" ADD CONSTRAINT "commercialization_activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovation_inventors" ADD CONSTRAINT "innovation_inventors_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovation_inventors" ADD CONSTRAINT "innovation_inventors_inventor_id_inventors_id_fk" FOREIGN KEY ("inventor_id") REFERENCES "public"."inventors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovations" ADD CONSTRAINT "innovations_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovations" ADD CONSTRAINT "innovations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovations" ADD CONSTRAINT "innovations_lead_researcher_id_users_id_fk" FOREIGN KEY ("lead_researcher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovations" ADD CONSTRAINT "innovations_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventors" ADD CONSTRAINT "inventors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iptto_reviews" ADD CONSTRAINT "iptto_reviews_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iptto_reviews" ADD CONSTRAINT "iptto_reviews_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iptto_reviews" ADD CONSTRAINT "iptto_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_inventor_id_inventors_id_fk" FOREIGN KEY ("inventor_id") REFERENCES "public"."inventors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patents" ADD CONSTRAINT "patents_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_keywords" ADD CONSTRAINT "research_keywords_research_record_id_research_records_id_fk" FOREIGN KEY ("research_record_id") REFERENCES "public"."research_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_keywords" ADD CONSTRAINT "research_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_records" ADD CONSTRAINT "research_records_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_records" ADD CONSTRAINT "research_records_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_records" ADD CONSTRAINT "research_records_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supporting_files" ADD CONSTRAINT "supporting_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supporting_files" ADD CONSTRAINT "supporting_files_innovation_id_innovations_id_fk" FOREIGN KEY ("innovation_id") REFERENCES "public"."innovations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supporting_files" ADD CONSTRAINT "supporting_files_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_history_research_record_id_idx" ON "approval_history" USING btree ("research_record_id");--> statement-breakpoint
CREATE INDEX "approval_history_innovation_id_idx" ON "approval_history" USING btree ("innovation_id");--> statement-breakpoint
CREATE INDEX "approval_history_patent_id_idx" ON "approval_history" USING btree ("patent_id");--> statement-breakpoint
CREATE INDEX "approval_history_actor_id_idx" ON "approval_history" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_account_user_id_idx" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_idx" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_session_token_idx" ON "auth_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_session_user_id_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_user_email_idx" ON "auth_user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_user_username_idx" ON "auth_user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "authors_user_id_idx" ON "authors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "authors_email_idx" ON "authors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "commercialization_innovation_id_idx" ON "commercialization_activities" USING btree ("innovation_id");--> statement-breakpoint
CREATE INDEX "commercialization_patent_id_idx" ON "commercialization_activities" USING btree ("patent_id");--> statement-breakpoint
CREATE INDEX "commercialization_type_idx" ON "commercialization_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "departments_faculty_id_idx" ON "departments" USING btree ("faculty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_slug_idx" ON "departments" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "faculties_slug_idx" ON "faculties" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "faculties_code_idx" ON "faculties" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "files_object_key_idx" ON "files" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "files_uploader_id_idx" ON "files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "files_research_record_id_idx" ON "files" USING btree ("research_record_id");--> statement-breakpoint
CREATE INDEX "files_publication_id_idx" ON "files" USING btree ("publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "innovations_slug_idx" ON "innovations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "innovations_status_idx" ON "innovations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "innovations_department_id_idx" ON "innovations" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "inventors_user_id_idx" ON "inventors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "iptto_reviews_innovation_id_idx" ON "iptto_reviews" USING btree ("innovation_id");--> statement-breakpoint
CREATE INDEX "iptto_reviews_patent_id_idx" ON "iptto_reviews" USING btree ("patent_id");--> statement-breakpoint
CREATE INDEX "iptto_reviews_reviewer_id_idx" ON "iptto_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "keywords_value_idx" ON "keywords" USING btree ("value");--> statement-breakpoint
CREATE INDEX "patents_innovation_id_idx" ON "patents" USING btree ("innovation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patents_application_number_idx" ON "patents" USING btree ("application_number");--> statement-breakpoint
CREATE UNIQUE INDEX "patents_patent_number_idx" ON "patents" USING btree ("patent_number");--> statement-breakpoint
CREATE INDEX "patents_status_idx" ON "patents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_key_idx" ON "permissions" USING btree ("key");--> statement-breakpoint
CREATE INDEX "publications_research_record_id_idx" ON "publications" USING btree ("research_record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publications_doi_idx" ON "publications" USING btree ("doi");--> statement-breakpoint
CREATE INDEX "publications_type_idx" ON "publications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "research_authors_author_id_idx" ON "research_authors" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_records_slug_idx" ON "research_records" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "research_records_status_idx" ON "research_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "research_records_department_id_idx" ON "research_records" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "research_records_faculty_id_idx" ON "research_records" USING btree ("faculty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_key_idx" ON "roles" USING btree ("key");--> statement-breakpoint
CREATE INDEX "supporting_files_innovation_id_idx" ON "supporting_files" USING btree ("innovation_id");--> statement-breakpoint
CREATE INDEX "supporting_files_patent_id_idx" ON "supporting_files" USING btree ("patent_id");--> statement-breakpoint
CREATE INDEX "user_profiles_faculty_id_idx" ON "user_profiles" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "user_profiles_department_id_idx" ON "user_profiles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_roles_scope_idx" ON "user_roles" USING btree ("faculty_id","department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_staff_id_idx" ON "users" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");