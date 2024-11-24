ALTER TABLE "verify_otp" RENAME TO "otp_tokens";--> statement-breakpoint
ALTER TABLE "otp_tokens" DROP CONSTRAINT "verify_otp_token_unique";--> statement-breakpoint
ALTER TABLE "otp_tokens" DROP CONSTRAINT "verify_otp_user_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_token_unique" UNIQUE("token");