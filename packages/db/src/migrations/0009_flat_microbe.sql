CREATE INDEX IF NOT EXISTS "better_auth_account_user_id_idx" ON "better_auth_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "better_auth_session_user_id_idx" ON "better_auth_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "better_auth_verification_identifier_idx" ON "better_auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "infinitunes_playlist_user_id_idx" ON "infinitunes_playlist" USING btree ("userId");