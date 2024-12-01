ALTER TABLE "feature_flag_assignments" ADD CONSTRAINT "valid_user_or_org" CHECK (
        ("feature_flag_assignments"."userId" IS NOT NULL AND "feature_flag_assignments"."organizationId" IS NULL) OR
        ("feature_flag_assignments"."userId" IS NULL AND "feature_flag_assignments"."organizationId" IS NOT NULL)
      );