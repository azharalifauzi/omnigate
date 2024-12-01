-- Custom SQL migration file, put your code below! --
ALTER TABLE feature_flag_assignments ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE feature_flag_assignments ALTER COLUMN user_id DROP NOT NULL;
