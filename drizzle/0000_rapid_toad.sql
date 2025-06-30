CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"otp" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"hashed_password" text,
	"refresh_token" text,
	"avatar" text,
	"avatar_uploaded_at" timestamp with time zone,
	"bio" text,
	"corpuses" jsonb[] DEFAULT '{}',
	"notes" json[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
