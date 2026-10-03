CREATE TABLE "infinitunes_passkey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"publicKey" text NOT NULL,
	"userId" uuid NOT NULL,
	"credentialID" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"deviceType" text NOT NULL,
	"backedUp" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "infinitunes_passkey_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
ALTER TABLE "infinitunes_passkey" ADD CONSTRAINT "infinitunes_passkey_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;