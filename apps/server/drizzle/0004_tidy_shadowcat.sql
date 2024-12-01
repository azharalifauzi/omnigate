CREATE TABLE IF NOT EXISTS "feature_flag_assignments" (
	"featureFlagId" integer NOT NULL,
	"userId" integer,
	"organizationId" integer,
	"value" boolean,
	CONSTRAINT "feature_flag_assignments_userId_organizationId_featureFlagId_pk" PRIMARY KEY("userId","organizationId","featureFlagId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"key" varchar(255) NOT NULL,
	"defaultValue" boolean DEFAULT false NOT NULL,
	"allow_override" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_featureFlagId_feature_flags_id_fk" FOREIGN KEY ("featureFlagId") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "feature_flag_assignments_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
