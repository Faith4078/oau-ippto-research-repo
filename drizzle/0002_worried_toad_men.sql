ALTER TYPE "public"."user_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."user_status" ADD VALUE 'rejected' BEFORE 'suspended';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "recovery_email" varchar(320);