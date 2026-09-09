ALTER TYPE "public"."file_purpose" ADD VALUE 'research_image' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "research_records" ADD COLUMN "commercialization_status" varchar(255);--> statement-breakpoint
ALTER TABLE "research_records" ADD COLUMN "funding_info" text;--> statement-breakpoint
ALTER TABLE "research_records" ADD COLUMN "comment" text;