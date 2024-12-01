ALTER TABLE "feature_flag_assignments" RENAME COLUMN "featureFlagId" TO "feature_flag_id";--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" DROP CONSTRAINT "valid_user_or_org";--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" DROP CONSTRAINT "feature_flag_assignments_featureFlagId_feature_flags_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" DROP CONSTRAINT "feature_flag_assignments_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" DROP CONSTRAINT "feature_flag_assignments_organizationId_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" DROP CONSTRAINT "feature_flag_assignments_userId_organizationId_featureFlagId_pk";--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_unique" UNIQUE("feature_flag_id","user_id","organization_id");--> statement-breakpoint
ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "valid_user_or_org" CHECK (
        ("feature_flag_assignments"."user_id" IS NOT NULL AND "feature_flag_assignments"."organization_id" IS NULL) OR
        ("feature_flag_assignments"."user_id" IS NULL AND "feature_flag_assignments"."organization_id" IS NOT NULL)
      );