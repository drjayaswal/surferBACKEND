CREATE TABLE "connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prompt" json DEFAULT '{}'::json,
	"answer" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
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
	"password_updated_at" timestamp with time zone,
	"api_key" text,
	"api_key_generated_at" timestamp with time zone,
	"TFA_enabled" boolean DEFAULT false,
	"activity_logs" json[] DEFAULT '{}',
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;